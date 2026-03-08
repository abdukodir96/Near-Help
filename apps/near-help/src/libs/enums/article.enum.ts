import { registerEnumType } from '@nestjs/graphql';

export enum ArticleCategory {
	FREE = 'FREE',
	RECOMMEND = 'RECOMMEND',
	NEWS = 'NEWS',
	HUMOR = 'HUMOR',
}
registerEnumType(ArticleCategory, { name: 'ArticleCategory' });

export enum ArticleStatus {
	ACTIVE = 'ACTIVE',
	DELETED = 'DELETED',
}
registerEnumType(ArticleStatus, { name: 'ArticleStatus' });
