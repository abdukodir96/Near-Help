import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Length, Matches, ValidateIf } from 'class-validator';
import { MemberAuthType, MemberType } from '../../enums/member.enum';

@InputType()
export class MemberInput {
	@IsNotEmpty()
	@Length(3, 15)
	@Field(() => String)
	memberNick!: string;

	@IsNotEmpty()
	@Length(5, 15)
	@Field(() => String)
	memberPassword!: string;

	@ValidateIf((o: MemberInput) => !o.memberAuthType || o.memberAuthType === MemberAuthType.PHONE)
	@IsNotEmpty()
	@IsString()
	@Field(() => String, { nullable: true })
	memberPhone?: string;

	@ValidateIf((o: MemberInput) => o.memberAuthType === MemberAuthType.EMAIL)
	@IsNotEmpty()
	@IsEmail()
	@Field(() => String, { nullable: true })
	memberEmail?: string;

	@ValidateIf((o: MemberInput) => o.memberAuthType === MemberAuthType.TELEGRAM)
	@IsNotEmpty()
	@Length(5, 64)
	@Matches(/^@?[A-Za-z0-9_]+$/)
	@Field(() => String, { nullable: true })
	memberTelegramId?: string;

	@IsOptional()
	@IsEnum(MemberType)
	@Field(() => MemberType, { nullable: true })
	memberType?: MemberType;

	@IsOptional()
	@IsEnum(MemberAuthType)
	@Field(() => MemberAuthType, { nullable: true })
	memberAuthType?: MemberAuthType;
}

@InputType()
export class LoginInput {
	@IsNotEmpty()
	@Length(3, 15)
	@Field(() => String)
	memberNick!: string;

	@IsNotEmpty()
	@Length(5, 15)
	@Field(() => String)
	memberPassword!: string;
}
