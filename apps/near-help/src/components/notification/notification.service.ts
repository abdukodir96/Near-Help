import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationsResult } from '../../libs/dto/notification/notification';
import { NotificationsInquiry } from '../../libs/dto/notification/notification.input';
import { Message as CommonMessage } from '../../libs/enums/common.enum';
import { BookingStatus } from '../../libs/enums/booking-status.enum';
import { NotificationGroup, NotificationStatus, NotificationType } from '../../libs/enums/notification.enum';
import { SocketGateway } from '../socket/socket.gateway';

type CreateMessageNotificationInput = {
	authorId: string;
	receiverId: string;
	threadId: string;
	serviceId?: string;
	messageText: string;
};

type CreateBookingNotificationInput = {
	authorId: string;
	receiverId: string;
	bookingId: string;
	serviceId: string;
	bookingStatus: BookingStatus;
	serviceTitleSnapshot: string;
};

type NotificationsAggregateResult = {
	list: Notification[];
	metaCounter: Array<{ total: number }>;
};

@Injectable()
export class NotificationService {
	constructor(
		@InjectModel('Notification') private readonly notificationModel: Model<Notification>,
		@Inject(forwardRef(() => SocketGateway)) private readonly socketGateway: SocketGateway,
	) {}

	public async getNotifications(receiverId: string, input?: NotificationsInquiry): Promise<NotificationsResult> {
		const page = input?.page && input.page > 0 ? input.page : 1;
		const limit = input?.limit && input.limit > 0 ? Math.min(input.limit, 100) : 20;

		const filter: Record<string, unknown> = { receiverId: new Types.ObjectId(receiverId) };
		if (input?.notificationStatus) {
			filter.notificationStatus = input.notificationStatus;
		}
		if (input?.notificationType) {
			filter.notificationType = input.notificationType;
		}
		if (input?.notificationGroup) {
			filter.notificationGroup = input.notificationGroup;
		}

		const data = await this.notificationModel
			.aggregate<NotificationsAggregateResult>([
				{ $match: filter },
				{ $sort: { createdAt: -1 } },
				{
					$facet: {
						list: [{ $skip: (page - 1) * limit }, { $limit: limit }],
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

	public async markNotificationAsRead(receiverId: string, notificationId: string): Promise<Notification> {
		const notification = await this.notificationModel.findOne({ _id: notificationId, receiverId }).exec();
		if (!notification) {
			throw new NotFoundException(CommonMessage.NO_DATA_FOUND);
		}

		if (notification.notificationStatus === NotificationStatus.READ) {
			return notification as Notification;
		}

		const updatedNotification = await this.notificationModel
			.findByIdAndUpdate(
				notificationId,
				{
					$set: {
						notificationStatus: NotificationStatus.READ,
					},
				},
				{ new: true, runValidators: true },
			)
			.exec();

		if (!updatedNotification) {
			throw new NotFoundException(CommonMessage.NO_DATA_FOUND);
		}

		this.socketGateway.emitToUser(receiverId, 'notify:read', {
			notificationId,
			receiverId,
			markedCount: 1,
		});

		return updatedNotification as Notification;
	}

	public async markAllNotificationsAsRead(receiverId: string): Promise<number> {
		const updateResult = await this.notificationModel
			.updateMany(
				{
					receiverId,
					notificationStatus: NotificationStatus.WAIT,
				},
				{
					$set: {
						notificationStatus: NotificationStatus.READ,
					},
				},
			)
			.exec();

		const markedCount = updateResult.modifiedCount ?? 0;
		if (markedCount > 0) {
			this.socketGateway.emitToUser(receiverId, 'notify:read', {
				receiverId,
				markedCount,
				all: true,
			});
		}

		return markedCount;
	}

	public async getUnreadNotificationCount(receiverId: string): Promise<number> {
		return this.notificationModel.countDocuments({ receiverId, notificationStatus: NotificationStatus.WAIT }).exec();
	}

	public async createMessageNotification(input: CreateMessageNotificationInput): Promise<Notification> {
		const notificationDesc = this.normalizeNotificationDesc(input.messageText);

		const createdNotification = await this.notificationModel.create({
			notificationType: NotificationType.MESSAGE,
			notificationStatus: NotificationStatus.WAIT,
			notificationGroup: NotificationGroup.MESSAGE,
			notificationTitle: 'New message',
			notificationDesc,
			authorId: input.authorId,
			receiverId: input.receiverId,
			threadId: input.threadId,
			serviceId: input.serviceId,
		});

		this.socketGateway.emitToUser(input.receiverId, 'notify:new', {
			notificationId: String(createdNotification._id),
			notificationType: createdNotification.notificationType,
			notificationStatus: createdNotification.notificationStatus,
			notificationGroup: createdNotification.notificationGroup,
			notificationTitle: createdNotification.notificationTitle,
			notificationDesc: createdNotification.notificationDesc,
			threadId: input.threadId,
			serviceId: input.serviceId,
			authorId: input.authorId,
			receiverId: input.receiverId,
			createdAt: createdNotification.createdAt,
		});

		return createdNotification as Notification;
	}

	public async createBookingNotification(input: CreateBookingNotificationInput): Promise<Notification> {
		const { notificationTitle, notificationDesc } = this.getBookingNotificationContent(
			input.bookingStatus,
			input.serviceTitleSnapshot,
		);

		const createdNotification = await this.notificationModel.create({
			notificationType: NotificationType.BOOKING,
			notificationStatus: NotificationStatus.WAIT,
			notificationGroup: NotificationGroup.BOOKING,
			notificationTitle,
			notificationDesc,
			authorId: input.authorId,
			receiverId: input.receiverId,
			bookingId: input.bookingId,
			serviceId: input.serviceId,
		});

		this.socketGateway.emitToUser(input.receiverId, 'notify:new', {
			notificationId: String(createdNotification._id),
			notificationType: createdNotification.notificationType,
			notificationStatus: createdNotification.notificationStatus,
			notificationGroup: createdNotification.notificationGroup,
			notificationTitle: createdNotification.notificationTitle,
			notificationDesc: createdNotification.notificationDesc,
			bookingId: input.bookingId,
			serviceId: input.serviceId,
			authorId: input.authorId,
			receiverId: input.receiverId,
			createdAt: createdNotification.createdAt,
		});

		return createdNotification as Notification;
	}

	public async markMessageNotificationsAsRead(receiverId: string, threadId: string): Promise<number> {
		const updateResult = await this.notificationModel
			.updateMany(
				{
					receiverId,
					threadId,
					notificationType: NotificationType.MESSAGE,
					notificationStatus: NotificationStatus.WAIT,
				},
				{
					$set: {
						notificationStatus: NotificationStatus.READ,
					},
				},
			)
			.exec();

		const markedCount = updateResult.modifiedCount ?? 0;
		if (markedCount > 0) {
			this.socketGateway.emitToUser(receiverId, 'notify:read', {
				threadId,
				receiverId,
				markedCount,
			});
		}

		return markedCount;
	}

	private normalizeNotificationDesc(messageText: string): string {
		const normalized = messageText.trim().replace(/\s+/g, ' ');
		if (normalized.length <= 120) return normalized;
		return `${normalized.slice(0, 117)}...`;
	}

	private getBookingNotificationContent(
		bookingStatus: BookingStatus,
		serviceTitleSnapshot: string,
	): { notificationTitle: string; notificationDesc: string } {
		switch (bookingStatus) {
			case BookingStatus.CONFIRMED:
				return {
					notificationTitle: 'Booking confirmed',
					notificationDesc: `Your booking for "${serviceTitleSnapshot}" has been confirmed.`,
				};
			case BookingStatus.IN_PROGRESS:
				return {
					notificationTitle: 'Booking in progress',
					notificationDesc: `Your booking for "${serviceTitleSnapshot}" is now in progress.`,
				};
			case BookingStatus.COMPLETED:
				return {
					notificationTitle: 'Booking completed',
					notificationDesc: `Your booking for "${serviceTitleSnapshot}" has been completed.`,
				};
			case BookingStatus.CANCELED:
				return {
					notificationTitle: 'Booking canceled',
					notificationDesc: `Your booking for "${serviceTitleSnapshot}" has been canceled.`,
				};
			default:
				return {
					notificationTitle: 'Booking updated',
					notificationDesc: `Your booking for "${serviceTitleSnapshot}" has been updated.`,
				};
		}
	}
}
