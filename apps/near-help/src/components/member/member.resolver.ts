import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { MemberService } from './member.service';
import { HttpException, InternalServerErrorException, UsePipes, ValidationPipe } from '@nestjs/common';
import { LoginInput, MemberInput } from '../../libs/dto/member/member.input';
import { Member } from '../../libs/dto/member/member';
import { Message } from '../../libs/enums/common.enum';

@Resolver()
export class MemberResolver {
	constructor(private readonly memberService: MemberService) {}

	@Mutation(() => Member)
	@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
	public async signup(@Args('input') input: MemberInput): Promise<Member> {
		try {
			console.log('Mutation: signup');
			console.log('input:', input);
			return await this.memberService.signup(input);
		} catch (err: unknown) {
			console.log('Error, signup:', err);
			if (err instanceof HttpException) {
				throw err;
			}
			throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
		}
	}

	@Mutation(() => Member)
	@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
	public async login(@Args('input') input: LoginInput): Promise<Member> {
		try {
			console.log('Mutation: login');
			return await this.memberService.login(input);
		} catch (err: unknown) {
			console.log('Error, login:', err);
			if (err instanceof HttpException) {
				throw err;
			}
			throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
		}
	}

	@Mutation(() => String)
	public async updateMember(): Promise<string> {
		console.log('Mutation: updateMember');
		return await this.memberService.updateMember();
	}

	@Query(() => String)
	public async getMember(): Promise<string> {
		console.log('Query: getMember');
		return await this.memberService.getMember();
	}
}
