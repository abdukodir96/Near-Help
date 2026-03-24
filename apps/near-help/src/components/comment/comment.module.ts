import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import CommentSchema from '../../schemas/Comment.model';
import MemberSchema from '../../schemas/Member.model';
import ArticleSchema from '../../schemas/Article.model';
import ServiceSchema from '../../schemas/Service.model';
import LikeSchema from '../../schemas/Like.model';
import { CommentResolver } from './comment.resolver';
import { CommentService } from './comment.service';
import { AuthModule } from '../auth/auth.module';
import { AuthGuard } from '../../libs/guards/auth.guard';
import { RolesGuard } from '../../libs/guards/roles.guard';
import { OptionalAuthGuard } from '../../libs/guards/optional-auth.guard';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Comment', schema: CommentSchema },
			{ name: 'Member', schema: MemberSchema },
			{ name: 'Article', schema: ArticleSchema },
			{ name: 'Service', schema: ServiceSchema },
			{ name: 'Like', schema: LikeSchema },
		]),
		AuthModule,
	],
	providers: [CommentResolver, CommentService, AuthGuard, RolesGuard, OptionalAuthGuard],
	exports: [CommentService],
})
export class CommentModule {}
