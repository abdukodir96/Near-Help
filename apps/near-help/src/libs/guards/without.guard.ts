import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlContextType } from '@nestjs/graphql';
import { AuthService } from '../../components/auth/auth.service';
import { getAuthRequest } from '../utils/auth-context.util';

@Injectable()
export class WithoutGuard implements CanActivate {
	constructor(private readonly authService: AuthService) {}

	public async canActivate(context: ExecutionContext): Promise<boolean> {
		console.info('--- @guard() Authentication [WithoutGuard] ---');

		if (context.getType<GqlContextType>() !== 'graphql') {
			return false;
		}

		const request = getAuthRequest(context);
		const bearerToken = request.headers?.authorization;

		if (bearerToken) {
			try {
				const token = this.extractToken(bearerToken);
				const decodedToken = await this.authService.verifyToken(token);
				request.body.authMember = {
					_id: decodedToken.sub,
					memberType: decodedToken.memberType,
					memberStatus: decodedToken.memberStatus,
					memberAuthType: decodedToken.memberAuthType,
				};
			} catch {
				request.body.authMember = null;
			}
		} else {
			request.body.authMember = null;
		}

		console.log('memberId[without] =>', request.body.authMember?._id ?? 'none');
		return true;
	}

	private extractToken(bearerToken: string): string {
		const [scheme, token] = bearerToken.trim().split(/\s+/);
		if (scheme !== 'Bearer' || !token) {
			throw new Error('Invalid bearer token format');
		}

		return token;
	}
}
