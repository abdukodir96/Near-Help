import { registerEnumType } from '@nestjs/graphql';

export enum LikeGroup {
	MEMBER = 'MEMBER',
	SERVICE = 'SERVICE',
	ARTICLE = 'ARTICLE',
	REVIEW = 'REVIEW',
	COMMENT = 'COMMENT',
}
registerEnumType(LikeGroup, { name: 'LikeGroup' });
