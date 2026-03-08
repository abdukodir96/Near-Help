import { registerEnumType } from '@nestjs/graphql';

export enum CommentStatus {
	ACTIVE = 'ACTIVE',
	DELETED = 'DELETED',
}
registerEnumType(CommentStatus, { name: 'CommentStatus' });

export enum CommentGroup {
	MEMBER = 'MEMBER',
	ARTICLE = 'ARTICLE',
	SERVICE = 'SERVICE',
	REVIEW = 'REVIEW',
}
registerEnumType(CommentGroup, { name: 'CommentGroup' });
