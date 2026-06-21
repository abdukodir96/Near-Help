import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException,
	ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AiService } from '../ai.service';
import { NEARHELP_CHAT_SYSTEM_PROMPT } from './chat.prompt';
import { AiChatMessageRole, AiChatSessionStatus } from '../../../libs/enums/ai-chat.enum';
import { MemberStatus } from '../../../libs/enums/member.enum';
import { Message as CommonMessage } from '../../../libs/enums/common.enum';
import type {
	ArchiveAiChatSessionInput,
	CreateAiChatSessionInput,
	GetAiChatMessagesInput,
	GetAiChatSessionsInput,
	SendAiChatMessageInput,
} from '../../../libs/dto/ai-chat/ai-chat.input';
import type {
	AiChatMessage,
	AiChatMessagesResult,
	AiChatSendResult,
	AiChatSession,
	AiChatSessionsResult,
} from '../../../libs/dto/ai-chat/ai-chat.output';
import type { Member } from '../../../libs/dto/member/member';
import type { ChatCompletionMessage } from '../types/ai.types';
import type { AuthMemberPayload } from '../../../libs/types/auth';

const HISTORY_LIMIT = 20;

type ChatIdentity = { memberId: string; guestId?: never } | { memberId?: never; guestId: string };

type SessionsAggregateResult = {
	list: AiChatSession[];
	metaCounter: Array<{ total: number }>;
};

type MessagesAggregateResult = {
	list: AiChatMessage[];
	metaCounter: Array<{ total: number }>;
};

@Injectable()
export class AiChatService {
	constructor(
		@InjectModel('AiChatSession') private readonly sessionModel: Model<AiChatSession>,
		@InjectModel('AiChatMessage') private readonly messageModel: Model<AiChatMessage>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		private readonly aiService: AiService,
	) {}

	public async createSession(
		authMember: AuthMemberPayload | null,
		input: CreateAiChatSessionInput,
	): Promise<AiChatSession> {
		const identity = await this.resolveIdentity(authMember, input.guestId);

		const session = await this.sessionModel.create({
			sessionStatus: AiChatSessionStatus.ACTIVE,
			memberId: identity.memberId ? new Types.ObjectId(identity.memberId) : undefined,
			guestId: identity.guestId,
			title: input.title ?? null,
			messageCount: 0,
		});

		return session as AiChatSession;
	}

	public async sendMessage(
		authMember: AuthMemberPayload | null,
		input: SendAiChatMessageInput,
	): Promise<AiChatSendResult> {
		const identity = await this.resolveIdentity(authMember, input.guestId);

		const session = await this.sessionModel.findById(input.sessionId).exec();
		if (!session || session.sessionStatus !== AiChatSessionStatus.ACTIVE) {
			throw new NotFoundException(CommonMessage.NO_DATA_FOUND);
		}
		this.ensureOwnership(session, identity);

		const trimmedMessage = input.message.trim();
		if (!trimmedMessage) {
			throw new BadRequestException(CommonMessage.BAD_REQUEST);
		}

		const history = await this.messageModel
			.find({ sessionId: new Types.ObjectId(input.sessionId) })
			.sort({ createdAt: 1 })
			.limit(HISTORY_LIMIT)
			.lean()
			.exec();

		const openAiMessages: ChatCompletionMessage[] = [
			{ role: 'system', content: NEARHELP_CHAT_SYSTEM_PROMPT },
			...history.map((msg) => ({
				role: (msg.role === AiChatMessageRole.USER ? 'user' : 'assistant') as 'user' | 'assistant',
				content: msg.content as string,
			})),
			{ role: 'user', content: trimmedMessage },
		];

		let aiResponseText: string;
		try {
			aiResponseText = await this.aiService.createChatCompletion(openAiMessages);
		} catch (err: unknown) {
			const errMessage = err instanceof Error ? err.message : String(err);
			console.log('Error, AiChat.sendMessage (OpenAI):', errMessage);
			throw new ServiceUnavailableException('AI assistant is temporarily unavailable. Please try again.');
		}

		const now = new Date();
		const memberObjectId = identity.memberId ? new Types.ObjectId(identity.memberId) : undefined;
		const sessionObjectId = new Types.ObjectId(input.sessionId);

		const [userMsg, assistantMsg] = await Promise.all([
			this.messageModel.create({
				sessionId: sessionObjectId,
				memberId: memberObjectId,
				guestId: identity.guestId,
				role: AiChatMessageRole.USER,
				content: trimmedMessage,
			}),
			this.messageModel.create({
				sessionId: sessionObjectId,
				memberId: memberObjectId,
				guestId: identity.guestId,
				role: AiChatMessageRole.ASSISTANT,
				content: aiResponseText,
			}),
		]);

		const isFirstMessage = session.messageCount === 0;
		await this.sessionModel
			.updateOne(
				{ _id: sessionObjectId },
				{
					$set: {
						lastMessageAt: now,
						...(isFirstMessage && !session.title
							? { title: this.generateTitle(trimmedMessage) }
							: {}),
					},
					$inc: { messageCount: 2 },
				},
			)
			.exec();

		return {
			userMessage: userMsg as AiChatMessage,
			assistantMessage: assistantMsg as AiChatMessage,
		};
	}

	public async getSessions(memberId: string, input?: GetAiChatSessionsInput): Promise<AiChatSessionsResult> {
		await this.ensureActiveMember(memberId);

		const page = input?.page && input.page > 0 ? input.page : 1;
		const limit = input?.limit && input.limit > 0 ? Math.min(input.limit, 50) : 20;

		const data = await this.sessionModel
			.aggregate<SessionsAggregateResult>([
				{
					$match: {
						memberId: new Types.ObjectId(memberId),
						sessionStatus: AiChatSessionStatus.ACTIVE,
					},
				},
				{ $sort: { updatedAt: -1 } },
				{
					$facet: {
						list: [{ $skip: (page - 1) * limit }, { $limit: limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		return this.buildPaginatedSessionsResult(data, page, limit);
	}

	public async getMessages(
		authMember: AuthMemberPayload | null,
		input: GetAiChatMessagesInput,
	): Promise<AiChatMessagesResult> {
		const identity = await this.resolveIdentity(authMember, input.guestId);

		const session = await this.sessionModel.findById(input.sessionId).lean().exec();
		if (!session) {
			throw new NotFoundException(CommonMessage.NO_DATA_FOUND);
		}
		this.ensureOwnership(session, identity);

		const page = input.page && input.page > 0 ? input.page : 1;
		const limit = input.limit && input.limit > 0 ? Math.min(input.limit, 100) : 50;

		const data = await this.messageModel
			.aggregate<MessagesAggregateResult>([
				{ $match: { sessionId: new Types.ObjectId(input.sessionId) } },
				{ $sort: { createdAt: 1 } },
				{
					$facet: {
						list: [{ $skip: (page - 1) * limit }, { $limit: limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		return this.buildPaginatedMessagesResult(data, page, limit);
	}

	public async archiveSession(memberId: string, input: ArchiveAiChatSessionInput): Promise<AiChatSession> {
		await this.ensureActiveMember(memberId);

		const session = await this.sessionModel.findById(input.sessionId).exec();
		if (!session) {
			throw new NotFoundException(CommonMessage.NO_DATA_FOUND);
		}
		if (String(session.memberId) !== memberId) {
			throw new ForbiddenException(CommonMessage.NOT_ALLOWED_REQUEST);
		}

		session.sessionStatus = AiChatSessionStatus.ARCHIVED;
		await session.save();

		return session as AiChatSession;
	}

	private async ensureActiveMember(memberId: string): Promise<void> {
		const member = await this.memberModel
			.findById(memberId)
			.select({ memberStatus: 1 })
			.lean()
			.exec();

		if (!member || member.memberStatus === MemberStatus.DELETED) {
			throw new NotFoundException(CommonMessage.NO_DATA_FOUND);
		}
		if (member.memberStatus === MemberStatus.BLOCKED) {
			throw new ForbiddenException(CommonMessage.BLOCKED_USER);
		}
	}

	private async resolveIdentity(
		authMember: AuthMemberPayload | null,
		guestId?: string,
	): Promise<ChatIdentity> {
		if (authMember) {
			await this.ensureActiveMember(authMember._id);
			return { memberId: authMember._id };
		}

		const trimmedGuestId = guestId?.trim();
		if (!trimmedGuestId) {
			throw new BadRequestException(CommonMessage.BAD_REQUEST);
		}

		return { guestId: trimmedGuestId };
	}

	private ensureOwnership(
		session: { memberId?: unknown; guestId?: string | null },
		identity: ChatIdentity,
	): void {
		const sessionOwnerKey = session.memberId ? `m:${String(session.memberId)}` : `g:${session.guestId ?? ''}`;
		const identityKey = identity.memberId ? `m:${identity.memberId}` : `g:${identity.guestId}`;

		if (sessionOwnerKey !== identityKey) {
			throw new ForbiddenException(CommonMessage.NOT_ALLOWED_REQUEST);
		}
	}

	private generateTitle(firstMessage: string): string {
		return firstMessage.length > 60 ? firstMessage.slice(0, 57) + '...' : firstMessage;
	}

	private buildPaginatedSessionsResult(
		data: SessionsAggregateResult[],
		page: number,
		limit: number,
	): AiChatSessionsResult {
		const totalCount = data[0]?.metaCounter?.[0]?.total ?? 0;
		const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / limit);

		return {
			list: data[0]?.list ?? [],
			meta: {
				totalCount,
				page,
				limit,
				totalPages,
				hasNextPage: totalPages > 0 && page < totalPages,
				hasPrevPage: page > 1 && totalPages > 0,
			},
		};
	}

	private buildPaginatedMessagesResult(
		data: MessagesAggregateResult[],
		page: number,
		limit: number,
	): AiChatMessagesResult {
		const totalCount = data[0]?.metaCounter?.[0]?.total ?? 0;
		const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / limit);

		return {
			list: data[0]?.list ?? [],
			meta: {
				totalCount,
				page,
				limit,
				totalPages,
				hasNextPage: totalPages > 0 && page < totalPages,
				hasPrevPage: page > 1 && totalPages > 0,
			},
		};
	}
}
