import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Service } from '../../../libs/dto/service/service';
import { ServiceStatus } from '../../../libs/enums/service.enum';
import { AiService } from '../ai.service';

type ServiceEmbeddingSource = Pick<
	Service,
	| 'serviceCategory'
	| 'serviceOption'
	| 'serviceAddress'
	| 'serviceArea'
	| 'serviceTitle'
	| 'serviceDesc'
	| 'serviceStatus'
>;

@Injectable()
export class AiEmbeddingService {
	private readonly logger = new Logger(AiEmbeddingService.name);

	constructor(
		private readonly aiService: AiService,
		@InjectModel('Service') private readonly serviceModel: Model<Service>,
	) {}

	public async syncServiceEmbeddingById(serviceId: string): Promise<boolean> {
		if (!this.aiService.isEmbeddingAvailable()) {
			return false;
		}

		const service = await this.serviceModel.findById(serviceId).lean().exec();
		if (!service || service.serviceStatus === ServiceStatus.DELETED) {
			return false;
		}

		const embeddingText = this.buildServiceEmbeddingText(service as ServiceEmbeddingSource);
		const embedding = await this.aiService.createEmbedding(embeddingText);

		await this.serviceModel.updateOne({ _id: serviceId }, { $set: { embedding } }).exec();
		return true;
	}

	public async syncMissingServiceEmbeddings(limit?: number): Promise<number> {
		if (!this.aiService.isRecommendationAvailable()) {
			throw new ServiceUnavailableException('AI service recommendations are currently unavailable.');
		}

		const normalizedLimit = Math.min(Math.max(limit ?? 20, 1), 100);
		const services = await this.serviceModel
			.find({
				serviceStatus: ServiceStatus.ACTIVE,
				$or: [{ embedding: { $exists: false } }, { embedding: { $eq: [] } }],
			})
			.select({ _id: 1 })
			.limit(normalizedLimit)
			.lean()
			.exec();

		let syncedCount = 0;
		for (const service of services) {
			try {
				const synced = await this.syncServiceEmbeddingById(String(service._id));
				if (synced) syncedCount += 1;
			} catch (err: unknown) {
				const errMessage = err instanceof Error ? err.message : String(err);
				this.logger.warn(`Failed to sync embedding for service ${String(service._id)}: ${errMessage}`);
			}
		}

		return syncedCount;
	}

	private buildServiceEmbeddingText(service: ServiceEmbeddingSource): string {
		return [
			`Category: ${service.serviceCategory}`,
			`Option: ${service.serviceOption ?? 'STANDARD'}`,
			`Area: ${service.serviceArea ?? 'UNKNOWN'}`,
			`Address: ${service.serviceAddress}`,
			`Title: ${service.serviceTitle}`,
			`Description: ${service.serviceDesc ?? 'No additional description provided.'}`,
		].join('\n');
	}
}
