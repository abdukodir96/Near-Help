import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { aiConfig, lookupAuthMemberFollowed, lookupAuthMemberLiked } from '../../../libs/config';
import { Service, ServicesResult } from '../../../libs/dto/service/service';
import { LikeGroup } from '../../../libs/enums/like.enum';
import { Message } from '../../../libs/enums/common.enum';
import { ServiceStatus } from '../../../libs/enums/service.enum';
import { AuthMemberPayload } from '../../../libs/types/auth';
import { AiService } from '../ai.service';
import { RecommendServicesInput, SemanticSearchServicesInput } from '../dto/ai.input';

type RankedService = {
	serviceId: string;
	score: number;
};

type SearchInput = {
	queryText: string;
	serviceCategory?: string;
	serviceOption?: string;
	serviceArea?: string;
	minPrice?: number;
	maxPrice?: number;
	page?: number;
	limit?: number;
};

const MIN_SEMANTIC_SCORE = 0.15;

@Injectable()
export class AiRecommendationService {
	constructor(
		private readonly aiService: AiService,
		@InjectModel('Service') private readonly serviceModel: Model<Service>,
	) {}

	public async semanticSearchServices(
		authMember: AuthMemberPayload | null,
		input: SemanticSearchServicesInput,
	): Promise<ServicesResult> {
		return this.searchServices(authMember, {
			queryText: input.searchQuery,
			serviceCategory: input.serviceCategory,
			serviceOption: input.serviceOption,
			serviceArea: input.serviceArea,
			minPrice: input.minPrice,
			maxPrice: input.maxPrice,
			page: input.page,
			limit: input.limit,
		});
	}

	public async recommendServices(
		authMember: AuthMemberPayload | null,
		input: RecommendServicesInput,
	): Promise<ServicesResult> {
		return this.searchServices(authMember, {
			queryText: input.problemDescription,
			serviceCategory: input.serviceCategory,
			serviceOption: input.serviceOption,
			serviceArea: input.serviceArea,
			minPrice: input.minPrice,
			maxPrice: input.maxPrice,
			page: input.page,
			limit: input.limit,
		});
	}

	private async searchServices(authMember: AuthMemberPayload | null, input: SearchInput): Promise<ServicesResult> {
		if (!this.aiService.isRecommendationAvailable()) {
			throw new ServiceUnavailableException('AI service recommendations are currently unavailable.');
		}

		const queryText = input.queryText.trim();
		if (queryText.length < 3) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}
		if (typeof input.minPrice === 'number' && typeof input.maxPrice === 'number' && input.minPrice > input.maxPrice) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		const queryEmbedding = await this.aiService.createEmbedding(queryText);
		const candidateLimit = Math.max(50, this.aiService.getSemanticCandidateLimit() || aiConfig.semanticCandidateLimit);
		const candidates = await this.serviceModel
			.find(this.buildServiceFilter(input))
			.sort({ serviceRank: -1, createdAt: -1 })
			.limit(candidateLimit)
			.select({
				_id: 1,
				embedding: 1,
			})
			.lean()
			.exec();

		const rankedServices = candidates
			.map((service) => {
				const score = this.calculateCosineSimilarity(queryEmbedding, service.embedding ?? []);
				return {
					serviceId: String(service._id),
					score,
				};
			})
			.filter((service) => service.score >= MIN_SEMANTIC_SCORE)
			.sort((left, right) => right.score - left.score);

		return this.buildSearchResult(authMember, rankedServices, input.page, input.limit);
	}

	private buildServiceFilter(input: SearchInput): Record<string, unknown> {
		const filter: Record<string, unknown> = {
			serviceStatus: ServiceStatus.ACTIVE,
		};

		if (input.serviceCategory) {
			filter.serviceCategory = input.serviceCategory;
		}
		if (input.serviceOption) {
			filter.serviceOption = input.serviceOption;
		}
		if (input.serviceArea) {
			filter.serviceArea = input.serviceArea;
		}

		if (typeof input.minPrice === 'number' || typeof input.maxPrice === 'number') {
			filter.servicePrice = {};
			if (typeof input.minPrice === 'number') {
				(filter.servicePrice as { $gte?: number }).$gte = input.minPrice;
			}
			if (typeof input.maxPrice === 'number') {
				(filter.servicePrice as { $lte?: number }).$lte = input.maxPrice;
			}
		}

		return filter;
	}

	private async buildSearchResult(
		authMember: AuthMemberPayload | null,
		rankedServices: RankedService[],
		pageInput?: number,
		limitInput?: number,
	): Promise<ServicesResult> {
		const page = pageInput && pageInput > 0 ? pageInput : 1;
		const limit = limitInput && limitInput > 0 ? Math.min(limitInput, 50) : 10;
		const totalCount = rankedServices.length;
		const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / limit);

		if (rankedServices.length === 0) {
			return {
				list: [],
				meta: {
					totalCount: 0,
					page,
					limit,
					totalPages: 0,
					hasNextPage: false,
					hasPrevPage: false,
				},
			};
		}

		const pagedRankedServices = rankedServices.slice((page - 1) * limit, page * limit);
		const pageServiceIds = pagedRankedServices.map((service) => new Types.ObjectId(service.serviceId));

		const services = await this.serviceModel
			.aggregate<Service>([
				{
					$match: {
						_id: { $in: pageServiceIds },
						serviceStatus: ServiceStatus.ACTIVE,
					},
				},
				{
					$lookup: {
						from: 'members',
						localField: 'memberId',
						foreignField: '_id',
						as: 'memberData',
					},
				},
				{ $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
				...lookupAuthMemberLiked(authMember?._id, LikeGroup.SERVICE),
				...lookupAuthMemberFollowed(authMember?._id, '$memberId', 'memberFollowed'),
				{ $addFields: { 'memberData.meFollowed': '$memberFollowed' } },
				{ $project: { memberFollowed: 0, embedding: 0 } },
			])
			.exec();

		const serviceMap = new Map(services.map((service) => [String(service._id), service]));
		const list: Service[] = [];
		for (const rankedService of pagedRankedServices) {
			const service = serviceMap.get(rankedService.serviceId);
			if (!service) continue;

			list.push({
				...service,
				semanticScore: Number(rankedService.score.toFixed(4)),
			});
		}

		return {
			list,
			meta: {
				totalCount,
				page,
				limit,
				totalPages,
				hasNextPage: totalPages > 0 && page < totalPages,
				hasPrevPage: page > 1 && totalPages > 0,
			},
		};
	}

	private calculateCosineSimilarity(left: number[], right: number[]): number {
		if (
			!Array.isArray(left) ||
			!Array.isArray(right) ||
			left.length === 0 ||
			right.length === 0 ||
			left.length !== right.length
		) {
			return 0;
		}

		let dotProduct = 0;
		let leftMagnitude = 0;
		let rightMagnitude = 0;

		for (let index = 0; index < left.length; index += 1) {
			const leftValue = left[index];
			const rightValue = right[index];

			dotProduct += leftValue * rightValue;
			leftMagnitude += leftValue * leftValue;
			rightMagnitude += rightValue * rightValue;
		}

		if (leftMagnitude === 0 || rightMagnitude === 0) {
			return 0;
		}

		return dotProduct / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
	}
}
