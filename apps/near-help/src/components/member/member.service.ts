import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LoginInput, MemberInput } from '../../libs/dto/member/member.input';
import { Member } from '../../libs/dto/member/member';

@Injectable()
export class MemberService {
	constructor(@InjectModel('Member') private readonly memberModel: Model<Member>) {}

	public async signup(input: MemberInput): Promise<Member> {
		//  TODO: Hash password

		try {
			const result = await this.memberModel.create(input);
			// TODO: Authentication via TOKENs
			return result;
		} catch (err) {
			console.log('Error, Service.model:', err);
			throw new BadRequestException(err);
		}
	}

	public async login(input: LoginInput): Promise<string> {
		void input;
		await Promise.resolve();
		return 'login executed!';
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
