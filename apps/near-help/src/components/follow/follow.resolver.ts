import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { FollowService } from './follow.service';
import { Followers, Followings, MeFollowed } from '../../libs/dto/follow/follow';
import { FollowInquiry, GetMeFollowedInput, ToggleFollowInput } from '../../libs/dto/follow/follow.input';
import { AuthGuard } from '../../libs/guards/auth.guard';
import { RolesGuard } from '../../libs/guards/roles.guard';
import { Roles } from '../../libs/decorators/roles.decorators';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../../libs/decorators/authMember.decorators';
import { AuthMemberPayload } from '../../libs/types/auth';
import { OptionalAuthGuard } from '../../libs/guards/optional-auth.guard';

@Resolver()
export class FollowResolver {
	constructor(private readonly followService: FollowService) {}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.USER, MemberType.AGENT, MemberType.ADMIN)
	@Mutation(() => MeFollowed)
	public async subscribe(
		@AuthMember('_id') memberId: string,
		@Args('input') input: ToggleFollowInput,
	): Promise<MeFollowed> {
		console.log('Mutation: subscribe');
		return this.followService.subscribe(memberId, input);
	}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.USER, MemberType.AGENT, MemberType.ADMIN)
	@Mutation(() => MeFollowed)
	public async unsubscribe(
		@AuthMember('_id') memberId: string,
		@Args('input') input: ToggleFollowInput,
	): Promise<MeFollowed> {
		console.log('Mutation: unsubscribe');
		return this.followService.unsubscribe(memberId, input);
	}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.USER, MemberType.AGENT, MemberType.ADMIN)
	@Mutation(() => MeFollowed)
	public async toggleFollow(
		@AuthMember('_id') memberId: string,
		@Args('input') input: ToggleFollowInput,
	): Promise<MeFollowed> {
		console.log('Mutation: toggleFollow');
		return this.followService.toggleFollow(memberId, input);
	}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.USER, MemberType.AGENT, MemberType.ADMIN)
	@Query(() => MeFollowed)
	public async getMeFollowed(
		@AuthMember('_id') memberId: string,
		@Args('input') input: GetMeFollowedInput,
	): Promise<MeFollowed> {
		console.log('Query: getMeFollowed');
		return this.followService.getMeFollowed(memberId, input);
	}

	@UseGuards(OptionalAuthGuard)
	@Query(() => Followers)
	public async getMemberFollowers(
		@AuthMember() authMember: AuthMemberPayload | null,
		@Args('input') input: FollowInquiry,
	): Promise<Followers> {
		console.log('Query: getMemberFollowers');
		return this.followService.getFollowers(authMember, input);
	}

	@UseGuards(OptionalAuthGuard)
	@Query(() => Followings)
	public async getMemberFollowings(
		@AuthMember() authMember: AuthMemberPayload | null,
		@Args('input') input: FollowInquiry,
	): Promise<Followings> {
		console.log('Query: getMemberFollowings');
		return this.followService.getFollowings(authMember, input);
	}

	@UseGuards(OptionalAuthGuard)
	@Query(() => Followers)
	public async getFollowers(
		@AuthMember() authMember: AuthMemberPayload | null,
		@Args('input') input: FollowInquiry,
	): Promise<Followers> {
		console.log('Query: getFollowers');
		return this.followService.getFollowers(authMember, input);
	}

	@UseGuards(OptionalAuthGuard)
	@Query(() => Followings)
	public async getFollowings(
		@AuthMember() authMember: AuthMemberPayload | null,
		@Args('input') input: FollowInquiry,
	): Promise<Followings> {
		console.log('Query: getFollowings');
		return this.followService.getFollowings(authMember, input);
	}
}
