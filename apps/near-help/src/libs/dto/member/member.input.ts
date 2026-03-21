import { Field, InputType } from '@nestjs/graphql';
import {
	IsEmail,
	IsEnum,
	IsMongoId,
	IsNotEmpty,
	IsOptional,
	IsString,
	Length,
	Matches,
	ValidateIf,
} from 'class-validator';
import { MemberAuthType, MemberStatus, MemberType } from '../../enums/member.enum';

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

@InputType()
export class UpdateMemberInput {
	@IsOptional()
	@Length(3, 15)
	@Field(() => String, { nullable: true })
	memberNick?: string;

	@IsOptional()
	@Length(2, 50)
	@Field(() => String, { nullable: true })
	memberFullName?: string;

	@IsOptional()
	@IsString()
	@Length(8, 20)
	@Field(() => String, { nullable: true })
	memberPhone?: string;

	@IsOptional()
	@IsEmail()
	@Field(() => String, { nullable: true })
	memberEmail?: string;

	@IsOptional()
	@Length(5, 64)
	@Matches(/^@?[A-Za-z0-9_]+$/)
	@Field(() => String, { nullable: true })
	memberTelegramId?: string;

	@IsOptional()
	@Length(3, 120)
	@Field(() => String, { nullable: true })
	memberAddress?: string;

	@IsOptional()
	@Length(3, 600)
	@Field(() => String, { nullable: true })
	memberDesc?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	memberImage?: string;
}

@InputType()
export class GetAllMembersByAdminInput {
	@IsOptional()
	@IsEnum(MemberType)
	@Field(() => MemberType, { nullable: true })
	memberType?: MemberType;

	@IsOptional()
	@IsEnum(MemberStatus)
	@Field(() => MemberStatus, { nullable: true })
	memberStatus?: MemberStatus;

	@IsOptional()
	@Length(1, 40)
	@Field(() => String, { nullable: true })
	searchText?: string;
}

@InputType()
export class UpdateMemberByAdminInput {
	@IsNotEmpty()
	@Field(() => String)
	targetMemberId!: string;

	@IsOptional()
	@Length(3, 15)
	@Field(() => String, { nullable: true })
	memberNick?: string;

	@IsOptional()
	@Length(2, 50)
	@Field(() => String, { nullable: true })
	memberFullName?: string;

	@IsOptional()
	@IsString()
	@Length(8, 20)
	@Field(() => String, { nullable: true })
	memberPhone?: string;

	@IsOptional()
	@IsEmail()
	@Field(() => String, { nullable: true })
	memberEmail?: string;

	@IsOptional()
	@Length(5, 64)
	@Matches(/^@?[A-Za-z0-9_]+$/)
	@Field(() => String, { nullable: true })
	memberTelegramId?: string;

	@IsOptional()
	@Length(3, 120)
	@Field(() => String, { nullable: true })
	memberAddress?: string;

	@IsOptional()
	@Length(3, 600)
	@Field(() => String, { nullable: true })
	memberDesc?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	memberImage?: string;

	@IsOptional()
	@IsEnum(MemberType)
	@Field(() => MemberType, { nullable: true })
	memberType?: MemberType;

	@IsOptional()
	@IsEnum(MemberStatus)
	@Field(() => MemberStatus, { nullable: true })
	memberStatus?: MemberStatus;

	@IsOptional()
	@IsEnum(MemberAuthType)
	@Field(() => MemberAuthType, { nullable: true })
	memberAuthType?: MemberAuthType;
}

@InputType()
export class GetMemberInput {
	@IsOptional()
	@IsNotEmpty()
	@IsMongoId()
	@Field(() => String, { nullable: true })
	targetMemberId?: string;
}
