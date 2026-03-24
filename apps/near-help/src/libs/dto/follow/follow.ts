import { Field, Int, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { Member } from '../member/member';
import { MeLiked } from '../like/like';

@ObjectType()
export class MeFollowed {
	@Field(() => String)
	followingId!: string;

	@Field(() => String)
	followerId!: string;

	@Field(() => Boolean)
	myFollowing!: boolean;
}

@ObjectType()
export class Follower {
	@Field(() => String)
	_id!: mongoose.ObjectId;

	@Field(() => String)
	followingId!: string;

	@Field(() => String)
	followerId!: string;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;

	@Field(() => [MeLiked], { nullable: true })
	meLiked?: MeLiked[];

	@Field(() => [MeFollowed], { nullable: true })
	meFollowed?: MeFollowed[];

	@Field(() => Member, { nullable: true })
	followerData?: Member;
}

@ObjectType()
export class Following {
	@Field(() => String)
	_id!: mongoose.ObjectId;

	@Field(() => String)
	followingId!: string;

	@Field(() => String)
	followerId!: string;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;

	@Field(() => [MeLiked], { nullable: true })
	meLiked?: MeLiked[];

	@Field(() => [MeFollowed], { nullable: true })
	meFollowed?: MeFollowed[];

	@Field(() => Member, { nullable: true })
	followingData?: Member;
}

@ObjectType()
export class FollowTotalCounter {
	@Field(() => Int)
	total!: number;
}

@ObjectType()
export class Followings {
	@Field(() => [Following])
	list!: Following[];

	@Field(() => [FollowTotalCounter], { nullable: true })
	metaCounter?: FollowTotalCounter[];
}

@ObjectType()
export class Followers {
	@Field(() => [Follower])
	list!: Follower[];

	@Field(() => [FollowTotalCounter], { nullable: true })
	metaCounter?: FollowTotalCounter[];
}
