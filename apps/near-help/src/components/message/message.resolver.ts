import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../libs/guards/auth.guard';
import { RolesGuard } from '../../libs/guards/roles.guard';
import { Roles } from '../../libs/decorators/roles.decorators';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../../libs/decorators/authMember.decorators';
import { MessageService } from './message.service';
import { CreateOrGetThreadInput, SendMessageInput } from '../../libs/dto/message/message.input';
import { MessageThread, Message } from '../../libs/dto/message/message';
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
}
