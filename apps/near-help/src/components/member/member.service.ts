import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LoginInput, MemberInput } from '../../libs/dto/member/member.input';
import { Member } from '../../libs/dto/member/member';
import { MemberStatus } from '../../libs/enums/member.enum';
import { Message } from '../../libs/enums/common.enum';

@Injectable()
export class MemberService {
	constructor(@InjectModel('Member') private readonly memberModel: Model<Member>) {}

	public async signup(input: MemberInput): Promise<Member> {
		//  TODO: Hash password

		try {
			const result = await this.memberModel.create(input);
			// TODO: Authentication via TOKENs
			return result;
		} catch (err: unknown) {
			console.log('Error, Service.model:', err);
			const mongoError = err as { code?: number };
			if (mongoError?.code === 11000) {
				throw new ConflictException(Message.USED_MEMBER_NICK_OR_PHONE);
			}
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async login(input: LoginInput): Promise<Member> {
		const { memberNick, memberPassword } = input;
		const response = await this.memberModel.findOne({ memberNick: memberNick }).select('+memberPassword').exec();

		if (!response || response.memberStatus === MemberStatus.DELETED) {
			throw new UnauthorizedException(Message.NO_MEMBER_NICK);
		} else if (response.memberStatus === MemberStatus.BLOCKED) {
			throw new ForbiddenException(Message.BLOCKED_USER);
		}

		// TODO: Compare passwords
		const isMatch = memberPassword === response.memberPassword;
		if (!isMatch) throw new UnauthorizedException(Message.WRONG_PASSWORD);

		return response;
	}

	public async updateMember(): Promise<string> {
		await Promise.resolve();
		return 'updateMember executed!';
	}

	public async getMember(): Promise<string> {
		await Promise.resolve();
		return 'getMember executed!';
	}
}
