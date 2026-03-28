import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { PaginationMeta } from '../../libs/dto/member/member';
import { Notice, NoticesResult } from '../../libs/dto/notice/notice';
import {
	AllNoticesInquiry,
	GetNoticeInput,
	NoticeInput,
	NoticesInquiry,
	RemoveNoticeByAdminInput,
	UpdateNoticeByAdminInput,
} from '../../libs/dto/notice/notice.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { NoticeStatus } from '../../libs/enums/notice.enum';

type NoticesAggregateResult = {
	list: Notice[];
	metaCounter: Array<{ total: number }>;
};

@Injectable()
export class NoticeService {
	constructor(@InjectModel('Notice') private readonly noticeModel: Model<Notice>) {}

	public async createNotice(memberId: string, input: NoticeInput): Promise<Notice> {
		try {
			const createdNotice = await this.noticeModel.create({
				...input,
				memberId,
				noticeStatus: NoticeStatus.ACTIVE,
			});

			return createdNotice as Notice;
		} catch (err: unknown) {
			const errMessage = err instanceof Error ? err.message : String(err);
			console.log('Error, Notice.createNotice:', errMessage);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getNotice(input: GetNoticeInput): Promise<Notice> {
		const [notice] = await this.noticeModel
			.aggregate<Notice>([
				{
					$match: {
						_id: new Types.ObjectId(input.noticeId),
						noticeStatus: NoticeStatus.ACTIVE,
					},
				},
				...this.buildMemberLookupStages(),
			])
			.exec();

		if (!notice) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}

		return notice;
	}

	public async getNotices(input: NoticesInquiry): Promise<NoticesResult> {
		const filter: Record<string, unknown> = {
			noticeStatus: NoticeStatus.ACTIVE,
		};

		if (input.search.noticeCategory) {
			filter.noticeCategory = input.search.noticeCategory;
		}

		this.applyTextSearch(filter, input.search.text);
		return this.findNoticeList(filter, input.page, input.limit, input.sort, input.direction);
	}

	public async getAllNoticesByAdmin(input: AllNoticesInquiry): Promise<NoticesResult> {
		const filter: Record<string, unknown> = {};

		if (input.search.noticeCategory) {
			filter.noticeCategory = input.search.noticeCategory;
		}

		if (input.search.noticeStatus) {
			filter.noticeStatus = input.search.noticeStatus;
		}

		this.applyTextSearch(filter, input.search.text);
		return this.findNoticeList(filter, input.page, input.limit, input.sort, input.direction);
	}

	public async updateNoticeByAdmin(input: UpdateNoticeByAdminInput): Promise<Notice> {
		const { targetNoticeId, ...rest } = input;
		const payload = Object.fromEntries(
			Object.entries(rest).filter(([, value]) => typeof value !== 'undefined' && value !== null),
		);

		if (!targetNoticeId || Object.keys(payload).length === 0) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		const existingNotice = await this.noticeModel.findById(targetNoticeId).exec();
		if (!existingNotice) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}

		try {
			const updatedNotice = await this.noticeModel
				.findByIdAndUpdate(targetNoticeId, { $set: payload }, { new: true, runValidators: true })
				.exec();

			if (!updatedNotice) {
				throw new NotFoundException(Message.NO_DATA_FOUND);
			}

			return updatedNotice as Notice;
		} catch (err: unknown) {
			const errMessage = err instanceof Error ? err.message : String(err);
			console.log('Error, Notice.updateNoticeByAdmin:', errMessage);
			throw new BadRequestException(Message.UPDATE_FAILED);
		}
	}

	public async removeNoticeByAdmin(input: RemoveNoticeByAdminInput): Promise<Notice> {
		const existingNotice = await this.noticeModel.findById(input.targetNoticeId).exec();
		if (!existingNotice) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}

		if (existingNotice.noticeStatus === NoticeStatus.DELETED) {
			return existingNotice as Notice;
		}

		try {
			const updatedNotice = await this.noticeModel
				.findByIdAndUpdate(
					input.targetNoticeId,
					{ $set: { noticeStatus: NoticeStatus.DELETED } },
					{ new: true, runValidators: true },
				)
				.exec();

			if (!updatedNotice) {
				throw new NotFoundException(Message.NO_DATA_FOUND);
			}

			return updatedNotice as Notice;
		} catch (err: unknown) {
			const errMessage = err instanceof Error ? err.message : String(err);
			console.log('Error, Notice.removeNoticeByAdmin:', errMessage);
			throw new BadRequestException(Message.REMOVE_FAILED);
		}
	}

	private async findNoticeList(
		filter: Record<string, unknown>,
		page: number,
		limit: number,
		sort?: string,
		direction?: Direction,
	): Promise<NoticesResult> {
		const sortField = sort ?? 'createdAt';
		const sortDirection: 1 | -1 = direction === Direction.ASC ? 1 : -1;
		const skip = (page - 1) * limit;

		const data = await this.noticeModel
			.aggregate<NoticesAggregateResult>([
				{ $match: filter },
				{ $sort: { [sortField]: sortDirection } },
				{
					$facet: {
						list: [{ $skip: skip }, { $limit: limit }, ...this.buildMemberLookupStages()],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		const totalCount = data[0]?.metaCounter?.[0]?.total ?? 0;
		const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / limit);
		const meta: PaginationMeta = {
			totalCount,
			page,
			limit,
			totalPages,
			hasNextPage: totalPages > 0 && page < totalPages,
			hasPrevPage: page > 1 && totalPages > 0,
		};

		return {
			list: data[0]?.list ?? [],
			meta,
		};
	}

	private buildMemberLookupStages(): Array<PipelineStage.Lookup | PipelineStage.Unwind> {
		return [
			{
				$lookup: {
					from: 'members',
					localField: 'memberId',
					foreignField: '_id',
					as: 'memberData',
				},
			},
			{ $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
		];
	}

	private applyTextSearch(filter: Record<string, unknown>, text?: string): void {
		const searchText = text?.trim();
		if (!searchText) return;

		const regex = new RegExp(searchText, 'i');
		filter.$or = [{ noticeTitle: regex }, { noticeContent: regex }];
	}
}
