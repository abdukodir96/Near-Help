import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsMongoId, IsNotEmpty, IsOptional, Max, Min } from 'class-validator';

@InputType()
class FollowSearch {
	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	followingId?: string;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	followerId?: string;
}

@InputType()
export class FollowInquiry {
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

	@IsNotEmpty()
	@Field(() => FollowSearch)
	search!: FollowSearch;
}
