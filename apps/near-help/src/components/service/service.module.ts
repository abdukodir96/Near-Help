import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import ServiceSchema from '../../schemas/Service.model';
import MemberSchema from '../../schemas/Member.model';
import { ServiceResolver } from './service.resolver';
import { ServiceService } from './service.service';
import { AuthModule } from '../auth/auth.module';
import { AuthGuard } from '../../libs/guards/auth.guard';
import { RolesGuard } from '../../libs/guards/roles.guard';
import { WithoutGuard } from '../../libs/guards/without.guard';
import { ViewModule } from '../view/view.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Service', schema: ServiceSchema },
			{ name: 'Member', schema: MemberSchema },
		]),
		AuthModule,
		ViewModule,
	],
	providers: [ServiceResolver, ServiceService, AuthGuard, RolesGuard, WithoutGuard],
	exports: [ServiceService],
})
export class ServiceModule {}
