import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking } from '../../libs/dto/booking/booking';
import { CreateBookingInput } from '../../libs/dto/booking/booking.input';
import { Member } from '../../libs/dto/member/member';
import { Service } from '../../libs/dto/service/service';
import { BookingStatus } from '../../libs/enums/booking-status.enum';
import { Message } from '../../libs/enums/common.enum';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { ServiceStatus } from '../../libs/enums/service.enum';

@Injectable()
export class BookingService {
	constructor(
		@InjectModel('Booking') private readonly bookingModel: Model<Booking>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		@InjectModel('Service') private readonly serviceModel: Model<Service>,
	) {}

	public async createBooking(customerId: string, input: CreateBookingInput): Promise<Booking> {
		const customer = await this.memberModel
			.findById(customerId)
			.select({ memberStatus: 1, memberType: 1 })
			.lean()
			.exec();
		if (!customer || customer.memberStatus === MemberStatus.DELETED) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}
		if (customer.memberStatus === MemberStatus.BLOCKED) {
			throw new ForbiddenException(Message.BLOCKED_USER);
		}

		const service = await this.serviceModel
			.findById(input.serviceId)
			.select({
				memberId: 1,
				serviceStatus: 1,
				serviceCategory: 1,
				serviceOption: 1,
				serviceTitle: 1,
				serviceArea: 1,
			})
			.lean()
			.exec();
		if (!service || service.serviceStatus === ServiceStatus.DELETED) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}
		if (service.serviceStatus !== ServiceStatus.ACTIVE) {
			throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
		}

		const agentId = String(service.memberId);
		if (agentId === customerId) {
			throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
		}

		const agent = await this.memberModel.findById(agentId).select({ memberStatus: 1, memberType: 1 }).lean().exec();
		if (!agent || agent.memberStatus === MemberStatus.DELETED) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}
		if (agent.memberStatus === MemberStatus.BLOCKED) {
			throw new ForbiddenException(Message.BLOCKED_USER);
		}
		if (![MemberType.AGENT, MemberType.ADMIN].includes(agent.memberType)) {
			throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
		}

		try {
			const createdBooking = await this.bookingModel.create({
				customerId,
				agentId,
				serviceId: input.serviceId,
				bookingStatus: BookingStatus.PENDING,
				serviceCategory: service.serviceCategory,
				serviceOption: input.serviceOption ?? service.serviceOption,
				serviceTitleSnapshot: service.serviceTitle,
				bookingDate: input.bookingDate,
				bookingTime: input.bookingTime,
				bookingAddress: input.bookingAddress,
				bookingArea: input.bookingArea ?? service.serviceArea,
				bookingNote: input.bookingNote,
			});

			return createdBooking as Booking;
		} catch (err: unknown) {
			const errMessage = err instanceof Error ? err.message : String(err);
			console.log('Error, Booking.createBooking:', errMessage);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}
}
