import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import FollowSchema from '../../schemas/Follow.model';
import MemberSchema from '../../schemas/Member.model';
import LikeSchema from '../../schemas/Like.model';
import { FollowResolver } from './follow.resolver';
import { FollowService } from './follow.service';
import { AuthModule } from '../auth/auth.module';
import { AuthGuard } from '../../libs/guards/auth.guard';
import { RolesGuard } from '../../libs/guards/roles.guard';
import { OptionalAuthGuard } from '../../libs/guards/optional-auth.guard';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Follow', schema: FollowSchema },
			{ name: 'Member', schema: MemberSchema },
			{ name: 'Like', schema: LikeSchema },
		]),
		AuthModule,
	],
	providers: [FollowResolver, FollowService, AuthGuard, RolesGuard, OptionalAuthGuard],
	exports: [FollowService],
})
export class FollowModule {}
