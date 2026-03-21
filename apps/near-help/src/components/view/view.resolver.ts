import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ViewService } from './view.service';
import { WithoutGuard } from '../../libs/guards/without.guard';
import { AuthMember } from '../../libs/decorators/authMember.decorators';
import { RecordViewInput } from '../../libs/dto/view/view.input';
import { RecordViewResponse } from '../../libs/dto/view/view';
import { createHash } from 'crypto';

type ViewRequest = {
	ip?: string;
	headers?: Record<string, string | string[] | undefined>;
};

@Resolver()
export class ViewResolver {
	constructor(private readonly viewService: ViewService) {}

	@UseGuards(WithoutGuard)
	@Mutation(() => RecordViewResponse)
	public async recordView(
		@AuthMember('_id') memberId: string | null,
		@Args('input') input: RecordViewInput,
		@Context() context: { req?: ViewRequest },
	): Promise<RecordViewResponse> {
		console.log('Mutation: recordView');
		const guestKey = this.extractGuestKey(context.req);
		return this.viewService.recordView(memberId, guestKey, input);
	}

	private extractGuestKey(request?: ViewRequest): string | null {
		const explicitGuestId = this.readHeader(request?.headers, 'x-guest-id');
		if (explicitGuestId) return explicitGuestId;

		const forwardedFor = this.readHeader(request?.headers, 'x-forwarded-for');
		const userAgent = this.readHeader(request?.headers, 'user-agent');
		const ip = this.getIpFromHeaders(request?.ip, forwardedFor);

		if (!ip && !userAgent) return null;

		const rawFingerprint = `${ip ?? 'unknown-ip'}|${userAgent ?? 'unknown-ua'}`;
		return createHash('sha256').update(rawFingerprint).digest('hex');
	}

	private readHeader(headers: ViewRequest['headers'], key: string): string | null {
		const value = headers?.[key];
		if (typeof value === 'string' && value.trim()) return value.trim();
		if (Array.isArray(value) && value.length > 0) return value[0]?.trim() ?? null;
		return null;
	}

	private getIpFromHeaders(ip?: string, forwardedFor?: string | null): string | null {
		if (ip && ip.trim()) return ip.trim();
		if (forwardedFor) {
			const firstIp = forwardedFor.split(',')[0]?.trim();
			return firstIp || null;
		}
		return null;
	}
}
