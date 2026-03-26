import { NestFactory } from '@nestjs/core';
import { NearHelpBatchModule } from './near-help-batch.module';
import { Logger } from '@nestjs/common';

const logger = new Logger('NearHelpBatchBootstrap');

async function bootstrap() {
	const app = await NestFactory.create(NearHelpBatchModule);
	const port = Number(process.env.PORT_BATCH ?? 3001);
	await app.listen(port);
	logger.log(`NearHelp batch app listening on port ${port}`);
}
bootstrap().catch((err: unknown) => {
	logger.error('Failed to bootstrap near-help batch app', err);
	process.exit(1);
});
