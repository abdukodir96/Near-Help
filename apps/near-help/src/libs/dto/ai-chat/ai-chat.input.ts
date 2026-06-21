import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

@InputType()
export class CreateAiChatSessionInput {
	@IsOptional()
	@IsString()
	@Length(1, 100)
	@Field(() => String, { nullable: true })
	title?: string;

	@IsOptional()
	@IsString()
	@Length(1, 100)
	@Field(() => String, { nullable: true })
	guestId?: string;
}

@InputType()
export class SendAiChatMessageInput {
	@IsString()
	@Field(() => String)
	sessionId!: string;

	@IsString()
	@Length(1, 4000)
	@Field(() => String)
	message!: string;

	@IsOptional()
	@IsString()
	@Length(1, 100)
	@Field(() => String, { nullable: true })
	guestId?: string;
}

@InputType()
export class GetAiChatSessionsInput {
	@IsOptional()
	@IsInt()
	@Min(1)
	@Field(() => Int, { nullable: true })
	page?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(50)
	@Field(() => Int, { nullable: true })
	limit?: number;
}

@InputType()
export class GetAiChatMessagesInput {
	@IsString()
	@Field(() => String)
	sessionId!: string;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Field(() => Int, { nullable: true })
	page?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(100)
	@Field(() => Int, { nullable: true })
	limit?: number;

	@IsOptional()
	@IsString()
	@Length(1, 100)
	@Field(() => String, { nullable: true })
	guestId?: string;
}

@InputType()
export class ArchiveAiChatSessionInput {
	@IsString()
	@Field(() => String)
	sessionId!: string;
}
