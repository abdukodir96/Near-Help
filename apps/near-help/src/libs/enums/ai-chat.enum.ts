import { registerEnumType } from '@nestjs/graphql';

export enum AiChatSessionStatus {
	ACTIVE = 'ACTIVE',
	ARCHIVED = 'ARCHIVED',
}
registerEnumType(AiChatSessionStatus, { name: 'AiChatSessionStatus' });

export enum AiChatMessageRole {
	USER = 'USER',
	ASSISTANT = 'ASSISTANT',
}
registerEnumType(AiChatMessageRole, { name: 'AiChatMessageRole' });
