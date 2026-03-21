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
