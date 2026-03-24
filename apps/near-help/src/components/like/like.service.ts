import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Like, MeLiked } from '../../libs/dto/like/like';
import {
	LikeInput,
	LikeTargetArticleInput,
	LikeTargetCommentInput,
	LikeTargetMemberInput,
	LikeTargetServiceInput,
} from '../../libs/dto/like/like.input';
import { Message } from '../../libs/enums/common.enum';
import { LikeGroup } from '../../libs/enums/like.enum';
import { ArticleStatus } from '../../libs/enums/article.enum';
import { CommentStatus } from '../../libs/enums/comment.enum';
import { MemberStatus } from '../../libs/enums/member.enum';
import { ServiceStatus } from '../../libs/enums/service.enum';
import type { Article } from '../../libs/dto/article/article';
import type { Comment } from '../../libs/dto/comment/comment';
import type { Member } from '../../libs/dto/member/member';
import type { Service } from '../../libs/dto/service/service';

@Injectable()
export class LikeService {
	constructor(
		@InjectModel('Like') private readonly likeModel: Model<Like>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		@InjectModel('Service') private readonly serviceModel: Model<Service>,
		@InjectModel('Article') private readonly articleModel: Model<Article>,
		@InjectModel('Comment') private readonly commentModel: Model<Comment>,
	) {}

	public async likeTargetMember(memberId: string, input: LikeTargetMemberInput): Promise<MeLiked> {
		return this.toggleLikeInternal(memberId, {
			likeGroup: LikeGroup.MEMBER,
			likeRefId: input.targetMemberId,
		});
	}

	public async likeTargetService(memberId: string, input: LikeTargetServiceInput): Promise<MeLiked> {
		return this.toggleLikeInternal(memberId, {
			likeGroup: LikeGroup.SERVICE,
			likeRefId: input.targetServiceId,
		});
	}

	public async likeTargetArticle(memberId: string, input: LikeTargetArticleInput): Promise<MeLiked> {
		return this.toggleLikeInternal(memberId, {
			likeGroup: LikeGroup.ARTICLE,
			likeRefId: input.targetArticleId,
		});
	}

	public async likeTargetComment(memberId: string, input: LikeTargetCommentInput): Promise<MeLiked> {
		return this.toggleLikeInternal(memberId, {
			likeGroup: LikeGroup.COMMENT,
			likeRefId: input.targetCommentId,
		});
	}

	private async toggleLikeInternal(memberId: string, input: LikeInput): Promise<MeLiked> {
		await this.ensureActorCanLike(memberId);
		await this.ensureLikeTargetExists(input.likeGroup, input.likeRefId);

		const existingLike = await this.likeModel
			.findOne({
				memberId,
				likeGroup: input.likeGroup,
				likeRefId: input.likeRefId,
			})
			.exec();

		if (existingLike) {
			const deleteResult = await this.likeModel.deleteOne({ _id: existingLike._id }).exec();
			if (deleteResult.deletedCount === 1) {
				await this.updateTargetLikes(input.likeGroup, input.likeRefId, -1);
			}

			return {
				memberId,
				likeRefId: input.likeRefId,
				myFavorite: false,
			};
		}

		try {
			await this.likeModel.create({
				memberId,
				likeGroup: input.likeGroup,
				likeRefId: input.likeRefId,
			});
		} catch (err: unknown) {
			if (this.isMongoDuplicateKeyError(err)) {
				return {
					memberId,
					likeRefId: input.likeRefId,
					myFavorite: true,
				};
			}

			const errMessage = err instanceof Error ? err.message : String(err);
			console.log('Error, Like.toggleLikeInternal(create):', errMessage);
			throw new BadRequestException(Message.CREATE_FAILED);
		}

		await this.updateTargetLikes(input.likeGroup, input.likeRefId, 1);
		return {
			memberId,
			likeRefId: input.likeRefId,
			myFavorite: true,
		};
	}

	public async getMeLiked(memberId: string, input: LikeInput): Promise<MeLiked> {
		await this.ensureActorCanLike(memberId);
		await this.ensureLikeTargetExists(input.likeGroup, input.likeRefId);

		const existingLike = await this.likeModel
			.findOne({
				memberId,
				likeGroup: input.likeGroup,
				likeRefId: input.likeRefId,
			})
			.select({ _id: 1 })
			.lean()
			.exec();

		return {
			memberId,
			likeRefId: input.likeRefId,
			myFavorite: Boolean(existingLike),
		};
	}

	private async ensureActorCanLike(memberId: string): Promise<void> {
		const member = await this.memberModel.findById(memberId).select({ memberStatus: 1 }).lean().exec();
		if (!member || member.memberStatus === MemberStatus.DELETED) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}

		if (member.memberStatus === MemberStatus.BLOCKED) {
			throw new ForbiddenException(Message.BLOCKED_USER);
		}
	}

	private async ensureLikeTargetExists(likeGroup: LikeGroup, likeRefId: string): Promise<void> {
		switch (likeGroup) {
			case LikeGroup.MEMBER: {
				const member = await this.memberModel.findById(likeRefId).select({ memberStatus: 1 }).lean().exec();
				if (!member || member.memberStatus !== MemberStatus.ACTIVE) {
					throw new NotFoundException(Message.NO_DATA_FOUND);
				}
				return;
			}

			case LikeGroup.SERVICE: {
				const service = await this.serviceModel.findById(likeRefId).select({ serviceStatus: 1 }).lean().exec();
				if (!service || service.serviceStatus !== ServiceStatus.ACTIVE) {
					throw new NotFoundException(Message.NO_DATA_FOUND);
				}
				return;
			}

			case LikeGroup.ARTICLE: {
				const article = await this.articleModel.findById(likeRefId).select({ articleStatus: 1 }).lean().exec();
				if (!article || article.articleStatus !== ArticleStatus.ACTIVE) {
					throw new NotFoundException(Message.NO_DATA_FOUND);
				}
				return;
			}

			case LikeGroup.COMMENT: {
				const comment = await this.commentModel.findById(likeRefId).select({ commentStatus: 1 }).lean().exec();
				if (!comment || comment.commentStatus !== CommentStatus.ACTIVE) {
					throw new NotFoundException(Message.NO_DATA_FOUND);
				}
				return;
			}

			case LikeGroup.REVIEW:
			default:
				throw new BadRequestException(Message.BAD_REQUEST);
		}
	}

	private async updateTargetLikes(likeGroup: LikeGroup, likeRefId: string, delta: 1 | -1): Promise<void> {
		switch (likeGroup) {
			case LikeGroup.MEMBER:
				await this.memberModel.updateOne({ _id: likeRefId }, { $inc: { memberLikes: delta } }).exec();
				return;
			case LikeGroup.SERVICE:
				await this.serviceModel.updateOne({ _id: likeRefId }, { $inc: { serviceLikes: delta } }).exec();
				return;
			case LikeGroup.ARTICLE:
				await this.articleModel.updateOne({ _id: likeRefId }, { $inc: { articleLikes: delta } }).exec();
				return;
			case LikeGroup.COMMENT:
				await this.commentModel.updateOne({ _id: likeRefId }, { $inc: { commentLikes: delta } }).exec();
				return;
			case LikeGroup.REVIEW:
			default:
				return;
		}
	}

	private isMongoDuplicateKeyError(err: unknown): boolean {
		if (typeof err !== 'object' || err === null || !('code' in err)) {
			return false;
		}
		return (err as { code?: number }).code === 11000;
	}
}
