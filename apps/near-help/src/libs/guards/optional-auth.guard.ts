import { BadRequestException, CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlContextType } from '@nestjs/graphql';
import { AuthService } from '../../components/auth/auth.service';
import { Message } from '../enums/common.enum';
import { AuthMemberPayload } from '../types/auth';
import { getAuthRequest } from '../utils/auth-context.util';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
	constructor(private readonly authService: AuthService) {}

	public async canActivate(context: ExecutionContext): Promise<boolean> {
		console.info('--- @guard() Authentication [OptionalAuthGuard] ---');

		if (context.getType<GqlContextType>() !== 'graphql') {
			return false;
		}

		const request = getAuthRequest(context);
		const bearerToken = request.headers?.authorization;

		if (!bearerToken) {
			request.body.authMember = null;
			return true;
		}

		const token = this.extractToken(bearerToken);
		const decodedToken = await this.authService.verifyToken(token);

		const authMember: AuthMemberPayload = {
			_id: decodedToken.sub,
			memberType: decodedToken.memberType,
			memberStatus: decodedToken.memberStatus,
			memberAuthType: decodedToken.memberAuthType,
		};

		request.body.authMember = authMember;
		console.log('memberId[optional-auth] =>', authMember._id);
		return true;
	}

	private extractToken(bearerToken: string): string {
		const [scheme, token] = bearerToken.trim().split(/\s+/);
		if (scheme !== 'Bearer' || !token) {
			throw new BadRequestException(Message.TOKEN_NOT_EXIST);
		}

		return token;
	}
}
