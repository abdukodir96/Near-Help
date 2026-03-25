import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GetVisitedInput, ViewInput } from '../../libs/dto/view/view.input';
import { View } from '../../libs/dto/view/view';
import { ServicesResult, Service } from '../../libs/dto/service/service';
import { ViewGroup } from '../../libs/enums/view.enum';
import { ServiceStatus } from '../../libs/enums/service.enum';
import { LikeGroup } from '../../libs/enums/like.enum';
import { lookupAuthMemberFollowed, lookupAuthMemberLiked } from '../../libs/config';

type ViewRecord = Pick<ViewInput, 'memberId' | 'viewGroup' | 'viewRefId'>;
type VisitedAggregateResult = {
	list: Service[];
	metaCounter: Array<{ total: number }>;
};

@Injectable()
export class ViewService {
	constructor(@InjectModel('View') private readonly viewModel: Model<View>) {}

	public async recordView(input: ViewInput): Promise<View | null> {
		const viewExist = await this.checkViewExistence(input);
		if (viewExist) {
			await this.viewModel.updateOne({ _id: viewExist._id }, { $set: { updatedAt: new Date() } }).exec();
			return null;
		}

		return this.viewModel.create(input);
	}

	public async getVisited(memberId: string, input?: GetVisitedInput): Promise<ServicesResult> {
		const page = input?.page && input.page > 0 ? input.page : 1;
		const limit = input?.limit && input.limit > 0 ? Math.min(input.limit, 100) : 20;

		const data = await this.viewModel
			.aggregate<VisitedAggregateResult>([
				{
					$match: {
						memberId: new Types.ObjectId(memberId),
						viewGroup: ViewGroup.SERVICE,
					},
				},
				{ $sort: { updatedAt: -1 } },
				{
					$lookup: {
						from: 'services',
						localField: 'viewRefId',
						foreignField: '_id',
						as: 'serviceData',
					},
				},
				{ $unwind: { path: '$serviceData', preserveNullAndEmptyArrays: false } },
				{
					$match: {
						'serviceData.serviceStatus': ServiceStatus.ACTIVE,
					},
				},
				{ $replaceRoot: { newRoot: '$serviceData' } },
				{
					$facet: {
						list: [
							{ $skip: (page - 1) * limit },
							{ $limit: limit },
							{
								$lookup: {
									from: 'members',
									localField: 'memberId',
									foreignField: '_id',
									as: 'memberData',
								},
							},
							{ $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
							...lookupAuthMemberLiked(memberId, LikeGroup.SERVICE),
							...lookupAuthMemberFollowed(memberId, '$memberId', 'memberFollowed'),
							{ $addFields: { 'memberData.meFollowed': '$memberFollowed' } },
							{ $project: { memberFollowed: 0 } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		const totalCount = data[0]?.metaCounter?.[0]?.total ?? 0;
		const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / limit);

		return {
			list: data[0]?.list ?? [],
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

	private async checkViewExistence(input: ViewInput): Promise<View | null> {
		const search: ViewRecord = {
			memberId: input.memberId,
			viewGroup: input.viewGroup,
			viewRefId: input.viewRefId,
		};
		return this.viewModel.findOne(search).exec();
	}
}
