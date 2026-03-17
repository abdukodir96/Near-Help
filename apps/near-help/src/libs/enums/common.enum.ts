export enum Message {
	SOMETHING_WENT_WRONG = 'Something went wrong!',
	NO_DATA_FOUND = 'No data found!',
	CREATE_FAILED = 'Create failed!',
	UPDATE_FAILED = 'Update failed!',
	REMOVE_FAILED = 'Remove failed!',
	UPLOAD_FAILED = 'Upload failed!',
	BAD_REQUEST = 'Bad Request',

	USED_MEMBER_NICK_OR_PHONE = 'Already used member nick or phone!',
	INVALID_CREDENTIALS = 'Invalid credentials!',
	NO_MEMBER_NICK = 'No member with that member nick!',
	BLOCKED_USER = 'You have been blocked!',
	WRONG_PASSWORD = 'Wrong password, try again!',
	INVALID_REFRESH_TOKEN = 'Invalid refresh token!',
	LOGOUT_SUCCESS = 'Logout completed successfully!',
	NOT_AUTHENTICATED = 'You are not authenticated, please login first!',
	TOKEN_NOT_EXIST = 'Bearer Token is not provided!',
	ONLY_SPECIFIC_ROLES_ALLOWED = 'Allowed only for members with specific roles!',
	NOT_ALLOWED_REQUEST = 'Not Allowed Request!',
	PROVIDE_ALLOWED_FORMAT = 'Please provide jpg, jpeg or png images!',
	SELF_SUBSCRIPTION_DENIED = 'Self subscription is denied!',
}

export enum ErrorCode {
	BAD_REQUEST = 'BAD_REQUEST',
	UNAUTHENTICATED = 'UNAUTHENTICATED',
	FORBIDDEN = 'FORBIDDEN',
	NOT_FOUND = 'NOT_FOUND',
	CONFLICT = 'CONFLICT',
	INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

const STATUS_CODE_TO_ERROR_CODE: Record<number, ErrorCode> = {
	400: ErrorCode.BAD_REQUEST,
	401: ErrorCode.UNAUTHENTICATED,
	403: ErrorCode.FORBIDDEN,
	404: ErrorCode.NOT_FOUND,
	409: ErrorCode.CONFLICT,
};

export const getErrorCodeByStatus = (status?: number): ErrorCode | undefined => {
	if (typeof status !== 'number') return undefined;
	return STATUS_CODE_TO_ERROR_CODE[status];
};

const GRAPHQL_CODE_TO_ERROR_CODE: Record<string, ErrorCode> = {
	BAD_USER_INPUT: ErrorCode.BAD_REQUEST,
	GRAPHQL_PARSE_FAILED: ErrorCode.BAD_REQUEST,
	GRAPHQL_VALIDATION_FAILED: ErrorCode.BAD_REQUEST,
	UNAUTHENTICATED: ErrorCode.UNAUTHENTICATED,
	FORBIDDEN: ErrorCode.FORBIDDEN,
	NOT_FOUND: ErrorCode.NOT_FOUND,
	CONFLICT: ErrorCode.CONFLICT,
	INTERNAL_SERVER_ERROR: ErrorCode.INTERNAL_SERVER_ERROR,
};

export const getErrorCodeByGraphQLCode = (code?: string): ErrorCode | undefined => {
	if (!code) return undefined;
	return GRAPHQL_CODE_TO_ERROR_CODE[code];
};
