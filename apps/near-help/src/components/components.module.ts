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

@Module({
	imports: [
		MemberModule,
		AuthModule,
		ServiceModule,
		ArticleModule,
		LikeModule,
		ViewModule,
		UploadModule,
		CommentModule,
		FollowModule,
	],
})
export class ComponentsModule {}
