import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LoginInput, MemberInput } from '../../libs/dto/member/member.input';

@Injectable()
export class MemberService {
	constructor(@InjectModel('Member') private readonly memberModel: Model<Record<string, unknown>>) {}

	public async signup(input: MemberInput): Promise<string> {
		void input;
		await Promise.resolve();
		return 'signup executed!';
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
