import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Message } from '../enums/common.enum';
import { ROLES_KEY, RoleType } from '../decorators/roles.decorator';
import { AuthMemberPayload } from '../types/auth';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private readonly reflector: Reflector) {}

	public canActivate(context: ExecutionContext): boolean {
		const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>(ROLES_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (!requiredRoles || requiredRoles.length === 0) {
			return true;
		}

		const gqlContext = GqlExecutionContext.create(context);
		const req = gqlContext.getContext<{ req?: { member?: AuthMemberPayload } }>().req;
		const currentMemberRole = req?.member?.memberType;

		if (requiredRoles.includes('GUEST')) {
			if (currentMemberRole) {
				throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
			}
			return true;
		}

		if (!currentMemberRole) {
			throw new UnauthorizedException(Message.NOT_AUTHENTICATED);
		}

		if (!requiredRoles.includes(currentMemberRole)) {
			throw new ForbiddenException(Message.ONLY_SPECIFIC_ROLES_ALLOWED);
		}

		return true;
	}
}
