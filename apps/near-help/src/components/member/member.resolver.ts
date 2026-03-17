import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { MemberService } from './member.service';
import { LoginInput, MemberInput } from '../../libs/dto/member/member.input';
import { AuthResponse, AuthTokens, LogoutResponse } from '../../libs/dto/auth/auth';
import { LogoutInput, RefreshTokenInput } from '../../libs/dto/auth/auth.input';

@Resolver()
export class MemberResolver {
	constructor(private readonly memberService: MemberService) {}

	@Mutation(() => AuthResponse)
	public async signup(@Args('input') input: MemberInput): Promise<AuthResponse> {
		console.log('Mutation: signup');
		return this.memberService.signup(input);
	}

	@Mutation(() => AuthResponse)
	public async login(@Args('input') input: LoginInput): Promise<AuthResponse> {
		console.log('Mutation: login');
		return this.memberService.login(input);
	}

	@Mutation(() => AuthTokens)
	public async refreshTokens(@Args('input') input: RefreshTokenInput): Promise<AuthTokens> {
		console.log('Mutation: refreshTokens');
		return this.memberService.refreshTokens(input);
	}

	@Mutation(() => LogoutResponse)
	public async logout(@Args('input') input: LogoutInput): Promise<LogoutResponse> {
		console.log('Mutation: logout');
		return this.memberService.logout(input);
	}

	@Mutation(() => String)
	public async updateMember(): Promise<string> {
		console.log('Mutation: updateMember');
		return await this.memberService.updateMember();
	}

	@Query(() => String)
	public async getMember(): Promise<string> {
		console.log('Query: getMember');
		return this.memberService.getMember();
	}
}
