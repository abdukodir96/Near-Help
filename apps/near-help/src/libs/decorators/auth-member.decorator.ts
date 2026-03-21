import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthMemberPayload } from '../types/auth';
import { getAuthRequest } from '../utils/auth-context.util';

export const AuthMember = createParamDecorator(
	(data: keyof AuthMemberPayload | undefined, context: ExecutionContext): AuthMemberPayload | string | null => {
		const request = getAuthRequest(context);
		const member = request.body.authMember;

		if (member && request.headers?.authorization) {
			member.authorization = request.headers.authorization;
		}

		if (!member) return null;

		if (!data) return member;
		const value = member[data];
		return typeof value === 'undefined' ? null : value;
	},
);
