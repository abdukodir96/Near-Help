import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../libs/guards/auth.guard';
import { RolesGuard } from '../../libs/guards/roles.guard';
import { Roles } from '../../libs/decorators/roles.decorators';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../../libs/decorators/authMember.decorators';
import { MessageService } from './message.service';
import {
	CreateOrGetThreadInput,
	MarkThreadAsReadInput,
	MessageThreadsInquiry,
	SendMessageInput,
	ThreadMessagesInquiry,
} from '../../libs/dto/message/message.input';
import {
	MessageThread,
	Message,
	MessageThreadsResult,
	MessagesResult,
	ThreadReadReceipt,
} from '../../libs/dto/message/message';
import type { AuthMemberPayload } from '../../libs/types/auth';

@Resolver()
export class MessageResolver {
	constructor(private readonly messageService: MessageService) {}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.USER, MemberType.ADMIN)
	@Mutation(() => MessageThread)
	public async createOrGetThread(
		@AuthMember() authMember: AuthMemberPayload,
		@Args('input') input: CreateOrGetThreadInput,
	): Promise<MessageThread> {
		console.log('Mutation: createOrGetThread');
		return this.messageService.createOrGetThread(authMember, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Message)
	public async sendMessage(
		@AuthMember() authMember: AuthMemberPayload,
		@Args('input') input: SendMessageInput,
	): Promise<Message> {
		console.log('Mutation: sendMessage');
		return this.messageService.sendMessage(authMember, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => MessageThreadsResult)
	public async getMyThreads(
		@AuthMember('_id') memberId: string,
		@Args('input', { nullable: true }) input?: MessageThreadsInquiry,
	): Promise<MessageThreadsResult> {
		console.log('Query: getMyThreads');
		return this.messageService.getMyThreads(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => MessagesResult)
	public async getThreadMessages(
		@AuthMember('_id') memberId: string,
		@Args('input') input: ThreadMessagesInquiry,
	): Promise<MessagesResult> {
		console.log('Query: getThreadMessages');
		return this.messageService.getThreadMessages(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => ThreadReadReceipt)
	public async markThreadAsRead(
		@AuthMember('_id') memberId: string,
		@Args('input') input: MarkThreadAsReadInput,
	): Promise<ThreadReadReceipt> {
		console.log('Mutation: markThreadAsRead');
		return this.messageService.markThreadAsRead(memberId, input.threadId);
	}
}
