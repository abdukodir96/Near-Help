import { Controller, Get } from '@nestjs/common';
import { NearHelpBatchService } from './near-help-batch.service';

@Controller()
export class NearHelpBatchController {
  constructor(private readonly nearHelpBatchService: NearHelpBatchService) {}

  @Get()
  getHello(): string {
    return this.nearHelpBatchService.getHello();
  }
}
