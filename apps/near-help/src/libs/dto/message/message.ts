import { Field, Int, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { MessageStatus, MessageThreadStatus, MessageType } from '../../enums/message.enum';
import { PaginationMeta } from '../member/member';
import { Member } from '../member/member';
import { Service } from '../service/service';

@ObjectType()
export class MessageThread {
	@Field(() => String)
	_id!: mongoose.ObjectId;

	@Field(() => MessageThreadStatus)
	threadStatus!: MessageThreadStatus;

	@Field(() => String)
	threadKey!: string;

	@Field(() => String)
	customerId!: string;

	@Field(() => String)
	agentId!: string;

	@Field(() => String, { nullable: true })
	serviceId?: string;

	@Field(() => String, { nullable: true })
	serviceTitleSnapshot?: string;

	@Field(() => String, { nullable: true })
	lastMessageText?: string;

	@Field(() => MessageType, { nullable: true })
	lastMessageType?: MessageType;

	@Field(() => String, { nullable: true })
	lastMessageSenderId?: string;

	@Field(() => Date, { nullable: true })
	lastMessageAt?: Date;

	@Field(() => Int)
	customerUnreadCount!: number;

	@Field(() => Int)
	agentUnreadCount!: number;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;

	@Field(() => Member, { nullable: true })
	customerData?: Member;

	@Field(() => Member, { nullable: true })
	agentData?: Member;

	@Field(() => Service, { nullable: true })
	serviceData?: Service;
}

@ObjectType()
export class Message {
	@Field(() => String)
	_id!: mongoose.ObjectId;

	@Field(() => MessageStatus)
	messageStatus!: MessageStatus;

	@Field(() => MessageType)
	messageType!: MessageType;

	@Field(() => String)
	threadId!: string;

	@Field(() => String)
	senderId!: string;

	@Field(() => String)
	receiverId!: string;

	@Field(() => String)
	messageText!: string;

	@Field(() => Boolean)
	isRead!: boolean;

	@Field(() => Date, { nullable: true })
	readAt?: Date;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;

	@Field(() => Member, { nullable: true })
	senderData?: Member;

	@Field(() => Member, { nullable: true })
	receiverData?: Member;
}

@ObjectType()
export class MessageThreadsResult {
	@Field(() => [MessageThread])
	list!: MessageThread[];

	@Field(() => PaginationMeta)
	meta!: PaginationMeta;
}

@ObjectType()
export class MessagesResult {
	@Field(() => [Message])
	list!: Message[];

	@Field(() => PaginationMeta)
	meta!: PaginationMeta;
}

@ObjectType()
export class ThreadReadReceipt {
	@Field(() => String)
	threadId!: string;

	@Field(() => String)
	memberId!: string;

	@Field(() => String)
	otherMemberId!: string;

	@Field(() => Int)
	unreadCount!: number;

	@Field(() => String)
	readAt!: string;

	@Field(() => Int)
	markedCount!: number;
}
