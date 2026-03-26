import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Service } from '../../near-help/src/libs/dto/service/service';
import { Member } from '../../near-help/src/libs/dto/member/member';
import { ServiceStatus } from '../../near-help/src/libs/enums/service.enum';
import { MemberStatus, MemberType } from '../../near-help/src/libs/enums/member.enum';

@Injectable()
export class NearHelpBatchService {
	private readonly logger = new Logger(NearHelpBatchService.name);

	constructor(
		@InjectModel('Service') private readonly serviceModel: Model<Service>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
	) {}

	public async batchRollback(): Promise<void> {
		await Promise.all([
			this.serviceModel
				.updateMany(
					{
						serviceStatus: ServiceStatus.ACTIVE,
					},
					{ serviceRank: 0 },
				)
				.exec(),
			this.memberModel
				.updateMany(
					{
						memberStatus: MemberStatus.ACTIVE,
						memberType: MemberType.AGENT,
					},
					{ memberRank: 0 },
				)
				.exec(),
		]);

		this.logger.log('Batch rollback completed');
	}

	public async batchTopServices(): Promise<void> {
		const services = await this.serviceModel
			.find({
				serviceStatus: ServiceStatus.ACTIVE,
				serviceRank: 0,
			})
			.select({ _id: 1, serviceLikes: 1, serviceViews: 1 })
			.lean()
			.exec();

		if (services.length === 0) {
			this.logger.log('No services found for batchTopServices');
			return;
		}

		await this.serviceModel.bulkWrite(
			services.map((service) => ({
				updateOne: {
					filter: { _id: service._id },
					update: {
						$set: {
							serviceRank: service.serviceLikes * 2 + service.serviceViews,
						},
					},
				},
			})),
		);

		this.logger.log(`batchTopServices updated ${services.length} services`);
	}

	public async batchTopAgents(): Promise<void> {
		const agents = await this.memberModel
			.find({
				memberType: MemberType.AGENT,
				memberStatus: MemberStatus.ACTIVE,
				memberRank: 0,
			})
			.select({ _id: 1, memberServices: 1, memberLikes: 1, memberArticles: 1, memberViews: 1 })
			.lean()
			.exec();

		if (agents.length === 0) {
			this.logger.log('No agents found for batchTopAgents');
			return;
		}

		await this.memberModel.bulkWrite(
			agents.map((agent) => ({
				updateOne: {
					filter: { _id: agent._id },
					update: {
						$set: {
							memberRank:
								agent.memberServices * 5 + agent.memberArticles * 3 + agent.memberLikes * 2 + agent.memberViews,
						},
					},
				},
			})),
		);

		this.logger.log(`batchTopAgents updated ${agents.length} agents`);
	}

	public getHello(): string {
		return 'Welcome to NearHelp BATCH Server!';
	}
}
