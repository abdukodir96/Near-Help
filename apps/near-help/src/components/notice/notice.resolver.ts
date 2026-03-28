import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthMember } from '../../libs/decorators/authMember.decorators';
import { Roles } from '../../libs/decorators/roles.decorators';
import { Notice, NoticesResult } from '../../libs/dto/notice/notice';
import {
	AllNoticesInquiry,
	GetNoticeInput,
	NoticeInput,
	NoticesInquiry,
	RemoveNoticeByAdminInput,
	UpdateNoticeByAdminInput,
} from '../../libs/dto/notice/notice.input';
import { AuthGuard } from '../../libs/guards/auth.guard';
import { RolesGuard } from '../../libs/guards/roles.guard';
import { MemberType } from '../../libs/enums/member.enum';
import { NoticeService } from './notice.service';

@Resolver()
export class NoticeResolver {
	constructor(private readonly noticeService: NoticeService) {}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.ADMIN)
	@Mutation(() => Notice)
	public async createNotice(@AuthMember('_id') memberId: string, @Args('input') input: NoticeInput): Promise<Notice> {
		console.log('Mutation: createNotice');
		return this.noticeService.createNotice(memberId, input);
	}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.ADMIN)
	@Mutation(() => Notice)
	public async updateNoticeByAdmin(@Args('input') input: UpdateNoticeByAdminInput): Promise<Notice> {
		console.log('Mutation: updateNoticeByAdmin');
		return this.noticeService.updateNoticeByAdmin(input);
	}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.ADMIN)
	@Mutation(() => Notice)
	public async removeNoticeByAdmin(@Args('input') input: RemoveNoticeByAdminInput): Promise<Notice> {
		console.log('Mutation: removeNoticeByAdmin');
		return this.noticeService.removeNoticeByAdmin(input);
	}

	@Query(() => Notice)
	public async getNotice(@Args('input') input: GetNoticeInput): Promise<Notice> {
		console.log('Query: getNotice');
		return this.noticeService.getNotice(input);
	}

	@Query(() => NoticesResult)
	public async getNotices(@Args('input') input: NoticesInquiry): Promise<NoticesResult> {
		console.log('Query: getNotices');
		return this.noticeService.getNotices(input);
	}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.ADMIN)
	@Query(() => NoticesResult)
	public async getAllNoticesByAdmin(@Args('input') input: AllNoticesInquiry): Promise<NoticesResult> {
		console.log('Query: getAllNoticesByAdmin');
		return this.noticeService.getAllNoticesByAdmin(input);
	}
}
