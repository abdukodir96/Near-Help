import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import ViewSchema from '../../schemas/View.model';
import MemberSchema from '../../schemas/Member.model';
import ServiceSchema from '../../schemas/Service.model';
import ArticleSchema from '../../schemas/Article.model';
import { ViewResolver } from './view.resolver';
import { ViewService } from './view.service';
import { AuthGuard } from '../../libs/guards/auth.guard';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'View', schema: ViewSchema },
			{ name: 'Member', schema: MemberSchema },
			{ name: 'Service', schema: ServiceSchema },
			{ name: 'Article', schema: ArticleSchema },
		]),
		AuthModule,
	],
	providers: [ViewResolver, ViewService, AuthGuard],
})
export class ViewModule {}
