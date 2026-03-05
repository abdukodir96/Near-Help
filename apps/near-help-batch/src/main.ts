import { NestFactory } from '@nestjs/core';
import { NearHelpBatchModule } from './near-help-batch.module';

async function bootstrap() {
  const app = await NestFactory.create(NearHelpBatchModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
