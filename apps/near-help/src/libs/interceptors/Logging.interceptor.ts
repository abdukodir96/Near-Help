import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { throwError } from 'rxjs';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

type GraphQLHttpBody = {
	operationName?: unknown;
	query?: unknown;
	variables?: unknown;
};

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const SENSITIVE_KEY_PATTERN =
	/(password|pass|token|authorization|secret|cookie|api[_-]?key|phone|email|telegram|refresh)/i;
const MAX_LOG_STRING = 200;
const MAX_LOG_KEYS = 30;
const MAX_LOG_DEPTH = 4;

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	private readonly logger: Logger = new Logger(LoggingInterceptor.name);

	public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const recordTime = Date.now();
		const requestType = context.getType<GqlContextType>();

		if (requestType === 'graphql') {
			const gqlContext = GqlExecutionContext.create(context);
			const gqlReq = gqlContext.getContext<{ req?: { body?: unknown } }>().req;
			const safePayload = this.getSafeGraphQLPayload(gqlReq?.body);
			this.logger.log(this.stringify(safePayload), 'REQUEST');
		}

		return next.handle().pipe(
			tap(() => {
				const responseTime = Date.now() - recordTime;
				this.logger.log(`${responseTime}ms`, 'RESPONSE');
				this.printLogSpacer();
			}),
			catchError((err: unknown) => {
				const responseTime = Date.now() - recordTime;
				const safeError = this.getSafeError(err);
				this.logger.error(`${responseTime}ms ${this.stringify(safeError)}`, undefined, 'RESPONSE');
				this.printLogSpacer();
				return throwError(() => err);
			}),
		);
	}

	private printLogSpacer(): void {
		if (process.stdout.writable) {
			process.stdout.write('\n');
		}
	}

	private getSafeGraphQLPayload(body: unknown): Record<string, unknown> {
		const requestBody = body as GraphQLHttpBody | undefined;
		const operationName =
			typeof requestBody?.operationName === 'string' ? this.truncateString(requestBody.operationName) : 'anonymous';
		const hasVariables = typeof requestBody?.variables !== 'undefined';

		if (IS_PRODUCTION) {
			// In production, keep logs privacy-first and avoid query/variable data leakage.
			return {
				operationName,
				hasVariables,
			};
		}

		const query = typeof requestBody?.query === 'string' ? this.truncateString(requestBody.query) : undefined;
		const variables = this.sanitizeValue(requestBody?.variables);

		return {
			operationName,
			hasVariables,
			query,
			variables,
		};
	}

	private getSafeError(err: unknown): Record<string, unknown> {
		if (err instanceof Error) {
			const errorWithCode = err as Error & { code?: string };
			return {
				name: err.name,
				message: this.truncateString(err.message),
				code: errorWithCode.code,
			};
		}

		return {
			message: this.truncateString(String(err)),
		};
	}

	private sanitizeValue(value: unknown, depth = 0): unknown {
		if (depth >= MAX_LOG_DEPTH) {
			return '[TruncatedDepth]';
		}

		if (typeof value === 'string') {
			return this.truncateString(value);
		}

		if (Array.isArray(value)) {
			return value.slice(0, MAX_LOG_KEYS).map((item) => this.sanitizeValue(item, depth + 1));
		}

		if (value && typeof value === 'object') {
			const entries = Object.entries(value);
			const result: Record<string, unknown> = {};

			for (const [index, [key, val]] of entries.entries()) {
				if (index >= MAX_LOG_KEYS) {
					result.__truncated__ = true;
					break;
				}

				if (SENSITIVE_KEY_PATTERN.test(key)) {
					result[key] = '[REDACTED]';
					continue;
				}

				result[key] = this.sanitizeValue(val, depth + 1);
			}

			return result;
		}

		return value;
	}

	private truncateString(value: string): string {
		return value.length > MAX_LOG_STRING ? `${value.slice(0, MAX_LOG_STRING)}...[truncated]` : value;
	}

	private stringify(value: unknown): string {
		try {
			return this.truncateString(JSON.stringify(value));
		} catch {
			return '[UnserializableLogPayload]';
		}
	}
}
