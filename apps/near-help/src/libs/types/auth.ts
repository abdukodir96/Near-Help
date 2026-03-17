import { MemberAuthType, MemberStatus, MemberType } from '../enums/member.enum';

export type AuthMemberPayload = {
	_id: string;
	memberType: MemberType;
	memberStatus: MemberStatus;
	memberAuthType: MemberAuthType;
};
