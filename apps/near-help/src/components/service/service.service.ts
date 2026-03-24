import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
	CreateServiceInput,
	GetAgentPropertiesInput,
	GetServiceInput,
	GetServicesInput,
	UpdateServiceInput,
} from '../../libs/dto/service/service.input';
import { Service, ServicesResult } from '../../libs/dto/service/service';
import { Member } from '../../libs/dto/member/member';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { Message } from '../../libs/enums/common.enum';
import { ServiceSort, ServiceStatus } from '../../libs/enums/service.enum';
import { AuthMemberPayload } from '../../libs/types/auth';
import { ViewService } from '../view/view.service';
import { ViewGroup } from '../../libs/enums/view.enum';

@Injectable()
export class ServiceService {
	constructor(
		@InjectModel('Service') private readonly serviceModel: Model<Service>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		private readonly viewService: ViewService,
	) {}

	public async createService(memberId: string, input: CreateServiceInput): Promise<Service> {
		const member = await this.memberModel.findById(memberId).select({ memberStatus: 1 }).exec();
		if (!member || member.memberStatus === MemberStatus.DELETED) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}
		if (member.memberStatus === MemberStatus.BLOCKED) {
			throw new ForbiddenException(Message.BLOCKED_USER);
		}

		try {
			const createdService = await this.serviceModel.create({
				...input,
				memberId,
			});

			await this.memberModel.updateOne({ _id: memberId }, { $inc: { memberServices: 1 } }).exec();
			return createdService as Service;
		} catch (err: unknown) {
			const errMessage = err instanceof Error ? err.message : String(err);
			console.log('Error, Service.createService:', errMessage);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async updateService(authMember: AuthMemberPayload, input: UpdateServiceInput): Promise<Service> {
		const { targetServiceId, ...rest } = input;
		const payload = Object.fromEntries(
			Object.entries(rest).filter(([, value]) => typeof value !== 'undefined' && value !== null),
		);

		if (!targetServiceId || Object.keys(payload).length === 0) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		const service = await this.serviceModel.findById(targetServiceId).exec();
		if (!service || service.serviceStatus === ServiceStatus.DELETED) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}

		const isOwner = String(service.memberId) === authMember._id;
		const isAdmin = authMember.memberType === MemberType.ADMIN;

		if (!isOwner && !isAdmin) {
			throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
		}

		try {
			const updatedService = await this.serviceModel
				.findByIdAndUpdate(targetServiceId, { $set: payload }, { new: true, runValidators: true })
				.exec();

			if (!updatedService) {
				throw new NotFoundException(Message.NO_DATA_FOUND);
			}

			return updatedService as Service;
		} catch (err: unknown) {
			const errMessage = err instanceof Error ? err.message : String(err);
			console.log('Error, Service.updateService:', errMessage);
			throw new BadRequestException(Message.UPDATE_FAILED);
		}
	}

	public async getService(authMember: AuthMemberPayload | null, input: GetServiceInput): Promise<Service> {
		const service = await this.serviceModel.findById(input.serviceId).exec();

		if (!service || service.serviceStatus === ServiceStatus.DELETED) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}

		const isOwner = authMember?._id === String(service.memberId);
		const isAdmin = authMember?.memberType === MemberType.ADMIN;

		if (service.serviceStatus !== ServiceStatus.ACTIVE && !isOwner && !isAdmin) {
			throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
		}

		if (authMember && !isOwner) {
			const createdView = await this.viewService.recordView({
				memberId: authMember._id,
				viewGroup: ViewGroup.SERVICE,
				viewRefId: input.serviceId,
			});

			if (createdView) {
				await this.serviceModel.updateOne({ _id: input.serviceId }, { $inc: { serviceViews: 1 } }).exec();
				service.serviceViews += 1;
			}
		}

		return service as Service;
	}

	public async getServices(input?: GetServicesInput): Promise<ServicesResult> {
		if (typeof input?.minPrice === 'number' && typeof input?.maxPrice === 'number' && input.minPrice > input.maxPrice) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		const filter: Record<string, unknown> = {
			serviceStatus: ServiceStatus.ACTIVE,
		};

		const searchText = input?.searchText?.trim();
		if (searchText) {
			const regex = new RegExp(searchText, 'i');
			filter.$or = [{ serviceTitle: regex }, { serviceDesc: regex }, { serviceAddress: regex }];
		}

		if (input?.serviceCategory) {
			filter.serviceCategory = input.serviceCategory;
		}
		if (input?.serviceOption) {
			filter.serviceOption = input.serviceOption;
		}
		if (input?.serviceArea) {
			filter.serviceArea = input.serviceArea;
		}

		if (typeof input?.minPrice === 'number' || typeof input?.maxPrice === 'number') {
			filter.servicePrice = {};
			if (typeof input?.minPrice === 'number') {
				(filter.servicePrice as { $gte?: number }).$gte = input.minPrice;
			}
			if (typeof input?.maxPrice === 'number') {
				(filter.servicePrice as { $lte?: number }).$lte = input.maxPrice;
			}
		}

		const page = input?.page && input.page > 0 ? input.page : 1;
		const limit = input?.limit && input.limit > 0 ? Math.min(input.limit, 100) : 20;
		const sort = this.getServiceSort(input?.sortBy);
		const totalCount = await this.serviceModel.countDocuments(filter).exec();

		const services = await this.serviceModel
			.find(filter)
			.sort(sort)
			.skip((page - 1) * limit)
			.limit(limit)
			.exec();

		const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / limit);

		return {
			list: services as Service[],
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

	public async getAgentProperties(
		authMember: AuthMemberPayload | null,
		input: GetAgentPropertiesInput,
	): Promise<ServicesResult> {
		if (typeof input?.minPrice === 'number' && typeof input?.maxPrice === 'number' && input.minPrice > input.maxPrice) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		const agent = await this.memberModel.findById(input.agentId).select({ memberType: 1, memberStatus: 1 }).exec();
		if (!agent || agent.memberStatus === MemberStatus.DELETED) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}

		if (agent.memberType !== MemberType.AGENT) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		const isOwner = authMember?._id === input.agentId;
		const isAdmin = authMember?.memberType === MemberType.ADMIN;

		const filter: Record<string, unknown> = {
			memberId: input.agentId,
			serviceStatus: isOwner || isAdmin ? { $ne: ServiceStatus.DELETED } : ServiceStatus.ACTIVE,
		};

		const searchText = input?.searchText?.trim();
		if (searchText) {
			const regex = new RegExp(searchText, 'i');
			filter.$or = [{ serviceTitle: regex }, { serviceDesc: regex }, { serviceAddress: regex }];
		}

		if (input?.serviceCategory) {
			filter.serviceCategory = input.serviceCategory;
		}
		if (input?.serviceOption) {
			filter.serviceOption = input.serviceOption;
		}
		if (input?.serviceArea) {
			filter.serviceArea = input.serviceArea;
		}

		if (typeof input?.minPrice === 'number' || typeof input?.maxPrice === 'number') {
			filter.servicePrice = {};
			if (typeof input?.minPrice === 'number') {
				(filter.servicePrice as { $gte?: number }).$gte = input.minPrice;
			}
			if (typeof input?.maxPrice === 'number') {
				(filter.servicePrice as { $lte?: number }).$lte = input.maxPrice;
			}
		}

		const page = input?.page && input.page > 0 ? input.page : 1;
		const limit = input?.limit && input.limit > 0 ? Math.min(input.limit, 100) : 20;
		const sort = this.getServiceSort(input?.sortBy);
		const totalCount = await this.serviceModel.countDocuments(filter).exec();

		const services = await this.serviceModel
			.find(filter)
			.sort(sort)
			.skip((page - 1) * limit)
			.limit(limit)
			.exec();

		const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / limit);

		return {
			list: services as Service[],
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

	private getServiceSort(sortBy?: ServiceSort): Record<string, 1 | -1> {
		switch (sortBy) {
			case ServiceSort.OLDER:
				return { createdAt: 1 };
			case ServiceSort.LOWEST_PRICE:
				return { servicePrice: 1, createdAt: -1 };
			case ServiceSort.HIGHEST_PRICE:
				return { servicePrice: -1, createdAt: -1 };
			case ServiceSort.LIKES:
				return { serviceLikes: -1, createdAt: -1 };
			case ServiceSort.VIEWS:
				return { serviceViews: -1, createdAt: -1 };
			case ServiceSort.RECENT:
			default:
				return { createdAt: -1 };
		}
	}
}
