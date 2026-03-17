import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@InputType()
export class RefreshTokenInput {
	@IsNotEmpty()
	@Field(() => String)
	refreshToken!: string;
}

@InputType()
export class LogoutInput {
	@IsNotEmpty()
	@Field(() => String)
	refreshToken!: string;
}
