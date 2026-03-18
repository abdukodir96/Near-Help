import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { MemberService } from './member.service';
import { LoginInput, MemberInput, UpdateMemberInput } from '../../libs/dto/member/member.input';
import { AuthResponse, AuthTokens, LogoutResponse } from '../../libs/dto/auth/auth';
import { LogoutInput, RefreshTokenInput } from '../../libs/dto/auth/auth.input';
import { Member } from '../../libs/dto/member/member';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../../libs/guards/gql-auth.guard';
import { AuthMember } from '../../libs/decorators/auth-member.decorator';
import { Roles } from '../../libs/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../../libs/guards/roles.guard';

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

	@UseGuards(GqlAuthGuard, RolesGuard)
	@Roles(MemberType.USER, MemberType.AGENT, MemberType.ADMIN)
	@Mutation(() => Member)
	public async updateMember(
		@AuthMember('_id') memberId: string,
		@Args('input') input: UpdateMemberInput,
	): Promise<Member> {
		console.log('Mutation: updateMember');
		return await this.memberService.updateMember(memberId, input);
	}

	@Query(() => String)
	public async getMember(): Promise<string> {
		console.log('Query: getMember');
		return this.memberService.getMember();
	}
}
