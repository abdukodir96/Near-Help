import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from '../../libs/dto/notification/notification';
import { NotificationGroup, NotificationStatus, NotificationType } from '../../libs/enums/notification.enum';
import { SocketGateway } from '../socket/socket.gateway';

type CreateMessageNotificationInput = {
	authorId: string;
	receiverId: string;
	threadId: string;
	serviceId?: string;
	messageText: string;
};

@Injectable()
export class NotificationService {
	constructor(
		@InjectModel('Notification') private readonly notificationModel: Model<Notification>,
		@Inject(forwardRef(() => SocketGateway)) private readonly socketGateway: SocketGateway,
	) {}

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
}
