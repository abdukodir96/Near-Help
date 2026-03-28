import { Field, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { NotificationGroup, NotificationStatus, NotificationType } from '../../enums/notification.enum';

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
	serviceId?: string;

	@Field(() => String, { nullable: true })
	articleId?: string;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;
}
