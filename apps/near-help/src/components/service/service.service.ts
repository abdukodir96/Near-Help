import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateServiceInput, GetServiceInput, UpdateServiceInput } from '../../libs/dto/service/service.input';
import { Service } from '../../libs/dto/service/service';
import { Member } from '../../libs/dto/member/member';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { Message } from '../../libs/enums/common.enum';
import { ServiceStatus } from '../../libs/enums/service.enum';
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
}
