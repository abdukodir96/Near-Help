import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CommentService } from './comment.service';
import { Comment, Comments } from '../../libs/dto/comment/comment';
import { CommentInput, CommentsInquiry } from '../../libs/dto/comment/comment.input';
import { CommentUpdate } from '../../libs/dto/comment/comment.update';
import { AuthGuard } from '../../libs/guards/auth.guard';
import { RolesGuard } from '../../libs/guards/roles.guard';
import { Roles } from '../../libs/decorators/roles.decorators';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../../libs/decorators/authMember.decorators';
import type { AuthMemberPayload } from '../../libs/types/auth';

@Resolver()
export class CommentResolver {
	constructor(private readonly commentService: CommentService) {}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.USER, MemberType.AGENT, MemberType.ADMIN)
	@Mutation(() => Comment)
	public async createComment(
		@AuthMember('_id') memberId: string,
		@Args('input') input: CommentInput,
	): Promise<Comment> {
		console.log('Mutation: createComment');
		return this.commentService.createComment(memberId, input);
	}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.USER, MemberType.AGENT, MemberType.ADMIN)
	@Mutation(() => Comment)
	public async updateComment(
		@AuthMember() authMember: AuthMemberPayload,
		@Args('input') input: CommentUpdate,
	): Promise<Comment> {
		console.log('Mutation: updateComment');
		return this.commentService.updateComment(authMember, input);
	}

	@Query(() => Comments)
	public async getComments(@Args('input') input: CommentsInquiry): Promise<Comments> {
		console.log('Query: getComments');
		return this.commentService.getComments(input);
	}
}
