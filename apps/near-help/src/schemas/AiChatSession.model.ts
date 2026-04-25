import { Schema } from 'mongoose';
import { AiChatSessionStatus } from '../libs/enums/ai-chat.enum';

const AiChatSessionSchema = new Schema(
	{
		sessionStatus: {
			type: String,
			enum: AiChatSessionStatus,
			default: AiChatSessionStatus.ACTIVE,
		},

		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		title: {
			type: String,
			trim: true,
		},

		lastMessageAt: {
			type: Date,
		},

		messageCount: {
			type: Number,
			default: 0,
			min: 0,
		},
	},
	{ timestamps: true, collection: 'aiChatSessions' },
);

AiChatSessionSchema.index({ memberId: 1, updatedAt: -1 });
AiChatSessionSchema.index({ memberId: 1, sessionStatus: 1 });

export default AiChatSessionSchema;
