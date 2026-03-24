import { Field, Int, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { ArticleCategory, ArticleStatus } from '../../enums/article.enum';
import { Member } from '../member/member';

@ObjectType()
export class Article {
	@Field(() => String)
	_id!: mongoose.ObjectId;

	@Field(() => ArticleCategory)
	articleCategory!: ArticleCategory;

	@Field(() => ArticleStatus)
	articleStatus!: ArticleStatus;

	@Field(() => String)
	articleTitle!: string;

	@Field(() => String)
	articleContent!: string;

	@Field(() => String, { nullable: true })
	articleImage?: string;

	@Field(() => Int)
	articleViews!: number;

	@Field(() => Int)
	articleLikes!: number;

	@Field(() => Int)
	articleComments!: number;

	@Field(() => String)
	memberId!: string;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;

	@Field(() => Boolean, { nullable: true })
	meLiked?: boolean;

	@Field(() => Member, { nullable: true })
	memberData?: Member;
}

@ObjectType()
export class TotalCounter {
	@Field(() => Int)
	total!: number;
}

@ObjectType()
export class Articles {
	@Field(() => [Article])
	list!: Article[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter?: TotalCounter[];
}
