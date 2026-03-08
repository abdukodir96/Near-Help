import { Schema } from 'mongoose';
import { MemberAuthType, MemberStatus, MemberType } from '../libs/enums/member.enum';

const MemberSchema = new Schema(
	{
		memberType: {
			type: String,
			enum: MemberType,
			default: MemberType.USER,
		},

		memberStatus: {
			type: String,
			enum: MemberStatus,
			default: MemberStatus.ACTIVE,
		},

		memberAuthType: {
			type: String,
			enum: MemberAuthType,
			default: MemberAuthType.PHONE,
		},

		memberPhone: {
			type: String,
			index: { unique: true, sparse: true },
			required: function (this: { memberAuthType?: MemberAuthType }) {
				return this.memberAuthType === MemberAuthType.PHONE;
			},
		},

		memberEmail: {
			type: String,
			lowercase: true,
			trim: true,
			index: { unique: true, sparse: true },
			required: function (this: { memberAuthType?: MemberAuthType }) {
				return this.memberAuthType === MemberAuthType.EMAIL;
			},
		},

		memberTelegramId: {
			type: String,
			trim: true,
			index: { unique: true, sparse: true },
			required: function (this: { memberAuthType?: MemberAuthType }) {
				return this.memberAuthType === MemberAuthType.TELEGRAM;
			},
		},

		memberNick: {
			type: String,
			index: { unique: true, sparse: true },
			required: true,
		},

		memberPassword: {
			type: String,
			select: false,
			required: true,
		},

		memberFullName: {
			type: String,
		},

		memberImage: {
			type: String,
			default: '',
		},

		memberAddress: {
			type: String,
		},

		memberDesc: {
			type: String,
		},

		memberServices: {
			type: Number,
			default: 0,
		},

		memberArticles: {
			type: Number,
			default: 0,
		},

		memberFollowers: {
			type: Number,
			default: 0,
		},

		memberFollowings: {
			type: Number,
			default: 0,
		},

		memberPoints: {
			type: Number,
			default: 0,
		},

		memberLikes: {
			type: Number,
			default: 0,
		},

		memberViews: {
			type: Number,
			default: 0,
		},

		memberComments: {
			type: Number,
			default: 0,
		},

		memberRank: {
			type: Number,
			default: 0,
		},

		memberWarnings: {
			type: Number,
			default: 0,
		},

		memberBlocks: {
			type: Number,
			default: 0,
		},

		deletedAt: {
			type: Date,
		},
	},
	{
		timestamps: true,
		collection: 'members',
	},
);

// Admin/user list filters
MemberSchema.index({ memberStatus: 1, createdAt: -1 });
MemberSchema.index({ memberType: 1, memberStatus: 1, createdAt: -1 });

// Agent ranking/sorting queries
MemberSchema.index({ memberType: 1, memberStatus: 1, memberLikes: -1 });
MemberSchema.index({ memberType: 1, memberStatus: 1, memberViews: -1 });
MemberSchema.index({ memberType: 1, memberStatus: 1, memberRank: -1 });

export default MemberSchema;
