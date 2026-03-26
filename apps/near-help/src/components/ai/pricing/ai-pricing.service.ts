import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { AiService } from '../ai.service';
import { EstimateServicePriceInput } from '../dto/ai.input';
import { PriceEstimate } from '../dto/ai.output';
import {
	AI_PRICING_DISCLAIMER,
	buildPricingSystemPrompt,
	buildPricingUserPrompt,
	pricingResponseSchema,
} from './pricing.prompt';

type RawPriceEstimate = {
	estimatedMinPrice: number;
	estimatedMaxPrice: number;
	currency: string;
	confidence: number;
	summary: string;
};

@Injectable()
export class AiPricingService {
	constructor(private readonly aiService: AiService) {}

	public async estimateServicePrice(input: EstimateServicePriceInput): Promise<PriceEstimate> {
		if (!this.aiService.isPricingEnabled()) {
			throw new ServiceUnavailableException('AI pricing is currently disabled.');
		}

		const cleanedDescription = input.problemDescription.trim();
		if (cleanedDescription.length < 10) {
			throw new BadRequestException('Problem description is too short for price estimation.');
		}

		const result = await this.aiService.createStructuredResponse<RawPriceEstimate>({
			model: this.aiService.getPricingModel(),
			systemPrompt: buildPricingSystemPrompt(),
			userPrompt: buildPricingUserPrompt(input),
			schemaName: 'service_price_estimate',
			schema: pricingResponseSchema,
		});

		return this.normalizePriceEstimate(result);
	}

	private normalizePriceEstimate(result: RawPriceEstimate): PriceEstimate {
		const min = this.normalizePrice(result.estimatedMinPrice);
		const max = this.normalizePrice(result.estimatedMaxPrice);
		const estimatedMinPrice = Math.min(min, max);
		const estimatedMaxPrice = Math.max(min, max);

		return {
			estimatedMinPrice,
			estimatedMaxPrice,
			currency: result.currency === 'KRW' ? 'KRW' : 'KRW',
			confidence: this.normalizeConfidence(result.confidence),
			summary: result.summary.trim(),
			disclaimer: AI_PRICING_DISCLAIMER,
		};
	}

	private normalizePrice(value: number): number {
		if (!Number.isFinite(value) || value < 0) {
			return 0;
		}

		return Math.round(value);
	}

	private normalizeConfidence(value: number): number {
		if (!Number.isFinite(value)) return 0;
		return Math.min(100, Math.max(0, Math.round(value)));
	}
}
