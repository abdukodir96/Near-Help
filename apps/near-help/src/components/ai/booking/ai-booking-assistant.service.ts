import { BadRequestException, Injectable } from '@nestjs/common';
import { BookingAssistantResult, PriceEstimate } from '../dto/ai.output';
import { RecommendAndEstimateServicesInput } from '../dto/ai.input';
import { AiPricingService } from '../pricing/ai-pricing.service';
import { AiRecommendationService } from '../recommendation/ai-recommendation.service';
import { AuthMemberPayload } from '../../../libs/types/auth';
import { ServicesResult } from '../../../libs/dto/service/service';
import { Message } from '../../../libs/enums/common.enum';

@Injectable()
export class AiBookingAssistantService {
	constructor(
		private readonly aiPricingService: AiPricingService,
		private readonly aiRecommendationService: AiRecommendationService,
	) {}

	public async recommendAndEstimateServices(
		authMember: AuthMemberPayload | null,
		input: RecommendAndEstimateServicesInput,
	): Promise<BookingAssistantResult> {
		if (
			typeof input.budgetMin === 'number' &&
			typeof input.budgetMax === 'number' &&
			input.budgetMin > input.budgetMax
		) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		const priceEstimate = await this.aiPricingService.estimateServicePrice({
			serviceCategory: input.serviceCategory,
			serviceOption: input.serviceOption,
			serviceArea: input.serviceArea,
			problemDescription: input.problemDescription,
			urgencyNote: input.urgencyNote,
		});

		const recommendedServices = await this.aiRecommendationService.recommendServices(authMember, {
			problemDescription: input.problemDescription,
			serviceCategory: input.serviceCategory,
			serviceOption: input.serviceOption,
			serviceArea: input.serviceArea,
			minPrice: input.budgetMin,
			maxPrice: input.budgetMax,
			page: input.page,
			limit: input.limit,
		});

		return {
			priceEstimate,
			recommendedServices,
			summary: this.buildSummary(priceEstimate, recommendedServices),
			nextAction: this.buildNextAction(recommendedServices),
		};
	}

	private buildSummary(priceEstimate: PriceEstimate, recommendedServices: ServicesResult): string {
		const recommendedCount = recommendedServices.meta.totalCount;
		if (recommendedCount === 0) {
			return `Estimated range is ${priceEstimate.estimatedMinPrice}-${priceEstimate.estimatedMaxPrice} ${priceEstimate.currency}, but no strong service matches were found yet.`;
		}

		const topService = recommendedServices.list[0];
		return `Estimated range is ${priceEstimate.estimatedMinPrice}-${priceEstimate.estimatedMaxPrice} ${priceEstimate.currency}. Found ${recommendedCount} matching services, with "${topService.serviceTitle}" currently ranked highest.`;
	}

	private buildNextAction(recommendedServices: ServicesResult): string {
		if (recommendedServices.meta.totalCount === 0) {
			return 'Try broadening the service area or category, then request another recommendation.';
		}

		return 'Review the top matched services, compare price and ratings, then continue with booking.';
	}
}
