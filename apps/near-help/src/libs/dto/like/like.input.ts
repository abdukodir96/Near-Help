import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsInt, IsMongoId, IsNotEmpty, IsOptional, Max, Min } from 'class-validator';
import { LikeGroup } from '../../enums/like.enum';

@InputType()
export class LikeInput {
	@IsNotEmpty()
	@IsMongoId()
	@Field(() => String)
	likeRefId!: string;

	@IsNotEmpty()
	@IsEnum(LikeGroup)
	@Field(() => LikeGroup)
	likeGroup!: LikeGroup;

	// populated from auth context in service/resolver layer
	memberId?: string;
}

@InputType()
export class LikeTargetMemberInput {
	@IsNotEmpty()
	@IsMongoId()
	@Field(() => String)
	targetMemberId!: string;
}

@InputType()
export class LikeTargetServiceInput {
	@IsNotEmpty()
	@IsMongoId()
	@Field(() => String)
	targetServiceId!: string;
}

@InputType()
export class LikeTargetArticleInput {
	@IsNotEmpty()
	@IsMongoId()
	@Field(() => String)
	targetArticleId!: string;
}

@InputType()
export class LikeTargetCommentInput {
	@IsNotEmpty()
	@IsMongoId()
	@Field(() => String)
	targetCommentId!: string;
}

@InputType()
export class GetFavoritesInput {
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
}
