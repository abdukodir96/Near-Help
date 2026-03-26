import { PipelineStage, Types } from 'mongoose';
import { LikeGroup } from './enums/like.enum';

const isProduction = process.env.NODE_ENV === 'production';

const parsePositiveInt = (value: string | undefined, fallback: number): number => {
	const parsed = Number.parseInt(value ?? '', 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const authConfig = {
	bcryptSaltRounds: parsePositiveInt(process.env.BCRYPT_SALT_ROUNDS, 12),
	accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
	refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
};

export const uploadConfig = {
	rootDir: process.env.UPLOAD_ROOT_DIR ?? 'uploads',
	imageDir: process.env.UPLOAD_IMAGE_DIR ?? 'images',
	maxImageBytes: parsePositiveInt(process.env.UPLOAD_MAX_IMAGE_BYTES, 5 * 1024 * 1024),
	maxImageFiles: parsePositiveInt(process.env.UPLOAD_MAX_IMAGE_FILES, 10),
};

export const aiConfig = {
	baseUrl: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
	apiKey: process.env.OPENAI_API_KEY ?? '',
	pricingModel: process.env.OPENAI_MODEL_PRICING ?? 'gpt-5-mini',
	chatModel: process.env.OPENAI_MODEL_CHAT ?? 'gpt-5-mini',
	embeddingModel: process.env.OPENAI_MODEL_EMBEDDING ?? 'text-embedding-3-small',
	timeoutMs: parsePositiveInt(process.env.OPENAI_TIMEOUT_MS, 15000),
	maxRetries: parsePositiveInt(process.env.OPENAI_MAX_RETRIES, 2),
	pricingEnabled: process.env.AI_PRICING_ENABLED !== 'false',
	embeddingEnabled: process.env.AI_EMBEDDING_ENABLED !== 'false',
	recommendationEnabled: process.env.AI_RECOMMENDATION_ENABLED !== 'false',
	semanticCandidateLimit: parsePositiveInt(process.env.AI_SEMANTIC_CANDIDATE_LIMIT, 300),
	logEnabled: process.env.AI_LOG_ENABLED !== 'false',
};

export const availableCommentSorts = ['createdAt', 'updatedAt'] as const;

const toObjectId = (value: string | Types.ObjectId): Types.ObjectId =>
	typeof value === 'string' ? new Types.ObjectId(value) : value;

type LookupAuthMemberLikedStage = PipelineStage.Lookup | PipelineStage.AddFields | PipelineStage.Project;
type LookupAuthMemberFollowedStage = PipelineStage.Lookup | PipelineStage.AddFields | PipelineStage.Project;

export const lookupAuthMemberLiked = (
	authMemberId: string | Types.ObjectId | null | undefined,
	likeGroup: LikeGroup,
	likeRefIdExpr = '$_id',
): LookupAuthMemberLikedStage[] => {
	if (!authMemberId) {
		return [{ $addFields: { meLiked: false } }];
	}

	const memberObjectId = toObjectId(authMemberId);

	return [
		{
			$lookup: {
				from: 'likes',
				let: { refId: likeRefIdExpr },
				pipeline: [
					{
						$match: {
							$expr: {
								$and: [
									{ $eq: ['$memberId', memberObjectId] },
									{ $eq: ['$likeGroup', likeGroup] },
									{ $eq: ['$likeRefId', '$$refId'] },
								],
							},
						},
					},
					{ $project: { _id: 1 } },
				],
				as: 'meLikedDocs',
			},
		},
		{
			$addFields: {
				meLiked: { $gt: [{ $size: '$meLikedDocs' }, 0] },
			},
		},
		{ $project: { meLikedDocs: 0 } },
	];
};

export const lookupAuthMemberFollowed = (
	authMemberId: string | Types.ObjectId | null | undefined,
	followingIdExpr = '$_id',
	asField = 'meFollowed',
): LookupAuthMemberFollowedStage[] => {
	if (!authMemberId) {
		return [{ $addFields: { [asField]: false } }];
	}

	const memberObjectId = toObjectId(authMemberId);
	const docField = `${asField}Docs`;

	return [
		{
			$lookup: {
				from: 'follows',
				let: { followingId: followingIdExpr },
				pipeline: [
					{
						$match: {
							$expr: {
								$and: [{ $eq: ['$followerId', memberObjectId] }, { $eq: ['$followingId', '$$followingId'] }],
							},
						},
					},
					{ $project: { _id: 1 } },
				],
				as: docField,
			},
		},
		{
			$addFields: {
				[asField]: { $gt: [{ $size: `$${docField}` }, 0] },
			},
		},
		{ $project: { [docField]: 0 } },
	];
};

export const getAccessTokenSecret = (): string => {
	const secret = process.env.JWT_ACCESS_SECRET;
	if (secret) return secret;
	if (!isProduction) return 'near_help_dev_access_secret_change_me';
	throw new Error('JWT_ACCESS_SECRET is required in production');
};

export const getRefreshTokenSecret = (): string => {
	const secret = process.env.JWT_REFRESH_SECRET;
	if (secret) return secret;
	if (!isProduction) return 'near_help_dev_refresh_secret_change_me';
	throw new Error('JWT_REFRESH_SECRET is required in production');
};
