import { Injectable } from '@nestjs/common';

@Injectable()
export class NearHelpBatchService {
  getHello(): string {
    return 'Welcome to NearHelp BATCH Server!';
  }
}
