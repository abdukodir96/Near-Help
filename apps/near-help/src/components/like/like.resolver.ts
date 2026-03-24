import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { LikeService } from './like.service';
import { MeLiked } from '../../libs/dto/like/like';
import { LikeInput } from '../../libs/dto/like/like.input';
import { AuthGuard } from '../../libs/guards/auth.guard';
import { RolesGuard } from '../../libs/guards/roles.guard';
import { Roles } from '../../libs/decorators/roles.decorators';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../../libs/decorators/authMember.decorators';

@Resolver()
export class LikeResolver {
	constructor(private readonly likeService: LikeService) {}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.USER, MemberType.AGENT, MemberType.ADMIN)
	@Mutation(() => MeLiked)
	public async toggleLike(@AuthMember('_id') memberId: string, @Args('input') input: LikeInput): Promise<MeLiked> {
		console.log('Mutation: toggleLike');
		return this.likeService.toggleLike(memberId, input);
	}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.USER, MemberType.AGENT, MemberType.ADMIN)
	@Query(() => MeLiked)
	public async getMeLiked(@AuthMember('_id') memberId: string, @Args('input') input: LikeInput): Promise<MeLiked> {
		console.log('Query: getMeLiked');
		return this.likeService.getMeLiked(memberId, input);
	}
}
