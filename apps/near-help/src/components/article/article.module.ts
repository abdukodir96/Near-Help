import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import ArticleSchema from '../../schemas/Article.model';
import MemberSchema from '../../schemas/Member.model';
import { ArticleResolver } from './article.resolver';
import { ArticleService } from './article.service';
import { AuthModule } from '../auth/auth.module';
import { AuthGuard } from '../../libs/guards/auth.guard';
import { RolesGuard } from '../../libs/guards/roles.guard';
import { ViewModule } from '../view/view.module';
import { OptionalAuthGuard } from '../../libs/guards/optional-auth.guard';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Article', schema: ArticleSchema },
			{ name: 'Member', schema: MemberSchema },
		]),
		AuthModule,
		ViewModule,
	],
	providers: [ArticleResolver, ArticleService, AuthGuard, RolesGuard, OptionalAuthGuard],
	exports: [ArticleService],
})
export class ArticleModule {}
