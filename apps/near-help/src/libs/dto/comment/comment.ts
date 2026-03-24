import { Field, Int, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { CommentGroup, CommentStatus } from '../../enums/comment.enum';
import { Member } from '../member/member';

@ObjectType()
export class Comment {
	@Field(() => String)
	_id!: mongoose.ObjectId;

	@Field(() => CommentStatus)
	commentStatus!: CommentStatus;

	@Field(() => CommentGroup)
	commentGroup!: CommentGroup;

	@Field(() => String)
	commentContent!: string;

	@Field(() => String)
	commentRefId!: string;

	@Field(() => String)
	memberId!: string;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;

	@Field(() => Member, { nullable: true })
	memberData?: Member;
}

@ObjectType()
export class CommentTotalCounter {
	@Field(() => Int)
	total!: number;
}

@ObjectType()
export class Comments {
	@Field(() => [Comment])
	list!: Comment[];

	@Field(() => [CommentTotalCounter], { nullable: true })
	metaCounter?: CommentTotalCounter[];
}
