import { Args, Query, Resolver } from '@nestjs/graphql';
import { AiPricingService } from './pricing/ai-pricing.service';
import { EstimateServicePriceInput } from './dto/ai.input';
import { PriceEstimate } from './dto/ai.output';

@Resolver()
export class AiResolver {
	constructor(private readonly aiPricingService: AiPricingService) {}

	@Query(() => PriceEstimate)
	public async estimateServicePrice(@Args('input') input: EstimateServicePriceInput): Promise<PriceEstimate> {
		console.log('Query: estimateServicePrice');
		return this.aiPricingService.estimateServicePrice(input);
	}
}
