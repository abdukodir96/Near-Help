import { Module } from '@nestjs/common';
import { NearHelpBatchController } from './near-help-batch.controller';
import { NearHelpBatchService } from './near-help-batch.service';

@Module({
  imports: [],
  controllers: [NearHelpBatchController],
  providers: [NearHelpBatchService],
})
export class NearHelpBatchModule {}
