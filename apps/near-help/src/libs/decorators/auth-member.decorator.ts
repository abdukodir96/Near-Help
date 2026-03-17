import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthMemberPayload } from '../types/auth';

export const AuthMember = createParamDecorator(
	(data: keyof AuthMemberPayload | undefined, context: ExecutionContext): AuthMemberPayload | string | undefined => {
		const gqlContext = GqlExecutionContext.create(context);
		const req = gqlContext.getContext<{ req?: { member?: AuthMemberPayload } }>().req;
		const member = req?.member;

		if (!member) return undefined;
		return data ? member[data] : member;
	},
);
