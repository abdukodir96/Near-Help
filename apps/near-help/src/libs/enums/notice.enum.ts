import { registerEnumType } from '@nestjs/graphql';

export enum NoticeCategory {
	NOTICE = 'NOTICE',
	FAQ = 'FAQ',
}
registerEnumType(NoticeCategory, { name: 'NoticeCategory' });

export enum NoticeStatus {
	HOLD = 'HOLD',
	ACTIVE = 'ACTIVE',
	DELETED = 'DELETED',
}
registerEnumType(NoticeStatus, { name: 'NoticeStatus' });
