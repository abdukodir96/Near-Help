import { Field, Int, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { NotificationGroup, NotificationStatus, NotificationType } from '../../enums/notification.enum';
import { PaginationMeta } from '../member/member';

@ObjectType()
export class Notification {
	@Field(() => String)
	_id!: mongoose.ObjectId;

	@Field(() => NotificationType)
	notificationType!: NotificationType;

	@Field(() => NotificationStatus)
	notificationStatus!: NotificationStatus;

	@Field(() => NotificationGroup)
	notificationGroup!: NotificationGroup;

	@Field(() => String)
	notificationTitle!: string;

	@Field(() => String, { nullable: true })
	notificationDesc?: string;

	@Field(() => String)
	authorId!: string;

	@Field(() => String)
	receiverId!: string;

	@Field(() => String, { nullable: true })
	threadId?: string;

	@Field(() => String, { nullable: true })
	bookingId?: string;

	@Field(() => String, { nullable: true })
	serviceId?: string;

	@Field(() => String, { nullable: true })
	articleId?: string;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;
}

@ObjectType()
export class NotificationsResult {
	@Field(() => [Notification])
	list!: Notification[];

	@Field(() => PaginationMeta)
	meta!: PaginationMeta;
}

@ObjectType()
export class NotificationMarkedResult {
	@Field(() => Int)
	markedCount!: number;
}
