import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PriceEstimate {
	@Field(() => Float)
	estimatedMinPrice!: number;

	@Field(() => Float)
	estimatedMaxPrice!: number;

	@Field(() => String)
	currency!: string;

	@Field(() => Int)
	confidence!: number;

	@Field(() => String)
	summary!: string;

	@Field(() => String)
	disclaimer!: string;
}
