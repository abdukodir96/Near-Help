import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { BookingStatus } from '../../libs/enums/booking-status.enum';
import { getBookingCreatedTemplate } from './templates/booking-created.template';
import { getBookingStatusTemplate } from './templates/booking-status.template';

type BookingCreatedMailInput = {
	to?: string;
	recipientName: string;
	serviceTitle: string;
	bookingDate: string;
	bookingTime: string;
	bookingAddress: string;
	bookingNote?: string;
};

type BookingStatusMailInput = {
	to?: string;
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
	private transporter?: nodemailer.Transporter;

	public async sendBookingCreatedEmail(input: BookingCreatedMailInput): Promise<boolean> {
		if (!this.isMailEnabled()) return false;
		if (!this.isValidRecipient(input.to)) return false;

		const template = getBookingCreatedTemplate(input);
		await this.sendMail({
			to: input.to,
			subject: template.subject,
			text: template.text,
			html: template.html,
		});

		return true;
	}

	public async sendBookingStatusEmail(input: BookingStatusMailInput): Promise<boolean> {
		if (!this.isMailEnabled()) return false;
		if (!this.isValidRecipient(input.to)) return false;

		const template = getBookingStatusTemplate(input);
		await this.sendMail({
			to: input.to,
			subject: template.subject,
			text: template.text,
			html: template.html,
		});

		return true;
	}

	private async sendMail(input: { to: string; subject: string; text: string; html: string }): Promise<void> {
		const transporter = this.getTransporter();
		if (!transporter) {
			this.logger.warn('Mail transporter is not configured. Skipping email send.');
			return;
		}

		await transporter.sendMail({
			from: this.getMailFrom(),
			to: input.to,
			subject: input.subject,
			text: input.text,
			html: input.html,
		});
	}

	private getTransporter(): nodemailer.Transporter | undefined {
		if (this.transporter) return this.transporter;
		if (!this.isMailEnabled()) return undefined;

		const host = process.env.MAIL_SMTP_HOST;
		const port = Number(process.env.MAIL_SMTP_PORT ?? 587);
		const secure = String(process.env.MAIL_SMTP_SECURE ?? 'false') === 'true';
		const user = process.env.MAIL_SMTP_USER;
		const pass = process.env.MAIL_SMTP_PASS;

		const transportConfig: SMTPTransport.Options = {
			host,
			port,
			secure,
		};

		if (user && pass) {
			transportConfig.auth = { user, pass };
		}

		this.transporter = nodemailer.createTransport(transportConfig);
		return this.transporter;
	}

	private isMailEnabled(): boolean {
		return String(process.env.MAIL_ENABLED ?? 'false') === 'true' && Boolean(process.env.MAIL_SMTP_HOST);
	}

	private isValidRecipient(email: string | undefined): email is string {
		return Boolean(email && email.includes('@'));
	}

	private getMailFrom(): string {
		return process.env.MAIL_FROM ?? 'NearHelp <no-reply@nearhelp.local>';
	}
}
