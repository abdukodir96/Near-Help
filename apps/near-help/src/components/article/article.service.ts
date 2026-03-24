import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Article } from '../../libs/dto/article/article';
import { ArticleInput, GetArticleInput } from '../../libs/dto/article/article.input';
import { Member } from '../../libs/dto/member/member';
import { Message } from '../../libs/enums/common.enum';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { AuthMemberPayload } from '../../libs/types/auth';
import { ViewService } from '../view/view.service';
import { ViewGroup } from '../../libs/enums/view.enum';
import { ArticleStatus } from '../../libs/enums/article.enum';

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
}
