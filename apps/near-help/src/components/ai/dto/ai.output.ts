import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { ServicesResult } from '../../../libs/dto/service/service';

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

@ObjectType()
export class BookingAssistantResult {
	@Field(() => PriceEstimate)
	priceEstimate!: PriceEstimate;

	@Field(() => ServicesResult)
	recommendedServices!: ServicesResult;

	@Field(() => String)
	summary!: string;

	@Field(() => String)
	nextAction!: string;
}
