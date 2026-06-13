import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './libs/interceptors/Logging.interceptor';
import { NestExpressApplication } from '@nestjs/platform-express';
import { graphqlUploadExpress } from 'graphql-upload';
import { uploadConfig } from './libs/config';
import { join } from 'path';
import { RequestHandler } from 'express';

type CreateGraphQLUploadMiddleware = (options: { maxFileSize: number; maxFiles: number }) => RequestHandler;

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule);
	const corsOrigins = process.env.CORS_ORIGINS
		? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
		: ['http://localhost:3000', 'http://localhost:3001'];
	app.enableCors({
		origin: corsOrigins,
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization', 'Apollo-Require-Preflight'],
	});
	const createUploadMiddleware = graphqlUploadExpress as unknown as CreateGraphQLUploadMiddleware;
	const uploadMiddleware = createUploadMiddleware({
		maxFileSize: uploadConfig.maxImageBytes,
		maxFiles: uploadConfig.maxImageFiles,
	});
	app.use('/graphql', uploadMiddleware);
	app.useStaticAssets(join(process.cwd(), uploadConfig.rootDir), {
		prefix: `/${uploadConfig.rootDir}/`,
	});
	app.useGlobalPipes(
		new ValidationPipe({
			transform: true,
			whitelist: true,
			forbidNonWhitelisted: true,
		}),
	);
	app.useGlobalInterceptors(new LoggingInterceptor());
	await app.listen(process.env.PORT_API ?? 3000);
}
bootstrap().catch((err: unknown) => {
	console.error('Failed to bootstrap near-help API app', err);
	process.exit(1);
});
