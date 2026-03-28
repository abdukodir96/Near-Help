import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingsResult } from '../../libs/dto/booking/booking';
import {
	BookingsInquiry,
	CreateBookingInput,
	GetAgentBookingsInput,
	UpdateBookingStatusInput,
} from '../../libs/dto/booking/booking.input';
import { Member } from '../../libs/dto/member/member';
import { Service } from '../../libs/dto/service/service';
import { BookingStatus } from '../../libs/enums/booking-status.enum';
import { Message } from '../../libs/enums/common.enum';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { ServiceStatus } from '../../libs/enums/service.enum';
import { AuthMemberPayload } from '../../libs/types/auth';
import { MailService } from '../mail/mail.service';
import { NotificationService } from '../notification/notification.service';

type BookingsAggregateResult = {
	list: Booking[];
	metaCounter: Array<{ total: number }>;
};

type BookingMailRecipient = {
	memberEmail?: string;
	memberFullName?: string;
	memberNick: string;
};

const BOOKING_STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
	[BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELED],
	[BookingStatus.CONFIRMED]: [BookingStatus.IN_PROGRESS, BookingStatus.CANCELED],
	[BookingStatus.IN_PROGRESS]: [BookingStatus.COMPLETED, BookingStatus.CANCELED],
	[BookingStatus.COMPLETED]: [],
	[BookingStatus.CANCELED]: [],
};

@Injectable()
export class BookingService {
	constructor(
		@InjectModel('Booking') private readonly bookingModel: Model<Booking>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		@InjectModel('Service') private readonly serviceModel: Model<Service>,
		private readonly mailService: MailService,
		private readonly notificationService: NotificationService,
	) {}

	public async createBooking(customerId: string, input: CreateBookingInput): Promise<Booking> {
		await this.ensureAccessibleMember(customerId);

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

		const agent = await this.ensureAccessibleMember(agentId);
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

			const customerMailRecipient = await this.getBookingMailRecipient(customerId);
			this.dispatchBookingCreatedEmail({
				to: customerMailRecipient.memberEmail,
				recipientName: customerMailRecipient.memberFullName ?? customerMailRecipient.memberNick,
				serviceTitle: createdBooking.serviceTitleSnapshot,
				bookingDate: createdBooking.bookingDate,
				bookingTime: createdBooking.bookingTime,
				bookingAddress: createdBooking.bookingAddress,
				bookingNote: createdBooking.bookingNote,
			});

			return createdBooking as Booking;
		} catch (err: unknown) {
			const errMessage = err instanceof Error ? err.message : String(err);
			console.log('Error, Booking.createBooking:', errMessage);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getMyBookings(customerId: string, input?: BookingsInquiry): Promise<BookingsResult> {
		await this.ensureAccessibleMember(customerId);
		return this.getBookingsByFilter({ customerId }, input);
	}

	public async getAgentBookings(authMember: AuthMemberPayload, input?: GetAgentBookingsInput): Promise<BookingsResult> {
		const targetAgentId =
			authMember.memberType === MemberType.ADMIN ? (input?.targetAgentId ?? authMember._id) : authMember._id;

		const agent = await this.ensureAccessibleMember(targetAgentId);
		if (![MemberType.AGENT, MemberType.ADMIN].includes(agent.memberType)) {
			throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
		}

		return this.getBookingsByFilter({ agentId: targetAgentId }, input);
	}

	public async updateBookingStatus(authMember: AuthMemberPayload, input: UpdateBookingStatusInput): Promise<Booking> {
		const booking = await this.bookingModel.findById(input.bookingId).exec();
		if (!booking) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}

		const isAdmin = authMember.memberType === MemberType.ADMIN;
		const isAgentOwner = String(booking.agentId) === authMember._id;
		if (!isAdmin && !isAgentOwner) {
			throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
		}

		if (booking.bookingStatus === input.bookingStatus) {
			return booking as Booking;
		}

		const allowedNextStatuses = BOOKING_STATUS_TRANSITIONS[booking.bookingStatus] ?? [];
		if (!allowedNextStatuses.includes(input.bookingStatus)) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		if (input.bookingStatus === BookingStatus.CANCELED && !input.canceledReason?.trim()) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		const updatePayload: Record<string, unknown> = {
			bookingStatus: input.bookingStatus,
		};

		if (typeof input.quotedPrice === 'number') {
			updatePayload.quotedPrice = input.quotedPrice;
		}

		if (typeof input.finalPrice === 'number') {
			updatePayload.finalPrice = input.finalPrice;
		}

		if (input.bookingStatus === BookingStatus.CANCELED) {
			updatePayload.canceledReason = input.canceledReason?.trim();
			updatePayload.completedAt = null;
		}

		if (input.bookingStatus === BookingStatus.COMPLETED) {
			updatePayload.completedAt = new Date();
		}

		if (input.bookingStatus !== BookingStatus.CANCELED && typeof input.canceledReason === 'undefined') {
			updatePayload.canceledReason = null;
		}

		try {
			const updatedBooking = await this.bookingModel
				.findByIdAndUpdate(input.bookingId, { $set: updatePayload }, { new: true, runValidators: true })
				.exec();

			if (!updatedBooking) {
				throw new NotFoundException(Message.NO_DATA_FOUND);
			}

			await this.createBookingNotificationSafely({
				authorId: authMember._id,
				receiverId: String(updatedBooking.customerId),
				bookingId: String(updatedBooking._id),
				serviceId: String(updatedBooking.serviceId),
				bookingStatus: updatedBooking.bookingStatus,
				serviceTitleSnapshot: updatedBooking.serviceTitleSnapshot,
			});

			const customerMailRecipient = await this.getBookingMailRecipient(String(updatedBooking.customerId));
			this.dispatchBookingStatusEmail({
				to: customerMailRecipient.memberEmail,
				recipientName: customerMailRecipient.memberFullName ?? customerMailRecipient.memberNick,
				serviceTitle: updatedBooking.serviceTitleSnapshot,
				bookingStatus: updatedBooking.bookingStatus,
				bookingDate: updatedBooking.bookingDate,
				bookingTime: updatedBooking.bookingTime,
				bookingAddress: updatedBooking.bookingAddress,
				canceledReason: updatedBooking.canceledReason,
				quotedPrice: updatedBooking.quotedPrice,
				finalPrice: updatedBooking.finalPrice,
			});

			return updatedBooking as Booking;
		} catch (err: unknown) {
			const errMessage = err instanceof Error ? err.message : String(err);
			console.log('Error, Booking.updateBookingStatus:', errMessage);
			throw new BadRequestException(Message.UPDATE_FAILED);
		}
	}

	private async getBookingsByFilter(
		baseFilter: { customerId?: string; agentId?: string },
		input?: BookingsInquiry,
	): Promise<BookingsResult> {
		const filter: Record<string, unknown> = { ...baseFilter };
		if (input?.bookingStatus) {
			filter.bookingStatus = input.bookingStatus;
		}

		const page = input?.page && input.page > 0 ? input.page : 1;
		const limit = input?.limit && input.limit > 0 ? Math.min(input.limit, 100) : 20;

		const data = await this.bookingModel
			.aggregate<BookingsAggregateResult>([
				{ $match: filter },
				{ $sort: { createdAt: -1 } },
				{
					$facet: {
						list: [
							{ $skip: (page - 1) * limit },
							{ $limit: limit },
							{
								$lookup: {
									from: 'members',
									localField: 'customerId',
									foreignField: '_id',
									as: 'customerData',
								},
							},
							{ $unwind: { path: '$customerData', preserveNullAndEmptyArrays: true } },
							{
								$lookup: {
									from: 'members',
									localField: 'agentId',
									foreignField: '_id',
									as: 'agentData',
								},
							},
							{ $unwind: { path: '$agentData', preserveNullAndEmptyArrays: true } },
							{
								$lookup: {
									from: 'services',
									localField: 'serviceId',
									foreignField: '_id',
									as: 'serviceData',
								},
							},
							{ $unwind: { path: '$serviceData', preserveNullAndEmptyArrays: true } },
							{ $project: { 'serviceData.embedding': 0 } },
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

	private async ensureAccessibleMember(memberId: string): Promise<Pick<Member, 'memberStatus' | 'memberType'>> {
		const member = await this.memberModel.findById(memberId).select({ memberStatus: 1, memberType: 1 }).lean().exec();
		if (!member || member.memberStatus === MemberStatus.DELETED) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}
		if (member.memberStatus === MemberStatus.BLOCKED) {
			throw new ForbiddenException(Message.BLOCKED_USER);
		}

		return member;
	}

	private async getBookingMailRecipient(memberId: string): Promise<BookingMailRecipient> {
		const member = await this.memberModel
			.findById(memberId)
			.select({ memberEmail: 1, memberFullName: 1, memberNick: 1 })
			.lean()
			.exec();

		if (!member) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}

		return member;
	}

	private async createBookingNotificationSafely(input: {
		authorId: string;
		receiverId: string;
		bookingId: string;
		serviceId: string;
		bookingStatus: BookingStatus;
		serviceTitleSnapshot: string;
	}): Promise<void> {
		try {
			await this.notificationService.createBookingNotification(input);
		} catch (err: unknown) {
			const errMessage = err instanceof Error ? err.message : String(err);
			console.log('Warning, Booking.createBookingNotificationSafely:', errMessage);
		}
	}

	private dispatchBookingCreatedEmail(input: {
		to?: string;
		recipientName: string;
		serviceTitle: string;
		bookingDate: string;
		bookingTime: string;
		bookingAddress: string;
		bookingNote?: string;
	}): void {
		void this.mailService.sendBookingCreatedEmail(input).catch((err: unknown) => {
			const errMessage = err instanceof Error ? err.message : String(err);
			console.log('Warning, Booking.dispatchBookingCreatedEmail:', errMessage);
		});
	}

	private dispatchBookingStatusEmail(input: {
		to?: string;
		recipientName: string;
		serviceTitle: string;
		bookingStatus: BookingStatus;
		bookingDate: string;
		bookingTime: string;
		bookingAddress: string;
		canceledReason?: string;
		quotedPrice?: number;
		finalPrice?: number;
	}): void {
		void this.mailService.sendBookingStatusEmail(input).catch((err: unknown) => {
			const errMessage = err instanceof Error ? err.message : String(err);
			console.log('Warning, Booking.dispatchBookingStatusEmail:', errMessage);
		});
	}
}
