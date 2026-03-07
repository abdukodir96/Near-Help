import { registerEnumType } from '@nestjs/graphql';

export enum MemberRole {
	USER = 'USER',
	AGENT = 'AGENT',
	ADMIN = 'ADMIN',
}
registerEnumType(MemberRole, { name: 'MemberRole' });
