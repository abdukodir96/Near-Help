import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsMongoId, IsNotEmpty } from 'class-validator';
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
