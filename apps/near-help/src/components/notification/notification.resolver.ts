import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Notification, NotificationMarkedResult, NotificationsResult } from '../../libs/dto/notification/notification';
import { MarkNotificationAsReadInput, NotificationsInquiry } from '../../libs/dto/notification/notification.input';
import { AuthGuard } from '../../libs/guards/auth.guard';
import { AuthMember } from '../../libs/decorators/authMember.decorators';
import { NotificationService } from './notification.service';

@Resolver()
export class NotificationResolver {
	constructor(private readonly notificationService: NotificationService) {}

	@UseGuards(AuthGuard)
	@Query(() => NotificationsResult)
	public async getNotifications(
		@AuthMember('_id') receiverId: string,
		@Args('input', { nullable: true }) input?: NotificationsInquiry,
	): Promise<NotificationsResult> {
		console.log('Query: getNotifications');
		return this.notificationService.getNotifications(receiverId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Notification)
	public async markNotificationAsRead(
		@AuthMember('_id') receiverId: string,
		@Args('input') input: MarkNotificationAsReadInput,
	): Promise<Notification> {
		console.log('Mutation: markNotificationAsRead');
		return this.notificationService.markNotificationAsRead(receiverId, input.notificationId);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => NotificationMarkedResult)
	public async markAllNotificationsAsRead(@AuthMember('_id') receiverId: string): Promise<NotificationMarkedResult> {
		console.log('Mutation: markAllNotificationsAsRead');
		const markedCount = await this.notificationService.markAllNotificationsAsRead(receiverId);
		return { markedCount };
	}

	@UseGuards(AuthGuard)
	@Query(() => Int)
	public async getUnreadNotificationCount(@AuthMember('_id') receiverId: string): Promise<number> {
		console.log('Query: getUnreadNotificationCount');
		return this.notificationService.getUnreadNotificationCount(receiverId);
	}
}
