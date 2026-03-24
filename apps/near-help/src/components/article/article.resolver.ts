import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ArticleService } from './article.service';
import { Article } from '../../libs/dto/article/article';
import { ArticleInput } from '../../libs/dto/article/article.input';
import { AuthGuard } from '../../libs/guards/auth.guard';
import { RolesGuard } from '../../libs/guards/roles.guard';
import { Roles } from '../../libs/decorators/roles.decorators';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../../libs/decorators/authMember.decorators';

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
}
