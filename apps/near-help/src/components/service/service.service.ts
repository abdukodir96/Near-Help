import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateServiceInput } from '../../libs/dto/service/service.input';
import { Service } from '../../libs/dto/service/service';
import { Member } from '../../libs/dto/member/member';
import { MemberStatus } from '../../libs/enums/member.enum';
import { Message } from '../../libs/enums/common.enum';

@Injectable()
export class ServiceService {
	constructor(
		@InjectModel('Service') private readonly serviceModel: Model<Service>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
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
}
