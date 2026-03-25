import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { LikeService } from './like.service';
import { MeLiked } from '../../libs/dto/like/like';
import {
	GetFavoritesInput,
	LikeTargetArticleInput,
	LikeTargetCommentInput,
	LikeTargetMemberInput,
	LikeTargetServiceInput,
	LikeInput,
} from '../../libs/dto/like/like.input';
import { AuthGuard } from '../../libs/guards/auth.guard';
import { RolesGuard } from '../../libs/guards/roles.guard';
import { Roles } from '../../libs/decorators/roles.decorators';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../../libs/decorators/authMember.decorators';
import { ServicesResult } from '../../libs/dto/service/service';

@Resolver()
export class LikeResolver {
	constructor(private readonly likeService: LikeService) {}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.USER, MemberType.AGENT, MemberType.ADMIN)
	@Mutation(() => MeLiked)
	public async likeTargetMember(
		@AuthMember('_id') memberId: string,
		@Args('input') input: LikeTargetMemberInput,
	): Promise<MeLiked> {
		console.log('Mutation: likeTargetMember');
		return this.likeService.likeTargetMember(memberId, input);
	}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.USER, MemberType.AGENT, MemberType.ADMIN)
	@Mutation(() => MeLiked)
	public async likeTargetService(
		@AuthMember('_id') memberId: string,
		@Args('input') input: LikeTargetServiceInput,
	): Promise<MeLiked> {
		console.log('Mutation: likeTargetService');
		return this.likeService.likeTargetService(memberId, input);
	}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.USER, MemberType.AGENT, MemberType.ADMIN)
	@Mutation(() => MeLiked)
	public async likeTargetArticle(
		@AuthMember('_id') memberId: string,
		@Args('input') input: LikeTargetArticleInput,
	): Promise<MeLiked> {
		console.log('Mutation: likeTargetArticle');
		return this.likeService.likeTargetArticle(memberId, input);
	}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.USER, MemberType.AGENT, MemberType.ADMIN)
	@Mutation(() => MeLiked)
	public async likeTargetComment(
		@AuthMember('_id') memberId: string,
		@Args('input') input: LikeTargetCommentInput,
	): Promise<MeLiked> {
		console.log('Mutation: likeTargetComment');
		return this.likeService.likeTargetComment(memberId, input);
	}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.USER, MemberType.AGENT, MemberType.ADMIN)
	@Query(() => MeLiked)
	public async getMeLiked(@AuthMember('_id') memberId: string, @Args('input') input: LikeInput): Promise<MeLiked> {
		console.log('Query: getMeLiked');
		return this.likeService.getMeLiked(memberId, input);
	}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.USER, MemberType.AGENT, MemberType.ADMIN)
	@Query(() => ServicesResult)
	public async getFavorites(
		@AuthMember('_id') memberId: string,
		@Args('input', { nullable: true }) input?: GetFavoritesInput,
	): Promise<ServicesResult> {
		console.log('Query: getFavorites');
		return this.likeService.getFavorites(memberId, input);
	}
}
