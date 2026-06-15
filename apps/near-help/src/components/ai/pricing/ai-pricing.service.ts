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
		if (!this.aiService.isPricingEnabled() || !this.aiService.hasPricingProvider()) {
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

		return this.normalizePriceEstimate(this.validateRawPriceEstimate(result));
	}

	private normalizePriceEstimate(result: RawPriceEstimate): PriceEstimate {
		const min = this.normalizePrice(result.estimatedMinPrice);
		const max = this.normalizePrice(result.estimatedMaxPrice);
		const estimatedMinPrice = Math.min(min, max);
		const estimatedMaxPrice = Math.max(min, max);
		const summary = this.normalizeSummary(result.summary);

		if (estimatedMaxPrice <= 0) {
			throw new ServiceUnavailableException('AI pricing returned an invalid price range.');
		}

		return {
			estimatedMinPrice,
			estimatedMaxPrice,
			currency: this.normalizeCurrency(result.currency),
			confidence: this.normalizeConfidence(result.confidence),
			summary,
			disclaimer: AI_PRICING_DISCLAIMER,
		};
	}

	private validateRawPriceEstimate(payload: unknown): RawPriceEstimate {
		if (!payload || typeof payload !== 'object') {
			throw new ServiceUnavailableException('AI pricing returned an invalid response payload.');
		}

		const candidate = payload as Partial<RawPriceEstimate>;
		if (
			typeof candidate.estimatedMinPrice !== 'number' ||
			typeof candidate.estimatedMaxPrice !== 'number' ||
			typeof candidate.currency !== 'string' ||
			typeof candidate.confidence !== 'number' ||
			typeof candidate.summary !== 'string'
		) {
			throw new ServiceUnavailableException('AI pricing returned an incomplete response payload.');
		}

		return candidate as RawPriceEstimate;
	}

	private normalizePrice(value: number): number {
		if (!Number.isFinite(value) || value < 0) {
			return 0;
		}

		return Math.round(value);
	}

	private normalizeCurrency(value: string): string {
		return value.trim().toUpperCase() === 'KRW' ? 'KRW' : 'KRW';
	}

	private normalizeConfidence(value: number): number {
		if (!Number.isFinite(value)) return 0;
		return Math.min(100, Math.max(0, Math.round(value)));
	}

	private normalizeSummary(value: string): string {
		const summary = value.trim().replace(/\s+/g, ' ');
		if (!summary) {
			throw new ServiceUnavailableException('AI pricing returned an empty summary.');
		}

		return summary.slice(0, 240);
	}
}
