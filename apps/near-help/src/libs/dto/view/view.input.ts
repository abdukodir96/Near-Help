import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsInt, IsMongoId, IsNotEmpty, IsOptional, Max, Min } from 'class-validator';
import { ViewGroup } from '../../enums/view.enum';

@InputType()
export class ViewInput {
	@IsNotEmpty()
	@IsMongoId()
	@Field(() => String)
	memberId!: string;

	@IsNotEmpty()
	@IsEnum(ViewGroup)
	@Field(() => ViewGroup)
	viewGroup!: ViewGroup;

	@IsNotEmpty()
	@IsMongoId()
	@Field(() => String)
	viewRefId!: string;
}

@InputType()
export class GetVisitedInput {
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
