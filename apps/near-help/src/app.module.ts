import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import { AppResolver } from './app.resolver';
import { ComponentsModule } from './components/components.module';
import { DatabaseModule } from './database/database.module';
import { GraphQLFormattedError } from 'graphql';
import { ErrorCode, getErrorCodeByStatus, Message } from './libs/enums/common.enum';

type ErrorExtensions = {
	code?: string;
	status?: number;
	originalError?: { message?: string | string[]; statusCode?: number };
	exception?: { response?: { message?: string | string[]; statusCode?: number } };
	response?: { message?: string | string[]; statusCode?: number };
};

@Module({
	imports: [
		ConfigModule.forRoot(),
		GraphQLModule.forRoot({
			driver: ApolloDriver,
			playground: process.env.NODE_ENV !== 'production',
			includeStacktraceInErrorResponses: false,
			uploads: false,
			autoSchemaFile: true,
			formatError: (error: GraphQLFormattedError) => {
				const ext = error.extensions as ErrorExtensions | undefined;
				const statusCode =
					typeof ext?.originalError?.statusCode === 'number'
						? ext.originalError.statusCode
						: typeof ext?.exception?.response?.statusCode === 'number'
							? ext.exception.response.statusCode
							: typeof ext?.response?.statusCode === 'number'
								? ext.response.statusCode
								: typeof ext?.status === 'number'
									? ext.status
									: undefined;
				const mappedCode = getErrorCodeByStatus(statusCode);
				const code =
					mappedCode ||
					(typeof ext?.code === 'string' && ext.code.length > 0 ? ext.code : ErrorCode.INTERNAL_SERVER_ERROR);
				const rawMessage =
					ext?.originalError?.message || ext?.exception?.response?.message || ext?.response?.message || error.message;
				const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;
				const graphQLFormattedError = {
					code,
					message: message || Message.SOMETHING_WENT_WRONG,
				};
				console.log('GRAPHQL GLOBAL ERR:', graphQLFormattedError);
				return graphQLFormattedError;
			},
		}),
		ComponentsModule,
		DatabaseModule,
	],
	controllers: [AppController],
	providers: [AppService, AppResolver],
})
export class AppModule {}
