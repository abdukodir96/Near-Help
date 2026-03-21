import { ExecutionContext } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { AuthRequest } from '../types/auth';

export const getAuthRequest = (context: ExecutionContext): AuthRequest => {
	const isGraphql = context.getType<GqlContextType>() === 'graphql';
	const request = isGraphql
		? GqlExecutionContext.create(context).getContext<{ req?: AuthRequest }>().req
		: context.switchToHttp().getRequest<AuthRequest | undefined>();

	if (!request) {
		return { body: {} };
	}

	if (!request.body) {
		request.body = {};
	}

	return request;
};
