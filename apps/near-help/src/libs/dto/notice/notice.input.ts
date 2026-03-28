import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsIn, IsInt, IsMongoId, IsNotEmpty, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { Direction } from '../../enums/common.enum';
import { NoticeCategory, NoticeStatus } from '../../enums/notice.enum';

@InputType()
export class NoticeInput {
	@IsNotEmpty()
	@IsEnum(NoticeCategory)
	@Field(() => NoticeCategory)
	noticeCategory!: NoticeCategory;

	@IsNotEmpty()
	@IsString()
	@Length(3, 120)
	@Field(() => String)
	noticeTitle!: string;

	@IsNotEmpty()
	@IsString()
	@Length(3, 5000)
	@Field(() => String)
	noticeContent!: string;
}

@InputType()
export class GetNoticeInput {
	@IsNotEmpty()
	@IsMongoId()
	@Field(() => String)
	noticeId!: string;
}

@InputType()
class NoticesSearchInput {
	@IsOptional()
	@IsEnum(NoticeCategory)
	@Field(() => NoticeCategory, { nullable: true })
	noticeCategory?: NoticeCategory;

	@IsOptional()
	@IsString()
	@Length(1, 120)
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class NoticesInquiry {
	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Max(100)
	@Field(() => Int)
	limit!: number;

	@IsOptional()
	@IsIn(['createdAt', 'updatedAt'])
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@IsEnum(Direction)
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => NoticesSearchInput)
	search!: NoticesSearchInput;
}

@InputType()
class AllNoticesSearchInput {
	@IsOptional()
	@IsEnum(NoticeCategory)
	@Field(() => NoticeCategory, { nullable: true })
	noticeCategory?: NoticeCategory;

	@IsOptional()
	@IsEnum(NoticeStatus)
	@Field(() => NoticeStatus, { nullable: true })
	noticeStatus?: NoticeStatus;

	@IsOptional()
	@IsString()
	@Length(1, 120)
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class AllNoticesInquiry {
	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Max(100)
	@Field(() => Int)
	limit!: number;

	@IsOptional()
	@IsIn(['createdAt', 'updatedAt'])
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@IsEnum(Direction)
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => AllNoticesSearchInput)
	search!: AllNoticesSearchInput;
}

@InputType()
export class UpdateNoticeByAdminInput {
	@IsNotEmpty()
	@IsMongoId()
	@Field(() => String)
	targetNoticeId!: string;

	@IsOptional()
	@IsEnum(NoticeCategory)
	@Field(() => NoticeCategory, { nullable: true })
	noticeCategory?: NoticeCategory;

	@IsOptional()
	@IsEnum(NoticeStatus)
	@Field(() => NoticeStatus, { nullable: true })
	noticeStatus?: NoticeStatus;

	@IsOptional()
	@IsString()
	@Length(3, 120)
	@Field(() => String, { nullable: true })
	noticeTitle?: string;

	@IsOptional()
	@IsString()
	@Length(3, 5000)
	@Field(() => String, { nullable: true })
	noticeContent?: string;
}

@InputType()
export class RemoveNoticeByAdminInput {
	@IsNotEmpty()
	@IsMongoId()
	@Field(() => String)
	targetNoticeId!: string;
}
