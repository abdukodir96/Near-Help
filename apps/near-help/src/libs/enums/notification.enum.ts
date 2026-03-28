import { registerEnumType } from '@nestjs/graphql';

export enum NotificationType {
	LIKE = 'LIKE',
	COMMENT = 'COMMENT',
	BOOKING = 'BOOKING',
	FOLLOW = 'FOLLOW',
	MESSAGE = 'MESSAGE',
}
registerEnumType(NotificationType, { name: 'NotificationType' });

export enum NotificationStatus {
	WAIT = 'WAIT',
	READ = 'READ',
}
registerEnumType(NotificationStatus, { name: 'NotificationStatus' });

export enum NotificationGroup {
	MEMBER = 'MEMBER',
	ARTICLE = 'ARTICLE',
	SERVICE = 'SERVICE',
	BOOKING = 'BOOKING',
	PAYMENT = 'PAYMENT',
	MESSAGE = 'MESSAGE',
}
registerEnumType(NotificationGroup, { name: 'NotificationGroup' });
