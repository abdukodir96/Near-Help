import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateOrGetThreadInput, SendMessageInput } from '../../libs/dto/message/message.input';
import { Message as MessageEntity, MessageThread } from '../../libs/dto/message/message';
import { Member } from '../../libs/dto/member/member';
import { Service } from '../../libs/dto/service/service';
import { MessageStatus, MessageThreadStatus, MessageType } from '../../libs/enums/message.enum';
import { Message as CommonMessage } from '../../libs/enums/common.enum';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { ServiceStatus } from '../../libs/enums/service.enum';
import type { AuthMemberPayload } from '../../libs/types/auth';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class MessageService {
	constructor(
		@InjectModel('MessageThread') private readonly messageThreadModel: Model<MessageThread>,
		@InjectModel('Message') private readonly messageModel: Model<MessageEntity>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		@InjectModel('Service') private readonly serviceModel: Model<Service>,
		private readonly socketGateway: SocketGateway,
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
		const thread = await this.messageThreadModel.findById(input.threadId).exec();
		if (!thread || thread.threadStatus !== MessageThreadStatus.ACTIVE) {
			throw new NotFoundException(CommonMessage.NO_DATA_FOUND);
		}

		const senderId = authMember._id;
		const isCustomer = String(thread.customerId) === senderId;
		const isAgent = String(thread.agentId) === senderId;
		if (!isCustomer && !isAgent) {
			throw new ForbiddenException(CommonMessage.NOT_ALLOWED_REQUEST);
		}

		const receiverId = isCustomer ? String(thread.agentId) : String(thread.customerId);
		await this.ensureAccessibleMember(receiverId);

		const normalizedText = input.messageText.trim();
		if (!normalizedText) {
			throw new BadRequestException(CommonMessage.BAD_REQUEST);
		}

		const messageType = input.messageType ?? MessageType.TEXT;

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

			const updatePayload: Record<string, unknown> = {
				lastMessageText: normalizedText,
				lastMessageType: messageType,
				lastMessageSenderId: senderId,
				lastMessageAt: new Date(),
			};

			if (isCustomer) {
				updatePayload.agentUnreadCount = (thread.agentUnreadCount ?? 0) + 1;
			} else {
				updatePayload.customerUnreadCount = (thread.customerUnreadCount ?? 0) + 1;
			}

			await this.messageThreadModel.updateOne({ _id: thread._id }, { $set: updatePayload }).exec();

			const emittedPayload = {
				threadId: String(thread._id),
				messageId: String(createdMessage._id),
				senderId,
				receiverId,
				messageType,
				messageText: normalizedText,
				createdAt: createdMessage.createdAt,
			};
			this.socketGateway.emitToUser(receiverId, 'message:new', emittedPayload);
			this.socketGateway.emitToUser(senderId, 'message:new', emittedPayload);
			this.socketGateway.emitToRoom(`thread:${String(thread._id)}`, 'message:new', emittedPayload);

			return createdMessage as MessageEntity;
		} catch (err: unknown) {
			const errMessage = err instanceof Error ? err.message : String(err);
			console.log('Error, Message.sendMessage:', errMessage);
			throw new BadRequestException(CommonMessage.CREATE_FAILED);
		}
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
}
