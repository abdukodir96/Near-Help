import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as mongoose from 'mongoose';
import { Followers, Followings, MeFollowed } from '../../libs/dto/follow/follow';
import { FollowInquiry, GetMeFollowedInput, ToggleFollowInput } from '../../libs/dto/follow/follow.input';
import { Like, MeLiked } from '../../libs/dto/like/like';
import { Member } from '../../libs/dto/member/member';
import { Message } from '../../libs/enums/common.enum';
import { LikeGroup } from '../../libs/enums/like.enum';
import { MemberStatus } from '../../libs/enums/member.enum';
import { AuthMemberPayload } from '../../libs/types/auth';

type FollowRecord = {
	_id: mongoose.ObjectId;
	followingId: mongoose.ObjectId;
	followerId: mongoose.ObjectId;
	createdAt: Date;
	updatedAt: Date;
};

@Injectable()
export class FollowService {
	constructor(
		@InjectModel('Follow') private readonly followModel: Model<FollowRecord>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		@InjectModel('Like') private readonly likeModel: Model<Like>,
	) {}

	public async toggleFollow(followerId: string, input: ToggleFollowInput): Promise<MeFollowed> {
		await this.ensureActorCanFollow(followerId);

		const followingId = input.targetMemberId;
		if (followerId === followingId) {
			throw new BadRequestException(Message.SELF_SUBSCRIPTION_DENIED);
		}

		await this.ensureTargetCanBeFollowed(followingId);

		const existingFollow = await this.followModel.findOne({ followingId, followerId }).select({ _id: 1 }).lean().exec();
		if (existingFollow) {
			const deleteResult = await this.followModel.deleteOne({ _id: existingFollow._id }).exec();
			if (deleteResult.deletedCount === 1) {
				await this.updateFollowCounters(followingId, followerId, -1);
			}

			return {
				followingId,
				followerId,
				myFollowing: false,
			};
		}

		try {
			await this.followModel.create({ followingId, followerId });
		} catch (err: unknown) {
			if (this.isMongoDuplicateKeyError(err)) {
				return {
					followingId,
					followerId,
					myFollowing: true,
				};
			}

			const errMessage = err instanceof Error ? err.message : String(err);
			console.log('Error, Follow.toggleFollow(create):', errMessage);
			throw new BadRequestException(Message.CREATE_FAILED);
		}

		await this.updateFollowCounters(followingId, followerId, 1);
		return {
			followingId,
			followerId,
			myFollowing: true,
		};
	}

	public async getMeFollowed(followerId: string, input: GetMeFollowedInput): Promise<MeFollowed> {
		await this.ensureActorCanFollow(followerId);

		const followingId = input.targetMemberId;
		if (followerId === followingId) {
			return {
				followingId,
				followerId,
				myFollowing: false,
			};
		}

		await this.ensureTargetCanBeFollowed(followingId);

		const existingFollow = await this.followModel.findOne({ followingId, followerId }).select({ _id: 1 }).lean().exec();

		return {
			followingId,
			followerId,
			myFollowing: Boolean(existingFollow),
		};
	}

	public async getFollowers(authMember: AuthMemberPayload | null, input: FollowInquiry): Promise<Followers> {
		const followingId = input.search.followingId;
		if (!followingId) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		await this.ensureTargetCanBeFollowed(followingId);

		const skip = (input.page - 1) * input.limit;
		const [rows, total] = await Promise.all([
			this.followModel.find({ followingId }).sort({ createdAt: -1 }).skip(skip).limit(input.limit).lean().exec(),
			this.followModel.countDocuments({ followingId }).exec(),
		]);

		const followerIds = rows.map((row) => String(row.followerId));
		const [memberMap, likedSet, followedSet] = await Promise.all([
			this.getMemberMap(followerIds),
			this.getLikedMemberIdSet(authMember?._id, followerIds),
			this.getFollowedMemberIdSet(authMember?._id, followerIds),
		]);

		const list = rows.map((row) => {
			const targetMemberId = String(row.followerId);
			return {
				_id: row._id,
				followingId: String(row.followingId),
				followerId: targetMemberId,
				createdAt: row.createdAt,
				updatedAt: row.updatedAt,
				meLiked: this.buildMeLikedArray(authMember?._id, targetMemberId, likedSet.has(targetMemberId)),
				meFollowed: this.buildMeFollowedArray(authMember?._id, targetMemberId, followedSet.has(targetMemberId)),
				followerData: memberMap.get(targetMemberId),
			};
		});

		return {
			list,
			metaCounter: [{ total }],
		};
	}

	public async getFollowings(authMember: AuthMemberPayload | null, input: FollowInquiry): Promise<Followings> {
		const followerId = input.search.followerId;
		if (!followerId) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		await this.ensureTargetCanBeFollowed(followerId);

		const skip = (input.page - 1) * input.limit;
		const [rows, total] = await Promise.all([
			this.followModel.find({ followerId }).sort({ createdAt: -1 }).skip(skip).limit(input.limit).lean().exec(),
			this.followModel.countDocuments({ followerId }).exec(),
		]);

		const followingIds = rows.map((row) => String(row.followingId));
		const [memberMap, likedSet, followedSet] = await Promise.all([
			this.getMemberMap(followingIds),
			this.getLikedMemberIdSet(authMember?._id, followingIds),
			this.getFollowedMemberIdSet(authMember?._id, followingIds),
		]);

		const list = rows.map((row) => {
			const targetMemberId = String(row.followingId);
			return {
				_id: row._id,
				followingId: targetMemberId,
				followerId: String(row.followerId),
				createdAt: row.createdAt,
				updatedAt: row.updatedAt,
				meLiked: this.buildMeLikedArray(authMember?._id, targetMemberId, likedSet.has(targetMemberId)),
				meFollowed: this.buildMeFollowedArray(authMember?._id, targetMemberId, followedSet.has(targetMemberId)),
				followingData: memberMap.get(targetMemberId),
			};
		});

		return {
			list,
			metaCounter: [{ total }],
		};
	}

	private async ensureActorCanFollow(memberId: string): Promise<void> {
		const member = await this.memberModel.findById(memberId).select({ memberStatus: 1 }).lean().exec();
		if (!member || member.memberStatus === MemberStatus.DELETED) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}

		if (member.memberStatus === MemberStatus.BLOCKED) {
			throw new ForbiddenException(Message.BLOCKED_USER);
		}
	}

	private async ensureTargetCanBeFollowed(memberId: string): Promise<void> {
		const member = await this.memberModel.findById(memberId).select({ memberStatus: 1 }).lean().exec();
		if (!member || member.memberStatus !== MemberStatus.ACTIVE) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}
	}

	private async updateFollowCounters(followingId: string, followerId: string, delta: 1 | -1): Promise<void> {
		await Promise.all([
			this.memberModel.updateOne({ _id: followingId }, { $inc: { memberFollowers: delta } }).exec(),
			this.memberModel.updateOne({ _id: followerId }, { $inc: { memberFollowings: delta } }).exec(),
		]);
	}

	private async getMemberMap(memberIds: string[]): Promise<Map<string, Member>> {
		if (memberIds.length === 0) return new Map<string, Member>();

		const members = await this.memberModel
			.find({ _id: { $in: memberIds }, memberStatus: { $ne: MemberStatus.DELETED } })
			.lean()
			.exec();

		return new Map<string, Member>(members.map((member) => [String(member._id), member as Member]));
	}

	private async getLikedMemberIdSet(memberId: string | undefined, targetIds: string[]): Promise<Set<string>> {
		if (!memberId || targetIds.length === 0) return new Set<string>();

		const likes = await this.likeModel
			.find({
				memberId,
				likeGroup: LikeGroup.MEMBER,
				likeRefId: { $in: targetIds },
			})
			.select({ likeRefId: 1 })
			.lean()
			.exec();

		return new Set(likes.map((like) => String(like.likeRefId)));
	}

	private async getFollowedMemberIdSet(memberId: string | undefined, targetIds: string[]): Promise<Set<string>> {
		if (!memberId || targetIds.length === 0) return new Set<string>();

		const follows = await this.followModel
			.find({
				followerId: memberId,
				followingId: { $in: targetIds },
			})
			.select({ followingId: 1 })
			.lean()
			.exec();

		return new Set(follows.map((follow) => String(follow.followingId)));
	}

	private buildMeLikedArray(memberId: string | undefined, likeRefId: string, isLiked: boolean): MeLiked[] {
		if (!memberId || !isLiked) return [];
		return [{ memberId, likeRefId, myFavorite: true }];
	}

	private buildMeFollowedArray(memberId: string | undefined, followingId: string, isFollowing: boolean): MeFollowed[] {
		if (!memberId || !isFollowing) return [];
		return [{ followingId, followerId: memberId, myFollowing: true }];
	}

	private isMongoDuplicateKeyError(err: unknown): boolean {
		if (typeof err !== 'object' || err === null || !('code' in err)) {
			return false;
		}
		return (err as { code?: number }).code === 11000;
	}
}
