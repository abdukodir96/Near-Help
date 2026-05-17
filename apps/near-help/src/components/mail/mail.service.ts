import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { BookingStatus } from '../../libs/enums/booking-status.enum';
import { getBookingCreatedTemplate } from './templates/booking-created.template';
import { getBookingStatusTemplate } from './templates/booking-status.template';

type BookingCreatedMailInput = {
	to?: string;
	bookingId?: string;
	recipientName: string;
	serviceTitle: string;
	serviceCategory?: string;
	bookingDate: string;
	bookingTime: string;
	bookingAddress: string;
	bookingNote?: string;
};

type BookingStatusMailInput = {
	to?: string;
	bookingId?: string;
	recipientName: string;
	serviceTitle: string;
	bookingStatus: BookingStatus;
	bookingDate: string;
	bookingTime: string;
	bookingAddress: string;
	canceledReason?: string;
	quotedPrice?: number;
	finalPrice?: number;
};

@Injectable()
export class MailService {
	private readonly logger = new Logger(MailService.name);
	private resend?: Resend;

	public async sendBookingCreatedEmail(input: BookingCreatedMailInput): Promise<boolean> {
		if (!this.isMailEnabled()) return false;
		if (!this.isValidRecipient(input.to)) return false;

		const template = getBookingCreatedTemplate(input);
		return this.sendMail({
			to: input.to!,
			subject: template.subject,
			html: template.html,
			text: template.text,
		});
	}

	public async sendBookingStatusEmail(input: BookingStatusMailInput): Promise<boolean> {
		if (!this.isMailEnabled()) return false;
		if (!this.isValidRecipient(input.to)) return false;

		const template = getBookingStatusTemplate(input);
		return this.sendMail({
			to: input.to!,
			subject: template.subject,
			html: template.html,
			text: template.text,
		});
	}

	private async sendMail(input: { to: string; subject: string; html: string; text: string }): Promise<boolean> {
		const client = this.getResendClient();
		if (!client) {
			this.logger.warn('Resend client is not configured. Skipping email send.');
			return false;
		}

		try {
			const { data, error } = await client.emails.send({
				from: this.getMailFrom(),
				to: input.to,
				subject: input.subject,
				html: input.html,
				text: input.text,
			});

			if (error) {
				this.logger.error(`Resend error: ${error.message}`);
				return false;
			}

			this.logger.log(`Email sent successfully. id=${data?.id} to=${input.to}`);
			return true;
		} catch (err) {
			this.logger.error(`Failed to send email: ${String(err)}`);
			return false;
		}
	}

	private getResendClient(): Resend | undefined {
		if (this.resend) return this.resend;
		const apiKey = process.env.RESEND_API_KEY;
		if (!apiKey || apiKey === 'replace_with_resend_api_key') return undefined;
		this.resend = new Resend(apiKey);
		return this.resend;
	}

	private isMailEnabled(): boolean {
		return String(process.env.MAIL_ENABLED ?? 'false') === 'true';
	}

	private isValidRecipient(email: string | undefined): email is string {
		return Boolean(email && email.includes('@'));
	}

	private getMailFrom(): string {
		return process.env.MAIL_FROM ?? 'NearHelp <onboarding@resend.dev>';
	}
}
