import {
	BadRequestException,
	ForbiddenException,
	forwardRef,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
	CreateOrGetThreadInput,
	MessageThreadsInquiry,
	SendMessageInput,
	ThreadMessagesInquiry,
} from '../../libs/dto/message/message.input';
import {
	Message as MessageEntity,
	MessagesResult,
	MessageThread,
	MessageThreadsResult,
} from '../../libs/dto/message/message';
import { Member } from '../../libs/dto/member/member';
import { Service } from '../../libs/dto/service/service';
import { Message as CommonMessage } from '../../libs/enums/common.enum';
import { MessageStatus, MessageThreadStatus, MessageType } from '../../libs/enums/message.enum';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { ServiceStatus } from '../../libs/enums/service.enum';
import type { AuthMemberPayload } from '../../libs/types/auth';
import { ThreadReadReceipt } from '../../libs/dto/message/message';
import { NotificationService } from '../notification/notification.service';
import { SocketGateway } from '../socket/socket.gateway';

type ThreadAccess = {
	thread: MessageThread;
	isCustomer: boolean;
	otherMemberId: string;
	unreadField: 'customerUnreadCount' | 'agentUnreadCount';
};

type MessageThreadsAggregateResult = {
	list: MessageThread[];
	metaCounter: Array<{ total: number }>;
};

type ThreadMessagesAggregateResult = {
	list: MessageEntity[];
	metaCounter: Array<{ total: number }>;
};

@Injectable()
export class MessageService {
	constructor(
		@InjectModel('MessageThread') private readonly messageThreadModel: Model<MessageThread>,
		@InjectModel('Message') private readonly messageModel: Model<MessageEntity>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		@InjectModel('Service') private readonly serviceModel: Model<Service>,
		@Inject(forwardRef(() => SocketGateway)) private readonly socketGateway: SocketGateway,
		@Inject(forwardRef(() => NotificationService)) private readonly notificationService: NotificationService,
	) {}

	public async createOrGetThread(authMember: AuthMemberPayload, input: CreateOrGetThreadInput): Promise<MessageThread> {
		const customerId = authMember._id;
		const customer = await this.ensureAccessibleMember(customerId);
		if (![MemberType.USER, MemberType.ADMIN].includes(customer.memberType)) {
			throw new ForbiddenException(CommonMessage.NOT_ALLOWED_REQUEST);
		}

		const agent = await this.ensureAccessibleMember(input.agentId);
		if (![MemberType.AGENT, MemberType.ADMIN].includes(agent.memberType)) {
			throw new ForbiddenException(CommonMessage.NOT_ALLOWED_REQUEST);
		}
		if (input.agentId === customerId) {
			throw new ForbiddenException(CommonMessage.NOT_ALLOWED_REQUEST);
		}

		const serviceSnapshot = await this.getValidServiceSnapshot(input.serviceId, input.agentId);
		const threadKey = this.buildThreadKey(customerId, input.agentId, input.serviceId);

		const existingThread = await this.messageThreadModel.findOne({ threadKey }).exec();
		if (existingThread) {
			return existingThread as MessageThread;
		}

		try {
			const createdThread = await this.messageThreadModel.create({
				threadStatus: MessageThreadStatus.ACTIVE,
				threadKey,
				customerId,
				agentId: input.agentId,
				serviceId: input.serviceId,
				serviceTitleSnapshot: serviceSnapshot?.serviceTitle,
			});

			return createdThread as MessageThread;
		} catch (err: unknown) {
			const mongoError = err as { code?: number };
			if (mongoError?.code === 11000) {
				const duplicatedThread = await this.messageThreadModel.findOne({ threadKey }).exec();
				if (duplicatedThread) return duplicatedThread as MessageThread;
			}

			const errMessage = err instanceof Error ? err.message : String(err);
			console.log('Error, Message.createOrGetThread:', errMessage);
			throw new BadRequestException(CommonMessage.CREATE_FAILED);
		}
	}

	public async sendMessage(authMember: AuthMemberPayload, input: SendMessageInput): Promise<MessageEntity> {
		await this.ensureAccessibleMember(authMember._id);

		const threadAccess = await this.getThreadAccess(input.threadId, authMember._id);
		const normalizedText = input.messageText.trim();
		if (!normalizedText) {
			throw new BadRequestException(CommonMessage.BAD_REQUEST);
		}

		const messageType = input.messageType ?? MessageType.TEXT;
		const senderId = authMember._id;
		const receiverId = threadAccess.otherMemberId;

		try {
			const createdMessage = await this.messageModel.create({
				messageStatus: MessageStatus.ACTIVE,
				messageType,
				threadId: input.threadId,
				senderId,
				receiverId,
				messageText: normalizedText,
				isRead: false,
			});

			const customerUnreadCount = threadAccess.isCustomer
				? (threadAccess.thread.customerUnreadCount ?? 0)
				: (threadAccess.thread.customerUnreadCount ?? 0) + 1;
			const agentUnreadCount = threadAccess.isCustomer
				? (threadAccess.thread.agentUnreadCount ?? 0) + 1
				: (threadAccess.thread.agentUnreadCount ?? 0);
			const lastMessageAt = new Date();

			await this.messageThreadModel
				.updateOne(
					{ _id: threadAccess.thread._id },
					{
						$set: {
							lastMessageText: normalizedText,
							lastMessageType: messageType,
							lastMessageSenderId: senderId,
							lastMessageAt,
							customerUnreadCount,
							agentUnreadCount,
						},
					},
				)
				.exec();

			const emittedPayload = {
				threadId: String(threadAccess.thread._id),
				messageId: String(createdMessage._id),
				senderId,
				receiverId,
				messageType,
				messageText: normalizedText,
				customerUnreadCount,
				agentUnreadCount,
				createdAt: createdMessage.createdAt,
			};

			this.socketGateway.emitToUser(receiverId, 'message:new', emittedPayload);
			this.socketGateway.emitToUser(senderId, 'message:new', emittedPayload);
			this.socketGateway.emitToRoom(this.getThreadRoom(String(threadAccess.thread._id)), 'message:new', emittedPayload);
			await this.createMessageNotificationSafely({
				authorId: senderId,
				receiverId,
				threadId: String(threadAccess.thread._id),
				serviceId: threadAccess.thread.serviceId ? String(threadAccess.thread.serviceId) : undefined,
				messageText: normalizedText,
			});

			return createdMessage as MessageEntity;
		} catch (err: unknown) {
			const errMessage = err instanceof Error ? err.message : String(err);
			console.log('Error, Message.sendMessage:', errMessage);
			throw new BadRequestException(CommonMessage.CREATE_FAILED);
		}
	}

	public async getMyThreads(memberId: string, input?: MessageThreadsInquiry): Promise<MessageThreadsResult> {
		await this.ensureAccessibleMember(memberId);

		const page = input?.page && input.page > 0 ? input.page : 1;
		const limit = input?.limit && input.limit > 0 ? Math.min(input.limit, 100) : 20;

		const data = await this.messageThreadModel
			.aggregate<MessageThreadsAggregateResult>([
				{
					$match: {
						threadStatus: MessageThreadStatus.ACTIVE,
						$or: [{ customerId: this.toObjectId(memberId) }, { agentId: this.toObjectId(memberId) }],
					},
				},
				{ $sort: { lastMessageAt: -1, updatedAt: -1 } },
				{
					$facet: {
						list: [
							{ $skip: (page - 1) * limit },
							{ $limit: limit },
							{
								$lookup: {
									from: 'members',
									localField: 'customerId',
									foreignField: '_id',
									as: 'customerData',
								},
							},
							{ $unwind: { path: '$customerData', preserveNullAndEmptyArrays: true } },
							{
								$lookup: {
									from: 'members',
									localField: 'agentId',
									foreignField: '_id',
									as: 'agentData',
								},
							},
							{ $unwind: { path: '$agentData', preserveNullAndEmptyArrays: true } },
							{
								$lookup: {
									from: 'services',
									localField: 'serviceId',
									foreignField: '_id',
									as: 'serviceData',
								},
							},
							{ $unwind: { path: '$serviceData', preserveNullAndEmptyArrays: true } },
							{ $project: { 'serviceData.embedding': 0 } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		return this.buildPaginatedThreadsResult(data, page, limit);
	}

	public async getThreadMessages(memberId: string, input: ThreadMessagesInquiry): Promise<MessagesResult> {
		await this.ensureAccessibleMember(memberId);
		await this.markThreadAsRead(memberId, input.threadId);

		const threadAccess = await this.getThreadAccess(input.threadId, memberId);
		const page = input.page > 0 ? input.page : 1;
		const limit = input.limit > 0 ? Math.min(input.limit, 100) : 50;

		const data = await this.messageModel
			.aggregate<ThreadMessagesAggregateResult>([
				{
					$match: {
						threadId: this.toObjectId(String(threadAccess.thread._id)),
						messageStatus: MessageStatus.ACTIVE,
					},
				},
				{ $sort: { createdAt: 1 } },
				{
					$facet: {
						list: [
							{ $skip: (page - 1) * limit },
							{ $limit: limit },
							{
								$lookup: {
									from: 'members',
									localField: 'senderId',
									foreignField: '_id',
									as: 'senderData',
								},
							},
							{ $unwind: { path: '$senderData', preserveNullAndEmptyArrays: true } },
							{
								$lookup: {
									from: 'members',
									localField: 'receiverId',
									foreignField: '_id',
									as: 'receiverData',
								},
							},
							{ $unwind: { path: '$receiverData', preserveNullAndEmptyArrays: true } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		return this.buildPaginatedMessagesResult(data, page, limit);
	}

	public async markThreadAsRead(memberId: string, threadId: string): Promise<ThreadReadReceipt> {
		const threadAccess = await this.getThreadAccess(threadId, memberId);
		const currentUnreadCount = threadAccess.isCustomer
			? (threadAccess.thread.customerUnreadCount ?? 0)
			: (threadAccess.thread.agentUnreadCount ?? 0);
		const readAt = new Date();

		const updateResult = await this.messageModel
			.updateMany(
				{
					threadId,
					receiverId: memberId,
					isRead: false,
					messageStatus: MessageStatus.ACTIVE,
				},
				{
					$set: {
						isRead: true,
						readAt,
					},
				},
			)
			.exec();

		const markedCount = updateResult.modifiedCount ?? 0;
		if (markedCount > 0 || currentUnreadCount > 0) {
			await this.messageThreadModel
				.updateOne(
					{ _id: threadAccess.thread._id },
					{
						$set: {
							[threadAccess.unreadField]: 0,
						},
					},
				)
				.exec();
			await this.markMessageNotificationsAsReadSafely(memberId, String(threadAccess.thread._id));

			const payload = {
				threadId: String(threadAccess.thread._id),
				memberId,
				unreadCount: 0,
				readAt: readAt.toISOString(),
				markedCount,
			};

			this.socketGateway.emitToUser(memberId, 'thread:read', payload);
			this.socketGateway.emitToUser(threadAccess.otherMemberId, 'thread:read', payload);
			this.socketGateway.emitToRoom(this.getThreadRoom(String(threadAccess.thread._id)), 'thread:read', payload);
		}

		return {
			threadId: String(threadAccess.thread._id),
			memberId,
			otherMemberId: threadAccess.otherMemberId,
			unreadCount: 0,
			readAt: readAt.toISOString(),
			markedCount,
		};
	}

	private async getThreadAccess(threadId: string, memberId: string): Promise<ThreadAccess> {
		const thread = await this.messageThreadModel.findById(threadId).exec();
		if (!thread || thread.threadStatus !== MessageThreadStatus.ACTIVE) {
			throw new NotFoundException(CommonMessage.NO_DATA_FOUND);
		}

		const isCustomer = String(thread.customerId) === memberId;
		const isAgent = String(thread.agentId) === memberId;
		if (!isCustomer && !isAgent) {
			throw new ForbiddenException(CommonMessage.NOT_ALLOWED_REQUEST);
		}

		return {
			thread: thread as MessageThread,
			isCustomer,
			otherMemberId: isCustomer ? String(thread.agentId) : String(thread.customerId),
			unreadField: isCustomer ? 'customerUnreadCount' : 'agentUnreadCount',
		};
	}

	private buildPaginatedThreadsResult(
		data: MessageThreadsAggregateResult[],
		page: number,
		limit: number,
	): MessageThreadsResult {
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
		data: ThreadMessagesAggregateResult[],
		page: number,
		limit: number,
	): MessagesResult {
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

	private async ensureAccessibleMember(memberId: string): Promise<Pick<Member, 'memberStatus' | 'memberType'>> {
		const member = await this.memberModel.findById(memberId).select({ memberStatus: 1, memberType: 1 }).lean().exec();
		if (!member || member.memberStatus === MemberStatus.DELETED) {
			throw new NotFoundException(CommonMessage.NO_DATA_FOUND);
		}
		if (member.memberStatus === MemberStatus.BLOCKED) {
			throw new ForbiddenException(CommonMessage.BLOCKED_USER);
		}

		return member;
	}

	private async getValidServiceSnapshot(
		serviceId: string | undefined,
		agentId: string,
	): Promise<Pick<Service, 'serviceTitle'> | null> {
		if (!serviceId) return null;

		const service = await this.serviceModel
			.findById(serviceId)
			.select({ memberId: 1, serviceStatus: 1, serviceTitle: 1 })
			.lean()
			.exec();

		if (!service || service.serviceStatus !== ServiceStatus.ACTIVE) {
			throw new NotFoundException(CommonMessage.NO_DATA_FOUND);
		}

		if (String(service.memberId) !== agentId) {
			throw new BadRequestException(CommonMessage.BAD_REQUEST);
		}

		return service;
	}

	private buildThreadKey(customerId: string, agentId: string, serviceId?: string): string {
		return `${customerId}:${agentId}:${serviceId ?? 'direct'}`;
	}

	private getThreadRoom(threadId: string): string {
		return `thread:${threadId}`;
	}

	private toObjectId(value: string): Types.ObjectId {
		return new Types.ObjectId(value);
	}

	private async createMessageNotificationSafely(input: {
		authorId: string;
		receiverId: string;
		threadId: string;
		serviceId?: string;
		messageText: string;
	}): Promise<void> {
		try {
			await this.notificationService.createMessageNotification(input);
		} catch (err: unknown) {
			const errMessage = err instanceof Error ? err.message : String(err);
			console.log('Warning, Message.createMessageNotificationSafely:', errMessage);
		}
	}

	private async markMessageNotificationsAsReadSafely(receiverId: string, threadId: string): Promise<void> {
		try {
			await this.notificationService.markMessageNotificationsAsRead(receiverId, threadId);
		} catch (err: unknown) {
			const errMessage = err instanceof Error ? err.message : String(err);
			console.log('Warning, Message.markMessageNotificationsAsReadSafely:', errMessage);
		}
	}
}
