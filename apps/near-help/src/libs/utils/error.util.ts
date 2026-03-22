import { GraphQLFormattedError } from 'graphql';
import { ErrorCode, getErrorCodeByGraphQLCode, getErrorCodeByStatus, Message } from '../enums/common.enum';

type ErrorExtensions = {
	code?: string;
	status?: number;
	originalError?: { message?: string | string[]; statusCode?: number };
	exception?: { response?: { message?: string | string[]; statusCode?: number } };
	response?: { message?: string | string[]; statusCode?: number };
};

const getStatusCode = (ext: ErrorExtensions): number | undefined =>
	typeof ext.originalError?.statusCode === 'number'
		? ext.originalError.statusCode
		: typeof ext.exception?.response?.statusCode === 'number'
			? ext.exception.response.statusCode
			: typeof ext.response?.statusCode === 'number'
				? ext.response.statusCode
				: typeof ext.status === 'number'
					? ext.status
					: undefined;

const getMessage = (ext: ErrorExtensions, fallbackMessage: string): string => {
	const rawMessage =
		ext.originalError?.message || ext.exception?.response?.message || ext.response?.message || fallbackMessage;

	return Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;
};

export const formatGraphQLErrorResponse = (error: GraphQLFormattedError): { code: ErrorCode; message: string } => {
	const ext = (error.extensions ?? {}) as ErrorExtensions;
	const statusCode = getStatusCode(ext);
	const graphQLCode = typeof ext.code === 'string' ? ext.code : undefined;
	const code =
		getErrorCodeByStatus(statusCode) || getErrorCodeByGraphQLCode(graphQLCode) || ErrorCode.INTERNAL_SERVER_ERROR;
	const message = getMessage(ext, error.message) || Message.SOMETHING_WENT_WRONG;

	// Never leak internal runtime details through public API in production.
	if (code === ErrorCode.INTERNAL_SERVER_ERROR && process.env.NODE_ENV === 'production') {
		return { code, message: Message.SOMETHING_WENT_WRONG };
	}

	return { code, message };
};
