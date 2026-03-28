import { Field, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { PaginationMeta, Member } from '../member/member';
import { NoticeCategory, NoticeStatus } from '../../enums/notice.enum';

@ObjectType()
export class Notice {
	@Field(() => String)
	_id!: mongoose.ObjectId;

	@Field(() => NoticeCategory)
	noticeCategory!: NoticeCategory;

	@Field(() => NoticeStatus)
	noticeStatus!: NoticeStatus;

	@Field(() => String)
	noticeTitle!: string;

	@Field(() => String)
	noticeContent!: string;

	@Field(() => String)
	memberId!: string;

	@Field(() => Member, { nullable: true })
	memberData?: Member;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;
}

@ObjectType()
export class NoticesResult {
	@Field(() => [Notice])
	list!: Notice[];

	@Field(() => PaginationMeta)
	meta!: PaginationMeta;
}
