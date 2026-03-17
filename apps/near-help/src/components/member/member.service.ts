import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LoginInput, MemberInput } from '../../libs/dto/member/member.input';
import { Member } from '../../libs/dto/member/member';
import { MemberStatus } from '../../libs/enums/member.enum';
import { Message } from '../../libs/enums/common.enum';
import { AuthService } from '../auth/auth.service';
import { AuthResponse, AuthTokens, LogoutResponse } from '../../libs/dto/auth/auth';
import { LogoutInput, RefreshTokenInput } from '../../libs/dto/auth/auth.input';

@Injectable()
export class MemberService {
	constructor(
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		private readonly authService: AuthService,
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

	public async updateMember(): Promise<string> {
		await Promise.resolve();
		return 'updateMember executed!';
	}

	public async getMember(): Promise<string> {
		await Promise.resolve();
		return 'getMember executed!';
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
}
