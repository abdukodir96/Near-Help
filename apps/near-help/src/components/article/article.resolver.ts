import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ArticleService } from './article.service';
import { Article, Articles } from '../../libs/dto/article/article';
import {
	ArticleInput,
	AllArticlesInquiry,
	ArticlesInquiry,
	GetArticleInput,
	RemoveArticleByAdminInput,
	UpdateArticleByAdminInput,
} from '../../libs/dto/article/article.input';
import { AuthGuard } from '../../libs/guards/auth.guard';
import { RolesGuard } from '../../libs/guards/roles.guard';
import { Roles } from '../../libs/decorators/roles.decorators';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../../libs/decorators/authMember.decorators';
import { OptionalAuthGuard } from '../../libs/guards/optional-auth.guard';
import type { AuthMemberPayload } from '../../libs/types/auth';
import { ArticleUpdate } from '../../libs/dto/article/article.update';

@Resolver()
export class ArticleResolver {
	constructor(private readonly articleService: ArticleService) {}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.USER, MemberType.AGENT, MemberType.ADMIN)
	@Mutation(() => Article)
	public async createArticle(
		@AuthMember('_id') memberId: string,
		@Args('input') input: ArticleInput,
	): Promise<Article> {
		console.log('Mutation: createArticle');
		return this.articleService.createArticle(memberId, input);
	}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.USER, MemberType.AGENT, MemberType.ADMIN)
	@Mutation(() => Article)
	public async updateArticle(
		@AuthMember() authMember: AuthMemberPayload,
		@Args('input') input: ArticleUpdate,
	): Promise<Article> {
		console.log('Mutation: updateArticle');
		return this.articleService.updateArticle(authMember, input);
	}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.ADMIN)
	@Mutation(() => Article)
	public async updateArticleByAdmin(@Args('input') input: UpdateArticleByAdminInput): Promise<Article> {
		console.log('Mutation: updateArticleByAdmin');
		return this.articleService.updateArticleByAdmin(input);
	}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.ADMIN)
	@Mutation(() => Article)
	public async removeArticleByAdmin(@Args('input') input: RemoveArticleByAdminInput): Promise<Article> {
		console.log('Mutation: removeArticleByAdmin');
		return this.articleService.removeArticleByAdmin(input);
	}

	@UseGuards(OptionalAuthGuard)
	@Query(() => Article)
	public async getArticle(
		@AuthMember() authMember: AuthMemberPayload | null,
		@Args('input') input: GetArticleInput,
	): Promise<Article> {
		console.log('Query: getArticle');
		return this.articleService.getArticle(authMember, input);
	}

	@UseGuards(OptionalAuthGuard)
	@Query(() => Articles)
	public async getArticles(
		@AuthMember() authMember: AuthMemberPayload | null,
		@Args('input') input: ArticlesInquiry,
	): Promise<Articles> {
		console.log('Query: getArticles');
		return this.articleService.getArticles(authMember, input);
	}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.ADMIN)
	@Query(() => Articles)
	public async getAllArticlesByAdmin(@Args('input') input: AllArticlesInquiry): Promise<Articles> {
		console.log('Query: getAllArticlesByAdmin');
		return this.articleService.getAllArticlesByAdmin(input);
	}
}
