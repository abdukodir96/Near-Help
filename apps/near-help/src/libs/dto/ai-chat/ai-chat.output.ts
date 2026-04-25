import { Field, Int, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { AiChatMessageRole, AiChatSessionStatus } from '../../enums/ai-chat.enum';
import { PaginationMeta } from '../member/member';

@ObjectType()
export class AiChatSession {
	@Field(() => String)
	_id!: mongoose.ObjectId;

	@Field(() => AiChatSessionStatus)
	sessionStatus!: AiChatSessionStatus;

	@Field(() => String)
	memberId!: string;

	@Field(() => String, { nullable: true })
	title?: string;

	@Field(() => Date, { nullable: true })
	lastMessageAt?: Date;

	@Field(() => Int)
	messageCount!: number;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;
}

@ObjectType()
export class AiChatMessage {
	@Field(() => String)
	_id!: mongoose.ObjectId;

	@Field(() => String)
	sessionId!: string;

	@Field(() => String)
	memberId!: string;

	@Field(() => AiChatMessageRole)
	role!: AiChatMessageRole;

	@Field(() => String)
	content!: string;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;
}

@ObjectType()
export class AiChatSendResult {
	@Field(() => AiChatMessage)
	userMessage!: AiChatMessage;

	@Field(() => AiChatMessage)
	assistantMessage!: AiChatMessage;
}

@ObjectType()
export class AiChatSessionsResult {
	@Field(() => [AiChatSession])
	list!: AiChatSession[];

	@Field(() => PaginationMeta)
	meta!: PaginationMeta;
}

@ObjectType()
export class AiChatMessagesResult {
	@Field(() => [AiChatMessage])
	list!: AiChatMessage[];

	@Field(() => PaginationMeta)
	meta!: PaginationMeta;
}
