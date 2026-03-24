import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsInt, IsMongoId, IsNotEmpty, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { CommentGroup } from '../../enums/comment.enum';
import { Direction } from '../../enums/common.enum';
import { availableCommentSorts } from '../../config';

@InputType()
export class CommentInput {
	@IsNotEmpty()
	@Field(() => CommentGroup)
	commentGroup!: CommentGroup;

	@IsNotEmpty()
	@IsString()
	@Length(1, 100)
	@Field(() => String)
	commentContent!: string;

	@IsNotEmpty()
	@IsMongoId()
	@Field(() => String)
	commentRefId!: string;
}

@InputType()
export class CreateReplyInput {
	@IsNotEmpty()
	@IsMongoId()
	@Field(() => String)
	parentCommentId!: string;

	@IsNotEmpty()
	@IsString()
	@Length(1, 100)
	@Field(() => String)
	commentContent!: string;
}

@InputType()
class CommentsInquirySearch {
	@IsNotEmpty()
	@IsMongoId()
	@Field(() => String)
	commentRefId!: string;
}

@InputType()
export class CommentsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit!: number;

	@IsOptional()
	@IsIn([...availableCommentSorts])
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => CommentsInquirySearch)
	search!: CommentsInquirySearch;
}

@InputType()
export class GetCommentThreadInput {
	@IsNotEmpty()
	@IsMongoId()
	@Field(() => String)
	rootCommentId!: string;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Field(() => Int, { nullable: true })
	page?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(100)
	@Field(() => Int, { nullable: true })
	limit?: number;

	@IsOptional()
	@IsIn([...availableCommentSorts, 'depth'])
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;
}
