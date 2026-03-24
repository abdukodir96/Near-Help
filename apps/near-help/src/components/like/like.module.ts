import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import LikeSchema from '../../schemas/Like.model';
import MemberSchema from '../../schemas/Member.model';
import ServiceSchema from '../../schemas/Service.model';
import ArticleSchema from '../../schemas/Article.model';
import CommentSchema from '../../schemas/Comment.model';
import { LikeResolver } from './like.resolver';
import { LikeService } from './like.service';
import { AuthModule } from '../auth/auth.module';
import { AuthGuard } from '../../libs/guards/auth.guard';
import { RolesGuard } from '../../libs/guards/roles.guard';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Like', schema: LikeSchema },
			{ name: 'Member', schema: MemberSchema },
			{ name: 'Service', schema: ServiceSchema },
			{ name: 'Article', schema: ArticleSchema },
			{ name: 'Comment', schema: CommentSchema },
		]),
		AuthModule,
	],
	providers: [LikeResolver, LikeService, AuthGuard, RolesGuard],
	exports: [LikeService],
})
export class LikeModule {}
