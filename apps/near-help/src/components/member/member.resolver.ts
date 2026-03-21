import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { MemberService } from './member.service';
import { LoginInput, MemberInput, UpdateMemberInput } from '../../libs/dto/member/member.input';
import { AuthResponse, AuthTokens, LogoutResponse } from '../../libs/dto/auth/auth';
import { LogoutInput, RefreshTokenInput } from '../../libs/dto/auth/auth.input';
import { Member } from '../../libs/dto/member/member';
import { UseGuards } from '@nestjs/common';
import { AuthMember } from '../../libs/decorators/authMember.decorators';
import { Roles } from '../../libs/decorators/roles.decorators';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthGuard } from '../../libs/guards/auth.guard';
import { RolesGuard } from '../../libs/guards/roles.guard';
import { WithoutGuard } from '../../libs/guards/without.guard';

@Resolver()
export class MemberResolver {
	constructor(private readonly memberService: MemberService) {}

	@UseGuards(WithoutGuard)
	@Mutation(() => AuthResponse)
	public async signup(@Args('input') input: MemberInput): Promise<AuthResponse> {
		console.log('Mutation: signup');
		return this.memberService.signup(input);
	}

	@UseGuards(WithoutGuard)
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

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.USER, MemberType.AGENT, MemberType.ADMIN)
	@Mutation(() => Member)
	public async updateMember(
		@AuthMember('_id') memberId: string,
		@Args('input') input: UpdateMemberInput,
	): Promise<Member> {
		console.log('Mutation: updateMember');
		return await this.memberService.updateMember(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => String)
	public checkAuth(@AuthMember('_id') memberId: string): string {
		console.log('Mutation: checkAuth');
		return `Authenticated member id: ${memberId}`;
	}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.ADMIN)
	@Mutation(() => String)
	public checkAuthRole(@AuthMember('_id') memberId: string): string {
		console.log('Mutation: checkAuthRole');
		return `Admin role verified for member id: ${memberId}`;
	}

	@Query(() => String)
	public async getMember(): Promise<string> {
		console.log('Query: getMember');
		return this.memberService.getMember();
	}
}
