import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import ArticleSchema from '../../schemas/Article.model';
import MemberSchema from '../../schemas/Member.model';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Article', schema: ArticleSchema },
			{ name: 'Member', schema: MemberSchema },
		]),
	],
})
export class ArticleModule {}
