import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { MemberAuthType, MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { Message } from '../../libs/enums/common.enum';
import { authConfig, getAccessTokenSecret, getRefreshTokenSecret } from '../../libs/config';

type MemberTokenPayload = {
	sub: string;
	memberType: MemberType;
	memberStatus: MemberStatus;
	memberAuthType: MemberAuthType;
	tokenType: 'access' | 'refresh';
};

type TokenSet = {
	accessToken: string;
	refreshToken: string;
	refreshTokenExpiresAt?: Date;
};

@Injectable()
export class AuthService {
	constructor(private readonly jwtService: JwtService) {
		// Fail fast in production if secrets are not configured.
		getAccessTokenSecret();
		getRefreshTokenSecret();
	}

	public async hashPassword(rawPassword: string): Promise<string> {
		return await hash(rawPassword, authConfig.bcryptSaltRounds);
	}

	public async comparePassword(rawPassword: string, hashedPassword: string): Promise<boolean> {
		return await compare(rawPassword, hashedPassword);
	}

	public async hashRefreshToken(refreshToken: string): Promise<string> {
		return await hash(refreshToken, authConfig.bcryptSaltRounds);
	}

	public async compareRefreshToken(refreshToken: string, hashedRefreshToken: string): Promise<boolean> {
		return await compare(refreshToken, hashedRefreshToken);
	}

	public async issueTokenPair(member: {
		_id: unknown;
		memberType: MemberType;
		memberStatus: MemberStatus;
		memberAuthType: MemberAuthType;
	}): Promise<TokenSet> {
		const basePayload = {
			sub: String(member._id),
			memberType: member.memberType,
			memberStatus: member.memberStatus,
			memberAuthType: member.memberAuthType,
		};

		const [accessToken, refreshToken] = await Promise.all([
			this.jwtService.signAsync(
				{
					...basePayload,
					tokenType: 'access',
				} satisfies MemberTokenPayload,
				{
					secret: getAccessTokenSecret(),
					expiresIn: authConfig.accessTokenExpiresIn,
				},
			),
			this.jwtService.signAsync(
				{
					...basePayload,
					tokenType: 'refresh',
				} satisfies MemberTokenPayload,
				{
					secret: getRefreshTokenSecret(),
					expiresIn: authConfig.refreshTokenExpiresIn,
				},
			),
		]);

		const refreshTokenPayload = this.jwtService.decode<unknown>(refreshToken);
		const refreshTokenExpiresAt = this.extractExpirationDate(refreshTokenPayload);

		return {
			accessToken,
			refreshToken,
			refreshTokenExpiresAt,
		};
	}

	public async verifyRefreshToken(refreshToken: string): Promise<MemberTokenPayload> {
		try {
			const payload = await this.jwtService.verifyAsync<MemberTokenPayload>(refreshToken, {
				secret: getRefreshTokenSecret(),
			});

			if (!payload?.sub || payload.tokenType !== 'refresh') {
				throw new UnauthorizedException(Message.INVALID_REFRESH_TOKEN);
			}

			return payload;
		} catch {
			throw new UnauthorizedException(Message.INVALID_REFRESH_TOKEN);
		}
	}

	private extractExpirationDate(payload: unknown): Date | undefined {
		if (!payload || typeof payload !== 'object') return undefined;

		const exp = (payload as { exp?: unknown }).exp;
		return typeof exp === 'number' ? new Date(exp * 1000) : undefined;
	}
}
