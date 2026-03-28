import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AiPricingService } from './pricing/ai-pricing.service';
import {
	EstimateServicePriceInput,
	RecommendAndEstimateServicesInput,
	RecommendServicesInput,
	SemanticSearchServicesInput,
	SyncServiceEmbeddingsInput,
} from './dto/ai.input';
import { BookingAssistantResult, PriceEstimate } from './dto/ai.output';
import { AiRecommendationService } from './recommendation/ai-recommendation.service';
import { ServicesResult } from '../../libs/dto/service/service';
import { UseGuards } from '@nestjs/common';
import { OptionalAuthGuard } from '../../libs/guards/optional-auth.guard';
import { AuthMember } from '../../libs/decorators/authMember.decorators';
import { AuthMemberPayload } from '../../libs/types/auth';
import { AuthGuard } from '../../libs/guards/auth.guard';
import { RolesGuard } from '../../libs/guards/roles.guard';
import { Roles } from '../../libs/decorators/roles.decorators';
import { MemberType } from '../../libs/enums/member.enum';
import { AiEmbeddingService } from './embeddings/ai-embedding.service';
import { AiBookingAssistantService } from './booking/ai-booking-assistant.service';

@Resolver()
export class AiResolver {
	constructor(
		private readonly aiPricingService: AiPricingService,
		private readonly aiRecommendationService: AiRecommendationService,
		private readonly aiEmbeddingService: AiEmbeddingService,
		private readonly aiBookingAssistantService: AiBookingAssistantService,
	) {}

	@Query(() => PriceEstimate)
	public async estimateServicePrice(@Args('input') input: EstimateServicePriceInput): Promise<PriceEstimate> {
		console.log('Query: estimateServicePrice');
		return this.aiPricingService.estimateServicePrice(input);
	}

	@UseGuards(OptionalAuthGuard)
	@Query(() => ServicesResult)
	public async semanticSearchServices(
		@AuthMember() authMember: AuthMemberPayload | null,
		@Args('input') input: SemanticSearchServicesInput,
	): Promise<ServicesResult> {
		console.log('Query: semanticSearchServices');
		return this.aiRecommendationService.semanticSearchServices(authMember, input);
	}

	@UseGuards(OptionalAuthGuard)
	@Query(() => ServicesResult)
	public async recommendServices(
		@AuthMember() authMember: AuthMemberPayload | null,
		@Args('input') input: RecommendServicesInput,
	): Promise<ServicesResult> {
		console.log('Query: recommendServices');
		return this.aiRecommendationService.recommendServices(authMember, input);
	}

	@UseGuards(OptionalAuthGuard)
	@Query(() => BookingAssistantResult)
	public async recommendAndEstimateServices(
		@AuthMember() authMember: AuthMemberPayload | null,
		@Args('input') input: RecommendAndEstimateServicesInput,
	): Promise<BookingAssistantResult> {
		console.log('Query: recommendAndEstimateServices');
		return this.aiBookingAssistantService.recommendAndEstimateServices(authMember, input);
	}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.ADMIN)
	@Mutation(() => Int)
	public async syncServiceEmbeddings(
		@Args('input', { nullable: true }) input?: SyncServiceEmbeddingsInput,
	): Promise<number> {
		console.log('Mutation: syncServiceEmbeddings');
		return this.aiEmbeddingService.syncMissingServiceEmbeddings(input?.limit);
	}
}
