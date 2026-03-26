import { Module } from '@nestjs/common';
import { NearHelpBatchController } from './near-help-batch.controller';
import { NearHelpBatchService } from './near-help-batch.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../near-help/src/database/database.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		DatabaseModule,
	],
	controllers: [NearHelpBatchController],
	providers: [NearHelpBatchService],
})
export class NearHelpBatchModule {}
