import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ArticleService } from './article.service';
import { Article } from '../../libs/dto/article/article';
import { ArticleInput, GetArticleInput } from '../../libs/dto/article/article.input';
import { AuthGuard } from '../../libs/guards/auth.guard';
import { RolesGuard } from '../../libs/guards/roles.guard';
import { Roles } from '../../libs/decorators/roles.decorators';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../../libs/decorators/authMember.decorators';
import { OptionalAuthGuard } from '../../libs/guards/optional-auth.guard';
import type { AuthMemberPayload } from '../../libs/types/auth';

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

	@UseGuards(OptionalAuthGuard)
	@Query(() => Article)
	public async getArticle(
		@AuthMember() authMember: AuthMemberPayload | null,
		@Args('input') input: GetArticleInput,
	): Promise<Article> {
		console.log('Query: getArticle');
		return this.articleService.getArticle(authMember, input);
	}
}
