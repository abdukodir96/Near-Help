import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Article, Articles } from '../../libs/dto/article/article';
import {
	ArticleInput,
	ArticlesInquiry,
	GetArticleInput,
	UpdateArticleByAdminInput,
} from '../../libs/dto/article/article.input';
import { Member } from '../../libs/dto/member/member';
import { Direction, Message } from '../../libs/enums/common.enum';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { AuthMemberPayload } from '../../libs/types/auth';
import { ViewService } from '../view/view.service';
import { ViewGroup } from '../../libs/enums/view.enum';
import { ArticleStatus } from '../../libs/enums/article.enum';
import { ArticleUpdate } from '../../libs/dto/article/article.update';

@Injectable()
export class ArticleService {
	constructor(
		@InjectModel('Article') private readonly articleModel: Model<Article>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		private readonly viewService: ViewService,
	) {}

	public async createArticle(memberId: string, input: ArticleInput): Promise<Article> {
		const member = await this.memberModel.findById(memberId).select({ memberStatus: 1 }).exec();
		if (!member || member.memberStatus === MemberStatus.DELETED) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}

		if (member.memberStatus === MemberStatus.BLOCKED) {
			throw new ForbiddenException(Message.BLOCKED_USER);
		}

		try {
			const createdArticle = await this.articleModel.create({
				...input,
				memberId,
			});

			await this.memberModel.updateOne({ _id: memberId }, { $inc: { memberArticles: 1 } }).exec();
			return createdArticle as Article;
		} catch (err: unknown) {
			const errMessage = err instanceof Error ? err.message : String(err);
			console.log('Error, Article.createArticle:', errMessage);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getArticle(authMember: AuthMemberPayload | null, input: GetArticleInput): Promise<Article> {
		const article = await this.articleModel.findById(input.articleId).exec();

		if (!article || article.articleStatus === ArticleStatus.DELETED) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}

		const isOwner = authMember?._id === String(article.memberId);
		const isAdmin = authMember?.memberType === MemberType.ADMIN;

		if (article.articleStatus !== ArticleStatus.ACTIVE && !isOwner && !isAdmin) {
			throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
		}

		if (authMember && !isOwner) {
			const createdView = await this.viewService.recordView({
				memberId: authMember._id,
				viewGroup: ViewGroup.ARTICLE,
				viewRefId: input.articleId,
			});

			if (createdView) {
				await this.articleModel.updateOne({ _id: input.articleId }, { $inc: { articleViews: 1 } }).exec();
				article.articleViews += 1;
			}
		}

		return article as Article;
	}

	public async updateArticle(authMember: AuthMemberPayload, input: ArticleUpdate): Promise<Article> {
		const { _id: targetArticleId, ...rest } = input;
		const payload = Object.fromEntries(
			Object.entries(rest).filter(([, value]) => typeof value !== 'undefined' && value !== null),
		);

		if (!targetArticleId || Object.keys(payload).length === 0) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		const article = await this.articleModel.findById(targetArticleId).exec();
		if (!article || article.articleStatus === ArticleStatus.DELETED) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}

		const isOwner = String(article.memberId) === authMember._id;
		const isAdmin = authMember.memberType === MemberType.ADMIN;

		if (!isOwner && !isAdmin) {
			throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
		}

		if (!isAdmin && Object.prototype.hasOwnProperty.call(payload, 'articleStatus')) {
			throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
		}

		try {
			const updatedArticle = await this.articleModel
				.findByIdAndUpdate(targetArticleId, { $set: payload }, { new: true, runValidators: true })
				.exec();

			if (!updatedArticle) {
				throw new NotFoundException(Message.NO_DATA_FOUND);
			}

			return updatedArticle as Article;
		} catch (err: unknown) {
			const errMessage = err instanceof Error ? err.message : String(err);
			console.log('Error, Article.updateArticle:', errMessage);
			throw new BadRequestException(Message.UPDATE_FAILED);
		}
	}

	public async updateArticleByAdmin(input: UpdateArticleByAdminInput): Promise<Article> {
		const { targetArticleId, ...rest } = input;
		const payload = Object.fromEntries(
			Object.entries(rest).filter(([, value]) => typeof value !== 'undefined' && value !== null),
		);

		if (!targetArticleId || Object.keys(payload).length === 0) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		const existingArticle = await this.articleModel.findById(targetArticleId).exec();
		if (!existingArticle) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}

		try {
			const updatedArticle = await this.articleModel
				.findByIdAndUpdate(targetArticleId, { $set: payload }, { new: true, runValidators: true })
				.exec();

			if (!updatedArticle) {
				throw new NotFoundException(Message.NO_DATA_FOUND);
			}

			return updatedArticle as Article;
		} catch (err: unknown) {
			const errMessage = err instanceof Error ? err.message : String(err);
			console.log('Error, Article.updateArticleByAdmin:', errMessage);
			throw new BadRequestException(Message.UPDATE_FAILED);
		}
	}

	public async getBoardArticles(input: ArticlesInquiry): Promise<Articles> {
		const filter: Record<string, unknown> = {
			articleStatus: ArticleStatus.ACTIVE,
		};

		if (input.search.articleCategory) {
			filter.articleCategory = input.search.articleCategory;
		}

		if (input.search.memberId) {
			filter.memberId = input.search.memberId;
		}

		const searchText = input.search.text?.trim();
		if (searchText) {
			const regex = new RegExp(searchText, 'i');
			filter.$or = [{ articleTitle: regex }, { articleContent: regex }];
		}

		const sortField = input.sort ?? 'createdAt';
		const sortDirection: 1 | -1 = input.direction === Direction.ASC ? 1 : -1;
		const sort: Record<string, 1 | -1> = { [sortField]: sortDirection };
		const skip = (input.page - 1) * input.limit;

		const [list, totalCount] = await Promise.all([
			this.articleModel.find(filter).sort(sort).skip(skip).limit(input.limit).exec(),
			this.articleModel.countDocuments(filter).exec(),
		]);

		return {
			list: list as Article[],
			metaCounter: [{ total: totalCount }],
		};
	}
}
