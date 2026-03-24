import { Field, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { LikeGroup } from '../../enums/like.enum';

@ObjectType()
export class MeLiked {
	@Field(() => String)
	memberId!: string;

	@Field(() => String)
	likeRefId!: string;

	@Field(() => Boolean)
	myFavorite!: boolean;
}

@ObjectType()
export class Like {
	@Field(() => String)
	_id!: mongoose.ObjectId;

	@Field(() => LikeGroup)
	likeGroup!: LikeGroup;

	@Field(() => String)
	likeRefId!: string;

	@Field(() => String)
	memberId!: string;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;
}
