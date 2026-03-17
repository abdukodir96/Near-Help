import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { MemberAuthType, MemberStatus, MemberType } from '../../enums/member.enum';

@ObjectType()
export class Member {
	@Field(() => ID)
	_id!: mongoose.ObjectId;

	@Field(() => MemberType)
	memberType!: MemberType;

	@Field(() => MemberStatus)
	memberStatus!: MemberStatus;

	@Field(() => MemberAuthType)
	memberAuthType!: MemberAuthType;

	@Field(() => String)
	memberNick!: string;

	memberPassword?: string;
	memberRefreshToken?: string;
	memberRefreshTokenExpiresAt?: Date;

	@Field(() => String, { nullable: true })
	memberFullName?: string;

	@Field(() => String)
	memberImage!: string;

	@Field(() => String, { nullable: true })
	memberAddress?: string;

	@Field(() => String, { nullable: true })
	memberDesc?: string;

	@Field(() => Int)
	memberServices!: number;

	@Field(() => Int)
	memberArticles!: number;

	@Field(() => Int)
	memberFollowers!: number;

	@Field(() => Int)
	memberFollowings!: number;

	@Field(() => Int)
	memberPoints!: number;

	@Field(() => Int)
	memberLikes!: number;

	@Field(() => Int)
	memberViews!: number;

	@Field(() => Int)
	memberComments!: number;

	@Field(() => Int)
	memberRank!: number;

	@Field(() => Int)
	memberWarnings!: number;

	@Field(() => Int)
	memberBlocks!: number;

	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;
}

@ObjectType()
export class MemberPrivate extends Member {
	@Field(() => String, { nullable: true })
	memberPhone?: string;

	@Field(() => String, { nullable: true })
	memberEmail?: string;

	@Field(() => String, { nullable: true })
	memberTelegramId?: string;
}
