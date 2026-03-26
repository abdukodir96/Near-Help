import { Module } from '@nestjs/common';
import { NearHelpBatchController } from './near-help-batch.controller';
import { NearHelpBatchService } from './near-help-batch.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../near-help/src/database/database.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import ServiceSchema from '../../near-help/src/schemas/Service.model';
import MemberSchema from '../../near-help/src/schemas/Member.model';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		DatabaseModule,
		ScheduleModule.forRoot(),
		MongooseModule.forFeature([
			{ name: 'Service', schema: ServiceSchema },
			{ name: 'Member', schema: MemberSchema },
		]),
	],
	controllers: [NearHelpBatchController],
	providers: [NearHelpBatchService],
})
export class NearHelpBatchModule {}
