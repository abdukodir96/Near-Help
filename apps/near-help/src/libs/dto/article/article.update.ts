import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { ArticleStatus } from '../../enums/article.enum';

@InputType()
export class ArticleUpdate {
	@IsNotEmpty()
	@IsMongoId()
	@Field(() => String)
	_id!: string;

	@IsOptional()
	@IsEnum(ArticleStatus)
	@Field(() => ArticleStatus, { nullable: true })
	articleStatus?: ArticleStatus;

	@IsOptional()
	@IsString()
	@Length(3, 80)
	@Field(() => String, { nullable: true })
	articleTitle?: string;

	@IsOptional()
	@IsString()
	@Length(3, 2500)
	@Field(() => String, { nullable: true })
	articleContent?: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	articleImage?: string;
}
