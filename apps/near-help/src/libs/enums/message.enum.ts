import { registerEnumType } from '@nestjs/graphql';

export enum MessageType {
	TEXT = 'TEXT',
	IMAGE = 'IMAGE',
	FILE = 'FILE',
	SYSTEM = 'SYSTEM',
}
registerEnumType(MessageType, { name: 'MessageType' });

export enum MessageStatus {
	ACTIVE = 'ACTIVE',
	DELETED = 'DELETED',
}
registerEnumType(MessageStatus, { name: 'MessageStatus' });

export enum MessageThreadStatus {
	ACTIVE = 'ACTIVE',
	ARCHIVED = 'ARCHIVED',
}
registerEnumType(MessageThreadStatus, { name: 'MessageThreadStatus' });
