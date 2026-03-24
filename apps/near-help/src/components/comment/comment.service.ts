import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, Comments } from '../../libs/dto/comment/comment';
import {
	CommentInput,
	AllCommentsInquiry,
	CommentsInquiry,
	CreateReplyInput,
	GetCommentThreadInput,
	RemoveCommentByAdminInput,
	RemoveCommentInput,
} from '../../libs/dto/comment/comment.input';
import { CommentUpdate } from '../../libs/dto/comment/comment.update';
import { Member } from '../../libs/dto/member/member';
import { Article } from '../../libs/dto/article/article';
import { Service } from '../../libs/dto/service/service';
import { Direction, Message } from '../../libs/enums/common.enum';
import { CommentGroup, CommentStatus } from '../../libs/enums/comment.enum';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { ArticleStatus } from '../../libs/enums/article.enum';
import { ServiceStatus } from '../../libs/enums/service.enum';
import { AuthMemberPayload } from '../../libs/types/auth';
import { LikeGroup } from '../../libs/enums/like.enum';
import { Like } from '../../libs/dto/like/like';

type CommentsAggregateResult = {
	list: Comment[];
	metaCounter: Array<{ total: number }>;
};

@Injectable()
export class CommentService {
	constructor(
		@InjectModel('Comment') private readonly commentModel: Model<Comment>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		@InjectModel('Article') private readonly articleModel: Model<Article>,
		@InjectModel('Service') private readonly serviceModel: Model<Service>,
		@InjectModel('Like') private readonly likeModel: Model<Like>,
	) {}

	public async createComment(memberId: string, input: CommentInput): Promise<Comment> {
		const member = await this.memberModel.findById(memberId).select({ memberStatus: 1 }).exec();
		if (!member || member.memberStatus === MemberStatus.DELETED) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}

		if (member.memberStatus === MemberStatus.BLOCKED) {
			throw new ForbiddenException(Message.BLOCKED_USER);
		}

		await this.ensureCommentTargetExists(input.commentGroup, input.commentRefId);

		try {
			const createdComment = await this.commentModel.create({
				...input,
				memberId,
				parentCommentId: null,
				depth: 0,
				repliesCount: 0,
			});

			await Promise.all([
				this.memberModel.updateOne({ _id: memberId }, { $inc: { memberComments: 1 } }).exec(),
				this.incrementTargetComments(input.commentGroup, input.commentRefId),
			]);

			return createdComment as Comment;
		} catch (err: unknown) {
			const errMessage = err instanceof Error ? err.message : String(err);
			console.log('Error, Comment.createComment:', errMessage);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async createReply(memberId: string, input: CreateReplyInput): Promise<Comment> {
		const member = await this.memberModel.findById(memberId).select({ memberStatus: 1 }).exec();
		if (!member || member.memberStatus === MemberStatus.DELETED) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}
		if (member.memberStatus === MemberStatus.BLOCKED) {
			throw new ForbiddenException(Message.BLOCKED_USER);
		}

		const parentComment = await this.commentModel.findById(input.parentCommentId).exec();
		if (!parentComment || parentComment.commentStatus === CommentStatus.DELETED) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}

		const parentDepth = typeof parentComment.depth === 'number' ? parentComment.depth : 0;

		try {
			const createdReply = await this.commentModel.create({
				commentGroup: parentComment.commentGroup,
				commentContent: input.commentContent,
				commentRefId: parentComment.commentRefId,
				memberId,
				parentCommentId: parentComment._id,
				depth: parentDepth + 1,
				repliesCount: 0,
			});

			await Promise.all([
				this.memberModel.updateOne({ _id: memberId }, { $inc: { memberComments: 1 } }).exec(),
				this.incrementTargetComments(parentComment.commentGroup, String(parentComment.commentRefId)),
				this.commentModel.updateOne({ _id: parentComment._id }, { $inc: { repliesCount: 1 } }).exec(),
			]);

			return createdReply as Comment;
		} catch (err: unknown) {
			const errMessage = err instanceof Error ? err.message : String(err);
			console.log('Error, Comment.createReply:', errMessage);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async updateComment(authMember: AuthMemberPayload, input: CommentUpdate): Promise<Comment> {
		const { _id: targetCommentId, ...rest } = input;
		const payload = Object.fromEntries(
			Object.entries(rest).filter(([, value]) => typeof value !== 'undefined' && value !== null),
		);

		if (!targetCommentId || Object.keys(payload).length === 0) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		const comment = await this.commentModel.findById(targetCommentId).exec();
		if (!comment || comment.commentStatus === CommentStatus.DELETED) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}

		const isOwner = String(comment.memberId) === authMember._id;
		const isAdmin = authMember.memberType === MemberType.ADMIN;
		if (!isOwner && !isAdmin) {
			throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
		}

		if (!isAdmin && Object.prototype.hasOwnProperty.call(payload, 'commentStatus')) {
			throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
		}

		try {
			const updatedComment = await this.commentModel
				.findByIdAndUpdate(targetCommentId, { $set: payload }, { new: true, runValidators: true })
				.exec();

			if (!updatedComment) {
				throw new NotFoundException(Message.NO_DATA_FOUND);
			}

			return updatedComment as Comment;
		} catch (err: unknown) {
			const errMessage = err instanceof Error ? err.message : String(err);
			console.log('Error, Comment.updateComment:', errMessage);
			throw new BadRequestException(Message.UPDATE_FAILED);
		}
	}

	public async removeComment(authMember: AuthMemberPayload, input: RemoveCommentInput): Promise<Comment> {
		const comment = await this.commentModel.findById(input._id).exec();
		if (!comment) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}

		const isOwner = String(comment.memberId) === authMember._id;
		const isAdmin = authMember.memberType === MemberType.ADMIN;
		if (!isOwner && !isAdmin) {
			throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
		}

		return this.softDeleteComment(comment);
	}

	public async removeCommentByAdmin(input: RemoveCommentByAdminInput): Promise<Comment> {
		const comment = await this.commentModel.findById(input.targetCommentId).exec();
		if (!comment) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}

		return this.softDeleteComment(comment);
	}

	public async getComments(authMember: AuthMemberPayload | null, input: CommentsInquiry): Promise<Comments> {
		const match: Record<string, unknown> = {
			commentStatus: CommentStatus.ACTIVE,
			commentRefId: new Types.ObjectId(input.search.commentRefId),
			parentCommentId: null,
		};

		const sortField = input.sort ?? 'createdAt';
		const sortDirection: 1 | -1 = input.direction === Direction.ASC ? 1 : -1;
		const sort: Record<string, 1 | -1> = { [sortField]: sortDirection };
		const skip = (input.page - 1) * input.limit;

		const data = await this.commentModel
			.aggregate<CommentsAggregateResult>([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: skip },
							{ $limit: input.limit },
							{
								$lookup: {
									from: 'members',
									localField: 'memberId',
									foreignField: '_id',
									as: 'memberData',
								},
							},
							{ $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		const list = data[0]?.list ?? [];
		await this.attachMeLikedFlags(authMember, list);

		return {
			list,
			metaCounter: data[0]?.metaCounter ?? [],
		};
	}

	public async getAllCommentsByAdmin(input: AllCommentsInquiry): Promise<Comments> {
		const filter: Record<string, unknown> = {};

		if (input.search.commentStatus) {
			filter.commentStatus = input.search.commentStatus;
		}

		if (input.search.commentGroup) {
			filter.commentGroup = input.search.commentGroup;
		}

		if (input.search.commentRefId) {
			filter.commentRefId = new Types.ObjectId(input.search.commentRefId);
		}

		if (input.search.memberId) {
			filter.memberId = new Types.ObjectId(input.search.memberId);
		}

		const searchText = input.search.text?.trim();
		if (searchText) {
			filter.commentContent = { $regex: new RegExp(searchText, 'i') };
		}

		const sortField = input.sort ?? 'createdAt';
		const sortDirection: 1 | -1 = input.direction === Direction.ASC ? 1 : -1;
		const sort: Record<string, 1 | -1> = { [sortField]: sortDirection };
		const skip = (input.page - 1) * input.limit;

		const data = await this.commentModel
			.aggregate<CommentsAggregateResult>([
				{ $match: filter },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: skip },
							{ $limit: input.limit },
							{
								$lookup: {
									from: 'members',
									localField: 'memberId',
									foreignField: '_id',
									as: 'memberData',
								},
							},
							{ $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		return {
			list: data[0]?.list ?? [],
			metaCounter: data[0]?.metaCounter ?? [],
		};
	}

	public async getCommentThread(input: GetCommentThreadInput): Promise<Comments> {
		const page = input.page && input.page > 0 ? input.page : 1;
		const limit = input.limit && input.limit > 0 ? Math.min(input.limit, 100) : 50;
		const sortField = input.sort ?? 'createdAt';
		const sortDirection: 1 | -1 = input.direction === Direction.DESC ? -1 : 1;
		const skip = (page - 1) * limit;

		const rootComment = await this.commentModel
			.findById(input.rootCommentId)
			.select({ _id: 1, commentStatus: 1 })
			.exec();
		if (!rootComment || rootComment.commentStatus === CommentStatus.DELETED) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}

		const sort: Record<string, 1 | -1> = {
			depth: 1,
			[sortField]: sortDirection,
		};

		const data = await this.commentModel
			.aggregate<CommentsAggregateResult>([
				{
					$match: {
						_id: new Types.ObjectId(input.rootCommentId),
						commentStatus: CommentStatus.ACTIVE,
					},
				},
				{
					$graphLookup: {
						from: 'comments',
						startWith: '$_id',
						connectFromField: '_id',
						connectToField: 'parentCommentId',
						as: 'descendants',
						restrictSearchWithMatch: {
							commentStatus: CommentStatus.ACTIVE,
						},
					},
				},
				{
					$project: {
						thread: { $concatArrays: [['$$ROOT'], '$descendants'] },
					},
				},
				{ $unwind: '$thread' },
				{ $replaceRoot: { newRoot: '$thread' } },
				{
					$lookup: {
						from: 'members',
						localField: 'memberId',
						foreignField: '_id',
						as: 'memberData',
					},
				},
				{ $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
				{ $sort: sort },
				{
					$facet: {
						list: [{ $skip: skip }, { $limit: limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		return {
			list: data[0]?.list ?? [],
			metaCounter: data[0]?.metaCounter ?? [],
		};
	}

	private async ensureCommentTargetExists(commentGroup: CommentGroup, commentRefId: string): Promise<void> {
		switch (commentGroup) {
			case CommentGroup.MEMBER: {
				const member = await this.memberModel.findById(commentRefId).select({ memberStatus: 1 }).exec();
				if (!member || member.memberStatus === MemberStatus.DELETED) {
					throw new NotFoundException(Message.NO_DATA_FOUND);
				}
				return;
			}

			case CommentGroup.ARTICLE: {
				const article = await this.articleModel.findById(commentRefId).select({ articleStatus: 1 }).exec();
				if (!article || article.articleStatus === ArticleStatus.DELETED) {
					throw new NotFoundException(Message.NO_DATA_FOUND);
				}
				return;
			}

			case CommentGroup.SERVICE: {
				const service = await this.serviceModel.findById(commentRefId).select({ serviceStatus: 1 }).exec();
				if (!service || service.serviceStatus === ServiceStatus.DELETED) {
					throw new NotFoundException(Message.NO_DATA_FOUND);
				}
				return;
			}

			case CommentGroup.REVIEW:
			default:
				throw new BadRequestException(Message.BAD_REQUEST);
		}
	}

	private async incrementTargetComments(commentGroup: CommentGroup, commentRefId: string): Promise<void> {
		switch (commentGroup) {
			case CommentGroup.MEMBER:
				await this.memberModel.updateOne({ _id: commentRefId }, { $inc: { memberComments: 1 } }).exec();
				return;
			case CommentGroup.ARTICLE:
				await this.articleModel.updateOne({ _id: commentRefId }, { $inc: { articleComments: 1 } }).exec();
				return;
			case CommentGroup.SERVICE:
				await this.serviceModel.updateOne({ _id: commentRefId }, { $inc: { serviceComments: 1 } }).exec();
				return;
			default:
				return;
		}
	}

	private async decrementTargetComments(commentGroup: CommentGroup, commentRefId: string): Promise<void> {
		switch (commentGroup) {
			case CommentGroup.MEMBER:
				await this.memberModel.updateOne({ _id: commentRefId }, { $inc: { memberComments: -1 } }).exec();
				return;
			case CommentGroup.ARTICLE:
				await this.articleModel.updateOne({ _id: commentRefId }, { $inc: { articleComments: -1 } }).exec();
				return;
			case CommentGroup.SERVICE:
				await this.serviceModel.updateOne({ _id: commentRefId }, { $inc: { serviceComments: -1 } }).exec();
				return;
			default:
				return;
		}
	}

	private async softDeleteComment(comment: Comment): Promise<Comment> {
		if (comment.commentStatus === CommentStatus.DELETED) {
			return comment;
		}

		let updatedComment: Comment | null = null;
		try {
			updatedComment = await this.commentModel
				.findByIdAndUpdate(
					comment._id,
					{
						$set: {
							commentStatus: CommentStatus.DELETED,
							deletedAt: new Date(),
						},
					},
					{ new: true, runValidators: true },
				)
				.exec();
		} catch (err: unknown) {
			const errMessage = err instanceof Error ? err.message : String(err);
			console.log('Error, Comment.softDeleteComment:', errMessage);
			throw new BadRequestException(Message.REMOVE_FAILED);
		}

		if (!updatedComment) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}

		const postDeleteOperations = [
			this.memberModel.updateOne({ _id: comment.memberId }, { $inc: { memberComments: -1 } }).exec(),
			this.decrementTargetComments(comment.commentGroup, String(comment.commentRefId)),
		];

		if (comment.parentCommentId) {
			postDeleteOperations.push(
				this.commentModel.updateOne({ _id: comment.parentCommentId }, { $inc: { repliesCount: -1 } }).exec(),
			);
		}

		await Promise.all(postDeleteOperations);
		return updatedComment;
	}

	private async attachMeLikedFlags(authMember: AuthMemberPayload | null, comments: Comment[]): Promise<void> {
		if (comments.length === 0) return;

		if (!authMember) {
			comments.forEach((comment) => {
				comment.meLiked = false;
			});
			return;
		}

		const commentIds = comments.map((comment) => comment._id);
		const likes = await this.likeModel
			.find({
				memberId: authMember._id,
				likeGroup: LikeGroup.COMMENT,
				likeRefId: { $in: commentIds },
			})
			.select({ likeRefId: 1 })
			.lean()
			.exec();

		const likedCommentIdSet = new Set(likes.map((like) => String(like.likeRefId)));
		comments.forEach((comment) => {
			comment.meLiked = likedCommentIdSet.has(String(comment._id));
		});
	}
}
