import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AiChatService } from './ai-chat.service';
import { AuthGuard } from '../../../libs/guards/auth.guard';
import { AuthMember } from '../../../libs/decorators/authMember.decorators';
import type { AuthMemberPayload } from '../../../libs/types/auth';
import {
	ArchiveAiChatSessionInput,
	CreateAiChatSessionInput,
	GetAiChatMessagesInput,
	GetAiChatSessionsInput,
	SendAiChatMessageInput,
} from '../../../libs/dto/ai-chat/ai-chat.input';
import {
	AiChatMessagesResult,
	AiChatSendResult,
	AiChatSession,
	AiChatSessionsResult,
} from '../../../libs/dto/ai-chat/ai-chat.output';

@UseGuards(AuthGuard)
@Resolver()
export class AiChatResolver {
	constructor(private readonly aiChatService: AiChatService) {}

	@Mutation(() => AiChatSession)
	public async createAiChatSession(
		@AuthMember() authMember: AuthMemberPayload,
		@Args('input', { nullable: true }) input?: CreateAiChatSessionInput,
	): Promise<AiChatSession> {
		console.log('Mutation: createAiChatSession');
		return this.aiChatService.createSession(authMember._id, input ?? {});
	}

	@Mutation(() => AiChatSendResult)
	public async sendAiChatMessage(
		@AuthMember() authMember: AuthMemberPayload,
		@Args('input') input: SendAiChatMessageInput,
	): Promise<AiChatSendResult> {
		console.log('Mutation: sendAiChatMessage');
		return this.aiChatService.sendMessage(authMember._id, input);
	}

	@Mutation(() => AiChatSession)
	public async archiveAiChatSession(
		@AuthMember() authMember: AuthMemberPayload,
		@Args('input') input: ArchiveAiChatSessionInput,
	): Promise<AiChatSession> {
		console.log('Mutation: archiveAiChatSession');
		return this.aiChatService.archiveSession(authMember._id, input);
	}

	@Query(() => AiChatSessionsResult)
	public async getAiChatSessions(
		@AuthMember() authMember: AuthMemberPayload,
		@Args('input', { nullable: true }) input?: GetAiChatSessionsInput,
	): Promise<AiChatSessionsResult> {
		console.log('Query: getAiChatSessions');
		return this.aiChatService.getSessions(authMember._id, input);
	}

	@Query(() => AiChatMessagesResult)
	public async getAiChatMessages(
		@AuthMember() authMember: AuthMemberPayload,
		@Args('input') input: GetAiChatMessagesInput,
	): Promise<AiChatMessagesResult> {
		console.log('Query: getAiChatMessages');
		return this.aiChatService.getMessages(authMember._id, input);
	}
}
