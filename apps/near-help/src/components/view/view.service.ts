import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RecordViewInput } from '../../libs/dto/view/view.input';
import { RecordViewResponse } from '../../libs/dto/view/view';
import { ViewGroup } from '../../libs/enums/view.enum';
import { Message } from '../../libs/enums/common.enum';
import { MemberStatus } from '../../libs/enums/member.enum';
import { ServiceStatus } from '../../libs/enums/service.enum';
import { ArticleStatus } from '../../libs/enums/article.enum';
import { createHash } from 'crypto';

type ViewRecord = {
	viewGroup: ViewGroup;
	viewRefId: string;
	memberId: string;
};

type MemberViewTarget = {
	_id: string;
	memberStatus: MemberStatus;
	memberViews: number;
};

type ServiceViewTarget = {
	_id: string;
	serviceStatus: ServiceStatus;
	serviceViews: number;
};

type ArticleViewTarget = {
	_id: string;
	articleStatus: ArticleStatus;
	articleViews: number;
};

@Injectable()
export class ViewService {
	constructor(
		@InjectModel('View') private readonly viewModel: Model<ViewRecord>,
		@InjectModel('Member') private readonly memberModel: Model<MemberViewTarget>,
		@InjectModel('Service') private readonly serviceModel: Model<ServiceViewTarget>,
		@InjectModel('Article') private readonly articleModel: Model<ArticleViewTarget>,
	) {}

	public async recordView(
		memberId: string | null,
		guestKey: string | null,
		input: RecordViewInput,
	): Promise<RecordViewResponse> {
		const viewerMemberId = await this.resolveViewerMemberId(memberId, guestKey);

		const { viewGroup, viewRefId } = input;
		const currentViews = await this.getCurrentViews(viewGroup, viewRefId);

		try {
			await this.viewModel.create({
				viewGroup,
				viewRefId,
				memberId: viewerMemberId,
			});

			const totalViews = await this.incrementViews(viewGroup, viewRefId);
			return {
				recorded: true,
				viewGroup,
				viewRefId,
				totalViews,
			};
		} catch (err: unknown) {
			const mongoError = err as { code?: number };
			if (mongoError?.code === 11000) {
				return {
					recorded: false,
					viewGroup,
					viewRefId,
					totalViews: currentViews,
				};
			}

			throw new BadRequestException(Message.BAD_REQUEST);
		}
	}

	private async resolveViewerMemberId(memberId: string | null, guestKey: string | null): Promise<string> {
		if (memberId) {
			await this.ensureViewerCanRecord(memberId);
			return memberId;
		}

		if (!guestKey) {
			throw new UnauthorizedException(Message.NOT_AUTHENTICATED);
		}

		return this.getGuestMemberId(guestKey);
	}

	private async ensureViewerCanRecord(memberId: string): Promise<void> {
		const viewer = await this.memberModel.findById(memberId).select({ memberStatus: 1 }).exec();

		if (!viewer || viewer.memberStatus === MemberStatus.DELETED) {
			throw new UnauthorizedException(Message.NOT_AUTHENTICATED);
		}

		if (viewer.memberStatus === MemberStatus.BLOCKED) {
			throw new ForbiddenException(Message.BLOCKED_USER);
		}
	}

	private getGuestMemberId(guestKey: string): string {
		return createHash('sha256').update(`near-help-guest:${guestKey}`).digest('hex').slice(0, 24);
	}

	private async getCurrentViews(viewGroup: ViewGroup, viewRefId: string): Promise<number> {
		switch (viewGroup) {
			case ViewGroup.MEMBER: {
				const target = await this.memberModel
					.findOne({ _id: viewRefId, memberStatus: { $ne: MemberStatus.DELETED } })
					.select({ memberViews: 1 })
					.exec();
				if (!target) throw new NotFoundException(Message.NO_DATA_FOUND);
				return target.memberViews;
			}

			case ViewGroup.SERVICE: {
				const target = await this.serviceModel
					.findOne({ _id: viewRefId, serviceStatus: { $ne: ServiceStatus.DELETED } })
					.select({ serviceViews: 1 })
					.exec();
				if (!target) throw new NotFoundException(Message.NO_DATA_FOUND);
				return target.serviceViews;
			}

			case ViewGroup.ARTICLE: {
				const target = await this.articleModel
					.findOne({ _id: viewRefId, articleStatus: { $ne: ArticleStatus.DELETED } })
					.select({ articleViews: 1 })
					.exec();
				if (!target) throw new NotFoundException(Message.NO_DATA_FOUND);
				return target.articleViews;
			}
		}

		throw new BadRequestException(Message.BAD_REQUEST);
	}

	private async incrementViews(viewGroup: ViewGroup, viewRefId: string): Promise<number> {
		switch (viewGroup) {
			case ViewGroup.MEMBER: {
				const updated = await this.memberModel
					.findOneAndUpdate(
						{ _id: viewRefId, memberStatus: { $ne: MemberStatus.DELETED } },
						{ $inc: { memberViews: 1 } },
						{ new: true },
					)
					.select({ memberViews: 1 })
					.exec();
				if (!updated) throw new NotFoundException(Message.NO_DATA_FOUND);
				return updated.memberViews;
			}

			case ViewGroup.SERVICE: {
				const updated = await this.serviceModel
					.findOneAndUpdate(
						{ _id: viewRefId, serviceStatus: { $ne: ServiceStatus.DELETED } },
						{ $inc: { serviceViews: 1 } },
						{ new: true },
					)
					.select({ serviceViews: 1 })
					.exec();
				if (!updated) throw new NotFoundException(Message.NO_DATA_FOUND);
				return updated.serviceViews;
			}

			case ViewGroup.ARTICLE: {
				const updated = await this.articleModel
					.findOneAndUpdate(
						{ _id: viewRefId, articleStatus: { $ne: ArticleStatus.DELETED } },
						{ $inc: { articleViews: 1 } },
						{ new: true },
					)
					.select({ articleViews: 1 })
					.exec();
				if (!updated) throw new NotFoundException(Message.NO_DATA_FOUND);
				return updated.articleViews;
			}
		}

		throw new BadRequestException(Message.BAD_REQUEST);
	}
}
