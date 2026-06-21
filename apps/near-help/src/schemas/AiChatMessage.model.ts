import { Schema } from 'mongoose';
import { AiChatMessageRole } from '../libs/enums/ai-chat.enum';

const AiChatMessageSchema = new Schema(
	{
		sessionId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'AiChatSession',
		},

		memberId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
		},

		guestId: {
			type: String,
			trim: true,
		},

		role: {
			type: String,
			enum: AiChatMessageRole,
			required: true,
		},

		content: {
			type: String,
			required: true,
			trim: true,
		},
	},
	{ timestamps: true, collection: 'aiChatMessages' },
);

AiChatMessageSchema.index({ sessionId: 1, createdAt: 1 });
AiChatMessageSchema.index({ memberId: 1, createdAt: -1 });

export default AiChatMessageSchema;
