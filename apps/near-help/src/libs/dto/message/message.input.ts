import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsInt, IsMongoId, IsNotEmpty, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { MessageType } from '../../enums/message.enum';

@InputType()
export class CreateOrGetThreadInput {
	@IsNotEmpty()
	@IsMongoId()
	@Field(() => String)
	agentId!: string;

	@IsOptional()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	serviceId?: string;
}

@InputType()
export class SendMessageInput {
	@IsNotEmpty()
	@IsMongoId()
	@Field(() => String)
	threadId!: string;

	@IsOptional()
	@IsEnum(MessageType)
	@Field(() => MessageType, { nullable: true })
	messageType?: MessageType;

	@IsNotEmpty()
	@IsString()
	@Length(1, 2000)
	@Field(() => String)
	messageText!: string;
}

@InputType()
export class MessageThreadsInquiry {
	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Max(100)
	@Field(() => Int)
	limit!: number;
}

@InputType()
export class ThreadMessagesInquiry {
	@IsNotEmpty()
	@IsMongoId()
	@Field(() => String)
	threadId!: string;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Max(100)
	@Field(() => Int)
	limit!: number;
}
