import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthService } from '../../components/auth/auth.service';
import { Message } from '../enums/common.enum';
import { AuthMemberPayload } from '../types/auth';

@Injectable()
export class GqlAuthGuard implements CanActivate {
	constructor(private readonly authService: AuthService) {}

	public async canActivate(context: ExecutionContext): Promise<boolean> {
		const gqlContext = GqlExecutionContext.create(context);
		const req = gqlContext.getContext<{ req?: { headers?: Record<string, unknown>; member?: AuthMemberPayload } }>()
			.req;

		const token = this.getBearerToken(req?.headers?.authorization);
		const payload = await this.authService.verifyAccessToken(token);

		if (!req) {
			throw new UnauthorizedException(Message.NOT_AUTHENTICATED);
		}

		req.member = {
			_id: payload.sub,
			memberType: payload.memberType,
			memberStatus: payload.memberStatus,
			memberAuthType: payload.memberAuthType,
		};

		return true;
	}

	private getBearerToken(authHeader: unknown): string {
		if (typeof authHeader !== 'string') {
			throw new UnauthorizedException(Message.TOKEN_NOT_EXIST);
		}

		const [scheme, token] = authHeader.trim().split(/\s+/);
		if (scheme !== 'Bearer' || !token) {
			throw new UnauthorizedException(Message.TOKEN_NOT_EXIST);
		}

		return token;
	}
}
