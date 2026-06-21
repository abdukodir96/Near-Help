import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AiChatService } from './ai-chat.service';
import { AuthGuard } from '../../../libs/guards/auth.guard';
import { OptionalAuthGuard } from '../../../libs/guards/optional-auth.guard';
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

@Resolver()
export class AiChatResolver {
	constructor(private readonly aiChatService: AiChatService) {}

	@UseGuards(OptionalAuthGuard)
	@Mutation(() => AiChatSession)
	public async createAiChatSession(
		@AuthMember() authMember: AuthMemberPayload | null,
		@Args('input', { nullable: true }) input?: CreateAiChatSessionInput,
	): Promise<AiChatSession> {
		console.log('Mutation: createAiChatSession');
		return this.aiChatService.createSession(authMember, input ?? {});
	}

	@UseGuards(OptionalAuthGuard)
	@Mutation(() => AiChatSendResult)
	public async sendAiChatMessage(
		@AuthMember() authMember: AuthMemberPayload | null,
		@Args('input') input: SendAiChatMessageInput,
	): Promise<AiChatSendResult> {
		console.log('Mutation: sendAiChatMessage');
		return this.aiChatService.sendMessage(authMember, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => AiChatSession)
	public async archiveAiChatSession(
		@AuthMember() authMember: AuthMemberPayload,
		@Args('input') input: ArchiveAiChatSessionInput,
	): Promise<AiChatSession> {
		console.log('Mutation: archiveAiChatSession');
		return this.aiChatService.archiveSession(authMember._id, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => AiChatSessionsResult)
	public async getAiChatSessions(
		@AuthMember() authMember: AuthMemberPayload,
		@Args('input', { nullable: true }) input?: GetAiChatSessionsInput,
	): Promise<AiChatSessionsResult> {
		console.log('Query: getAiChatSessions');
		return this.aiChatService.getSessions(authMember._id, input);
	}

	@UseGuards(OptionalAuthGuard)
	@Query(() => AiChatMessagesResult)
	public async getAiChatMessages(
		@AuthMember() authMember: AuthMemberPayload | null,
		@Args('input') input: GetAiChatMessagesInput,
	): Promise<AiChatMessagesResult> {
		console.log('Query: getAiChatMessages');
		return this.aiChatService.getMessages(authMember, input);
	}
}
