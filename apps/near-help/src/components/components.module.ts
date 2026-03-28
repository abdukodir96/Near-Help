import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { ServiceModule } from './service/service.module';
import { AuthModule } from './auth/auth.module';
import { CommentModule } from './comment/comment.module';
import { LikeModule } from './like/like.module';
import { ViewModule } from './view/view.module';
import { FollowModule } from './follow/follow.module';
import { ArticleModule } from './article/article.module';
import { UploadModule } from './upload/upload.module';
import { SocketModule } from './socket/socket.module';
import { AiModule } from './ai/ai.module';
import { BookingModule } from './booking/booking.module';
import { MessageModule } from './message/message.module';
import { NotificationModule } from './notification/notification.module';
import { MailModule } from './mail/mail.module';
import { NoticeModule } from './notice/notice.module';

@Module({
	imports: [
		MemberModule,
		AuthModule,
		ServiceModule,
		ArticleModule,
		LikeModule,
		ViewModule,
		BookingModule,
		UploadModule,
		CommentModule,
		FollowModule,
		MessageModule,
		NotificationModule,
		MailModule,
		NoticeModule,
		SocketModule,
		AiModule,
	],
})
export class ComponentsModule {}
