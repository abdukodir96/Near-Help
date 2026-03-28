import { BookingStatus } from '../../../libs/enums/booking-status.enum';

type BookingStatusTemplateInput = {
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

const getStatusSentence = (status: BookingStatus): string => {
	switch (status) {
		case BookingStatus.CONFIRMED:
			return 'Your booking has been confirmed.';
		case BookingStatus.IN_PROGRESS:
			return 'Your booking is now in progress.';
		case BookingStatus.COMPLETED:
			return 'Your booking has been completed.';
		case BookingStatus.CANCELED:
			return 'Your booking has been canceled.';
		default:
			return 'Your booking status has been updated.';
	}
};

export const getBookingStatusTemplate = (
	input: BookingStatusTemplateInput,
): { subject: string; text: string; html: string } => {
	const recipientName = input.recipientName || 'Customer';
	const statusSentence = getStatusSentence(input.bookingStatus);
	const quotedPriceLine =
		typeof input.quotedPrice === 'number' ? `Quoted price: ${input.quotedPrice}` : 'Quoted price: -';
	const finalPriceLine = typeof input.finalPrice === 'number' ? `Final price: ${input.finalPrice}` : 'Final price: -';
	const canceledReasonLine = input.canceledReason ? `Canceled reason: ${input.canceledReason}` : 'Canceled reason: -';

	return {
		subject: `Booking ${input.bookingStatus.toLowerCase()}: ${input.serviceTitle}`,
		text: [
			`Hello ${recipientName},`,
			'',
			statusSentence,
			`Service: ${input.serviceTitle}`,
			`Date: ${input.bookingDate}`,
			`Time: ${input.bookingTime}`,
			`Address: ${input.bookingAddress}`,
			quotedPriceLine,
			finalPriceLine,
			canceledReasonLine,
			'',
			'NearHelp',
		].join('\n'),
		html: `
			<div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
				<h2 style="margin-bottom: 16px;">Booking Status Updated</h2>
				<p>Hello <strong>${recipientName}</strong>,</p>
				<p>${statusSentence}</p>
				<ul>
					<li><strong>Service:</strong> ${input.serviceTitle}</li>
					<li><strong>Date:</strong> ${input.bookingDate}</li>
					<li><strong>Time:</strong> ${input.bookingTime}</li>
					<li><strong>Address:</strong> ${input.bookingAddress}</li>
					<li><strong>Quoted price:</strong> ${typeof input.quotedPrice === 'number' ? input.quotedPrice : '-'}</li>
					<li><strong>Final price:</strong> ${typeof input.finalPrice === 'number' ? input.finalPrice : '-'}</li>
					<li><strong>Canceled reason:</strong> ${input.canceledReason ?? '-'}</li>
				</ul>
				<p style="margin-top: 24px;">NearHelp</p>
			</div>
		`,
	};
};
