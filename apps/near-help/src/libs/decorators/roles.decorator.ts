import { SetMetadata } from '@nestjs/common';
import { MemberType } from '../enums/member.enum';

export const ROLES_KEY = 'roles';
export type RoleType = MemberType | 'GUEST';

export const Roles = (...roles: RoleType[]) => SetMetadata(ROLES_KEY, roles);
