import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
	GetAgentsInput,
	GetAllMembersByAdminInput,
	GetMemberInput,
	LoginInput,
	MemberInput,
	UpdateMemberByAdminInput,
	UpdateMemberInput,
} from '../../libs/dto/member/member.input';
import { AgentsResult, Member, MemberPrivate, MembersByAdminResult } from '../../libs/dto/member/member';
import { AgentSort, MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { Message } from '../../libs/enums/common.enum';
import { AuthService } from '../auth/auth.service';
import { AuthResponse, AuthTokens, LogoutResponse } from '../../libs/dto/auth/auth';
import { LogoutInput, RefreshTokenInput } from '../../libs/dto/auth/auth.input';
import { ViewService } from '../view/view.service';
import { ViewGroup } from '../../libs/enums/view.enum';
import { lookupAuthMemberFollowed, lookupAuthMemberLiked } from '../../libs/config';
import { LikeGroup } from '../../libs/enums/like.enum';
import { AuthMemberPayload } from '../../libs/types/auth';

type AgentsAggregateResult = {
	list: Member[];
	metaCounter: Array<{ total: number }>;
};

@Injectable()
export class MemberService {
	constructor(
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		private readonly authService: AuthService,
		private readonly viewService: ViewService,
	) {}

	public async signup(input: MemberInput): Promise<AuthResponse> {
		const hashedPassword = await this.authService.hashPassword(input.memberPassword);
		const signupInput = { ...input, memberPassword: hashedPassword };

		try {
			const createdMember = await this.memberModel.create(signupInput);
			return this.issueTokensForMember(createdMember._id);
		} catch (err: unknown) {
			const errMessage = err instanceof Error ? err.message : String(err);
			console.log('Error, Service.model:', errMessage);
			const mongoError = err as { code?: number };
			if (mongoError?.code === 11000) {
				throw new ConflictException(Message.USED_MEMBER_NICK_OR_PHONE);
			}
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async login(input: LoginInput): Promise<AuthResponse> {
		const { memberNick, memberPassword } = input;
		const response = await this.memberModel
			.findOne({ memberNick: memberNick })
			.select('+memberPassword +memberRefreshToken')
			.exec();

		if (!response || response.memberStatus === MemberStatus.DELETED) {
			throw new UnauthorizedException(Message.INVALID_CREDENTIALS);
		} else if (response.memberStatus === MemberStatus.BLOCKED) {
			throw new ForbiddenException(Message.BLOCKED_USER);
		}

		if (!response.memberPassword) {
			throw new UnauthorizedException(Message.INVALID_CREDENTIALS);
		}

		const isMatch = await this.authService.comparePassword(memberPassword, response.memberPassword);
		if (!isMatch) throw new UnauthorizedException(Message.INVALID_CREDENTIALS);

		return this.issueTokensForMember(response._id);
	}

	public async refreshTokens(input: RefreshTokenInput): Promise<AuthTokens> {
		const payload = await this.authService.verifyRefreshToken(input.refreshToken);
		const member = await this.memberModel.findById(payload.sub).select('+memberRefreshToken').exec();

		if (!member || member.memberStatus === MemberStatus.DELETED) {
			throw new UnauthorizedException(Message.INVALID_REFRESH_TOKEN);
		} else if (member.memberStatus === MemberStatus.BLOCKED) {
			throw new ForbiddenException(Message.BLOCKED_USER);
		}

		if (!member.memberRefreshToken) {
			throw new UnauthorizedException(Message.INVALID_REFRESH_TOKEN);
		}

		const isRefreshTokenValid = await this.authService.compareRefreshToken(
			input.refreshToken,
			member.memberRefreshToken,
		);

		if (!isRefreshTokenValid) {
			throw new UnauthorizedException(Message.INVALID_REFRESH_TOKEN);
		}

		const tokenSet = await this.authService.issueTokenPair(member);
		const hashedRefreshToken = await this.authService.hashRefreshToken(tokenSet.refreshToken);

		await this.memberModel
			.updateOne(
				{ _id: member._id },
				{
					$set: {
						memberRefreshToken: hashedRefreshToken,
						memberRefreshTokenExpiresAt: tokenSet.refreshTokenExpiresAt ?? null,
					},
				},
			)
			.exec();

		return {
			accessToken: tokenSet.accessToken,
			refreshToken: tokenSet.refreshToken,
		};
	}

	public async logout(input: LogoutInput): Promise<LogoutResponse> {
		const payload = await this.authService.verifyRefreshToken(input.refreshToken);
		const member = await this.memberModel.findById(payload.sub).select('+memberRefreshToken').exec();

		if (!member || !member.memberRefreshToken) {
			throw new UnauthorizedException(Message.INVALID_REFRESH_TOKEN);
		}

		const isRefreshTokenValid = await this.authService.compareRefreshToken(
			input.refreshToken,
			member.memberRefreshToken,
		);

		if (!isRefreshTokenValid) {
			throw new UnauthorizedException(Message.INVALID_REFRESH_TOKEN);
		}

		await this.memberModel
			.updateOne(
				{ _id: member._id },
				{
					$unset: {
						memberRefreshToken: 1,
						memberRefreshTokenExpiresAt: 1,
					},
				},
			)
			.exec();

		return { message: Message.LOGOUT_SUCCESS };
	}

	public async updateMember(memberId: string, input: UpdateMemberInput): Promise<Member> {
		const payload = Object.fromEntries(
			Object.entries(input).filter(([, value]) => typeof value !== 'undefined' && value !== null),
		);
		if (Object.keys(payload).length === 0) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		const existingMember = await this.memberModel.findById(memberId).exec();
		if (!existingMember || existingMember.memberStatus === MemberStatus.DELETED) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}
		if (existingMember.memberStatus === MemberStatus.BLOCKED) {
			throw new ForbiddenException(Message.BLOCKED_USER);
		}

		try {
			const updatedMember = await this.memberModel
				.findByIdAndUpdate(memberId, { $set: payload }, { new: true })
				.exec();

			if (!updatedMember) {
				throw new NotFoundException(Message.NO_DATA_FOUND);
			}

			return updatedMember;
		} catch (err: unknown) {
			const mongoError = err as { code?: number };
			if (mongoError?.code === 11000) {
				throw new ConflictException(Message.USED_MEMBER_NICK_OR_PHONE);
			}
			throw err;
		}
	}

	public async getMember(memberId: string, targetMemberId?: GetMemberInput['targetMemberId']): Promise<MemberPrivate> {
		const lookupMemberId = targetMemberId ?? memberId;
		const member = await this.memberModel.findById(lookupMemberId).exec();

		if (!member || member.memberStatus === MemberStatus.DELETED) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}

		if (member.memberStatus === MemberStatus.BLOCKED) {
			throw new ForbiddenException(Message.BLOCKED_USER);
		}

		if (lookupMemberId !== memberId && memberId) {
			const createdView = await this.viewService.recordView({
				memberId,
				viewGroup: ViewGroup.MEMBER,
				viewRefId: lookupMemberId,
			});

			if (createdView) {
				await this.memberModel.updateOne({ _id: lookupMemberId }, { $inc: { memberViews: 1 } }).exec();
				member.memberViews += 1;
			}
		}

		return member as MemberPrivate;
	}

	public async getAgents(authMember: AuthMemberPayload | null, input?: GetAgentsInput): Promise<AgentsResult> {
		const filter: Record<string, unknown> = {
			memberType: MemberType.AGENT,
			memberStatus: MemberStatus.ACTIVE,
		};

		const searchText = input?.searchText?.trim();
		if (searchText) {
			const regex = new RegExp(searchText, 'i');
			filter.$or = [{ memberNick: regex }, { memberFullName: regex }, { memberAddress: regex }, { memberDesc: regex }];
		}

		const memberAddress = input?.memberAddress?.trim();
		if (memberAddress) {
			filter.memberAddress = new RegExp(memberAddress, 'i');
		}

		const page = input?.page && input.page > 0 ? input.page : 1;
		const limit = input?.limit && input.limit > 0 ? Math.min(input.limit, 100) : 20;
		const sort = this.getAgentSort(input?.sortBy);
		const data = await this.memberModel
			.aggregate<AgentsAggregateResult>([
				{ $match: filter },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (page - 1) * limit },
							{ $limit: limit },
							...lookupAuthMemberFollowed(authMember?._id),
							...lookupAuthMemberLiked(authMember?._id, LikeGroup.MEMBER),
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		const totalCount = data[0]?.metaCounter?.[0]?.total ?? 0;
		const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / limit);

		return {
			list: data[0]?.list ?? [],
			meta: {
				totalCount,
				page,
				limit,
				totalPages,
				hasNextPage: totalPages > 0 && page < totalPages,
				hasPrevPage: page > 1 && totalPages > 0,
			},
		};
	}

	public async getAllMembersByAdmin(input?: GetAllMembersByAdminInput): Promise<MembersByAdminResult> {
		const filter: Record<string, unknown> = {};

		if (input?.memberType) {
			filter.memberType = input.memberType;
		}

		if (input?.memberStatus) {
			filter.memberStatus = input.memberStatus;
		}

		const searchText = input?.searchText?.trim();
		if (searchText) {
			const regex = new RegExp(searchText, 'i');
			filter.$or = [
				{ memberNick: regex },
				{ memberFullName: regex },
				{ memberPhone: regex },
				{ memberEmail: regex },
				{ memberTelegramId: regex },
				{ memberAddress: regex },
				{ memberDesc: regex },
			];
		}

		const page = input?.page && input.page > 0 ? input.page : 1;
		const limit = input?.limit && input.limit > 0 ? Math.min(input.limit, 100) : 20;
		const totalCount = await this.memberModel.countDocuments(filter).exec();

		const members = await this.memberModel
			.find(filter)
			.sort({ createdAt: -1 })
			.skip((page - 1) * limit)
			.limit(limit)
			.exec();

		const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / limit);

		return {
			list: members as MemberPrivate[],
			meta: {
				totalCount,
				page,
				limit,
				totalPages,
				hasNextPage: totalPages > 0 && page < totalPages,
				hasPrevPage: page > 1 && totalPages > 0,
			},
		};
	}

	public async updateMemberByAdmin(input: UpdateMemberByAdminInput): Promise<MemberPrivate> {
		const { targetMemberId, ...rest } = input;
		const payload = Object.fromEntries(
			Object.entries(rest).filter(([, value]) => typeof value !== 'undefined' && value !== null),
		);

		if (!targetMemberId || Object.keys(payload).length === 0) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		const existingMember = await this.memberModel.findById(targetMemberId).exec();
		if (!existingMember) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}

		try {
			const updatedMember = await this.memberModel
				.findByIdAndUpdate(targetMemberId, { $set: payload }, { new: true, runValidators: true })
				.exec();

			if (!updatedMember) {
				throw new NotFoundException(Message.NO_DATA_FOUND);
			}

			return updatedMember as MemberPrivate;
		} catch (err: unknown) {
			const mongoError = err as { code?: number };
			if (mongoError?.code === 11000) {
				throw new ConflictException(Message.USED_MEMBER_NICK_OR_PHONE);
			}
			throw err;
		}
	}

	private async issueTokensForMember(memberId: unknown): Promise<AuthResponse> {
		const member = await this.memberModel.findById(memberId).exec();

		if (!member || member.memberStatus === MemberStatus.DELETED) {
			throw new UnauthorizedException(Message.INVALID_CREDENTIALS);
		} else if (member.memberStatus === MemberStatus.BLOCKED) {
			throw new ForbiddenException(Message.BLOCKED_USER);
		}

		const tokenSet = await this.authService.issueTokenPair(member);
		const hashedRefreshToken = await this.authService.hashRefreshToken(tokenSet.refreshToken);

		await this.memberModel
			.updateOne(
				{ _id: member._id },
				{
					$set: {
						memberRefreshToken: hashedRefreshToken,
						memberRefreshTokenExpiresAt: tokenSet.refreshTokenExpiresAt ?? null,
					},
				},
			)
			.exec();

		return {
			member,
			accessToken: tokenSet.accessToken,
			refreshToken: tokenSet.refreshToken,
		};
	}

	private getAgentSort(sortBy?: AgentSort): Record<string, 1 | -1> {
		switch (sortBy) {
			case AgentSort.OLDER:
				return { createdAt: 1 };
			case AgentSort.LIKES:
				return { memberLikes: -1, createdAt: -1 };
			case AgentSort.VIEWS:
				return { memberViews: -1, createdAt: -1 };
			case AgentSort.RECENT:
			default:
				return { createdAt: -1 };
		}
	}
}
