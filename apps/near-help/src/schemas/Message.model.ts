import { Schema } from 'mongoose';
import { MessageStatus, MessageType } from '../libs/enums/message.enum';

const MessageSchema = new Schema(
	{
		messageStatus: {
			type: String,
			enum: MessageStatus,
			default: MessageStatus.ACTIVE,
		},

		messageType: {
			type: String,
			enum: MessageType,
			default: MessageType.TEXT,
		},

		threadId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'MessageThread',
		},

		senderId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		receiverId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		messageText: {
			type: String,
			required: true,
			trim: true,
		},

		isRead: {
			type: Boolean,
			default: false,
		},

		readAt: {
			type: Date,
		},

		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'messages' },
);

MessageSchema.index({ threadId: 1, createdAt: 1 });
MessageSchema.index({ receiverId: 1, isRead: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });

export default MessageSchema;
