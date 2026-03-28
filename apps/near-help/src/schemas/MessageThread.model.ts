import { Schema } from 'mongoose';
import { MessageThreadStatus, MessageType } from '../libs/enums/message.enum';

const MessageThreadSchema = new Schema(
	{
		threadStatus: {
			type: String,
			enum: MessageThreadStatus,
			default: MessageThreadStatus.ACTIVE,
		},

		threadKey: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},

		customerId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		agentId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		serviceId: {
			type: Schema.Types.ObjectId,
			ref: 'Service',
		},

		serviceTitleSnapshot: {
			type: String,
			trim: true,
		},

		lastMessageText: {
			type: String,
			trim: true,
		},

		lastMessageType: {
			type: String,
			enum: MessageType,
			default: MessageType.TEXT,
		},

		lastMessageSenderId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
		},

		lastMessageAt: {
			type: Date,
		},

		customerUnreadCount: {
			type: Number,
			default: 0,
			min: 0,
		},

		agentUnreadCount: {
			type: Number,
			default: 0,
			min: 0,
		},
	},
	{ timestamps: true, collection: 'messageThreads' },
);

MessageThreadSchema.index({ customerId: 1, updatedAt: -1 });
MessageThreadSchema.index({ agentId: 1, updatedAt: -1 });
MessageThreadSchema.index({ serviceId: 1, updatedAt: -1 });
MessageThreadSchema.index({ lastMessageAt: -1 });

export default MessageThreadSchema;
