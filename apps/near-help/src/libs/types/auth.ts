import { MemberAuthType, MemberStatus, MemberType } from '../enums/member.enum';

export type AuthMemberPayload = {
	_id: string;
	memberType: MemberType;
	memberStatus: MemberStatus;
	memberAuthType: MemberAuthType;
	authorization?: string;
};

export type AuthRequest = {
	headers?: {
		authorization?: string;
	};
	body: {
		authMember?: AuthMemberPayload | null;
	};
};
