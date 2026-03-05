import { Test, TestingModule } from '@nestjs/testing';
import { NearHelpBatchController } from './near-help-batch.controller';
import { NearHelpBatchService } from './near-help-batch.service';

describe('NearHelpBatchController', () => {
  let nearHelpBatchController: NearHelpBatchController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [NearHelpBatchController],
      providers: [NearHelpBatchService],
    }).compile();

    nearHelpBatchController = app.get<NearHelpBatchController>(NearHelpBatchController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(nearHelpBatchController.getHello()).toBe('Hello World!');
    });
  });
});
