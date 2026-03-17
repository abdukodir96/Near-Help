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
import { formatGraphQLErrorResponse } from './libs/utils/error.util';
import { Request, Response } from 'express';

@Module({
	imports: [
		ConfigModule.forRoot(),
		GraphQLModule.forRoot({
			driver: ApolloDriver,
			playground: process.env.NODE_ENV !== 'production',
			includeStacktraceInErrorResponses: false,
			uploads: false,
			autoSchemaFile: true,
			context: ({ req, res }: { req: Request; res: Response }) => ({ req, res }),
			formatError: (error: GraphQLFormattedError) => {
				const graphQLFormattedError = formatGraphQLErrorResponse(error);
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
