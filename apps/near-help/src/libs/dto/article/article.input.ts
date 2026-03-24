import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsIn, IsInt, IsMongoId, IsNotEmpty, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { ArticleCategory, ArticleStatus } from '../../enums/article.enum';
import { Direction } from '../../enums/common.enum';

@InputType()
export class ArticleInput {
	@IsNotEmpty()
	@IsEnum(ArticleCategory)
	@Field(() => ArticleCategory)
	articleCategory!: ArticleCategory;

	@IsNotEmpty()
	@IsString()
	@Length(3, 80)
	@Field(() => String)
	articleTitle!: string;

	@IsNotEmpty()
	@IsString()
	@Length(3, 2500)
	@Field(() => String)
	articleContent!: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	articleImage?: string;
}

@InputType()
class ArticlesSearchInput {
	@IsOptional()
	@IsEnum(ArticleCategory)
	@Field(() => ArticleCategory, { nullable: true })
	articleCategory?: ArticleCategory;

	@IsOptional()
	@Length(1, 80)
	@Field(() => String, { nullable: true })
	text?: string;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	memberId?: string;
}

@InputType()
export class ArticlesInquiry {
	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Max(100)
	@Field(() => Int)
	limit!: number;

	@IsOptional()
	@IsIn(['createdAt', 'updatedAt', 'articleLikes', 'articleViews'])
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@IsEnum(Direction)
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => ArticlesSearchInput)
	search!: ArticlesSearchInput;
}

@InputType()
class AllArticlesSearchInput {
	@IsOptional()
	@IsEnum(ArticleStatus)
	@Field(() => ArticleStatus, { nullable: true })
	articleStatus?: ArticleStatus;

	@IsOptional()
	@IsEnum(ArticleCategory)
	@Field(() => ArticleCategory, { nullable: true })
	articleCategory?: ArticleCategory;
}

@InputType()
export class AllArticlesInquiry {
	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Max(100)
	@Field(() => Int)
	limit!: number;

	@IsOptional()
	@IsIn(['createdAt', 'updatedAt', 'articleLikes', 'articleViews'])
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@IsEnum(Direction)
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => AllArticlesSearchInput)
	search!: AllArticlesSearchInput;
}
