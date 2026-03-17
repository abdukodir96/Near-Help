import { Field, ObjectType } from '@nestjs/graphql';
import { Member } from '../member/member';

@ObjectType()
export class AuthTokens {
	@Field(() => String)
	accessToken!: string;

	@Field(() => String)
	refreshToken!: string;
}

@ObjectType()
export class AuthResponse extends AuthTokens {
	@Field(() => Member)
	member!: Member;
}

@ObjectType()
export class LogoutResponse {
	@Field(() => String)
	message!: string;
}
