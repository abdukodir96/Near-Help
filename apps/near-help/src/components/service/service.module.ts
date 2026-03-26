import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import ServiceSchema from '../../schemas/Service.model';
import MemberSchema from '../../schemas/Member.model';
import LikeSchema from '../../schemas/Like.model';
import { ServiceResolver } from './service.resolver';
import { ServiceService } from './service.service';
import { AuthModule } from '../auth/auth.module';
import { AuthGuard } from '../../libs/guards/auth.guard';
import { RolesGuard } from '../../libs/guards/roles.guard';
import { ViewModule } from '../view/view.module';
import { OptionalAuthGuard } from '../../libs/guards/optional-auth.guard';
import { AiModule } from '../ai/ai.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Service', schema: ServiceSchema },
			{ name: 'Member', schema: MemberSchema },
			{ name: 'Like', schema: LikeSchema },
		]),
		AuthModule,
		ViewModule,
		AiModule,
	],
	providers: [ServiceResolver, ServiceService, AuthGuard, RolesGuard, OptionalAuthGuard],
	exports: [ServiceService],
})
export class ServiceModule {}
