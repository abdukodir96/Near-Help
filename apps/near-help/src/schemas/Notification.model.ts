import { Schema } from 'mongoose';
import { NotificationGroup, NotificationStatus, NotificationType } from '../libs/enums/notification.enum';

const NotificationSchema = new Schema(
	{
		notificationType: {
			type: String,
			enum: NotificationType,
			required: true,
		},

		notificationStatus: {
			type: String,
			enum: NotificationStatus,
			default: NotificationStatus.WAIT,
		},

		notificationGroup: {
			type: String,
			enum: NotificationGroup,
			required: true,
		},

		notificationTitle: {
			type: String,
			required: true,
		},

		notificationDesc: {
			type: String,
		},

		authorId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		receiverId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		threadId: {
			type: Schema.Types.ObjectId,
			ref: 'MessageThread',
		},

		bookingId: {
			type: Schema.Types.ObjectId,
			ref: 'Booking',
		},

		serviceId: {
			type: Schema.Types.ObjectId,
			ref: 'Service',
		},

		articleId: {
			type: Schema.Types.ObjectId,
			ref: 'Article',
		},
	},
	{ timestamps: true, collection: 'notifications' },
);

NotificationSchema.index({ receiverId: 1, notificationStatus: 1, createdAt: -1 });
NotificationSchema.index({ threadId: 1, receiverId: 1, notificationStatus: 1 });
NotificationSchema.index({ bookingId: 1, receiverId: 1, notificationStatus: 1 });

export default NotificationSchema;
