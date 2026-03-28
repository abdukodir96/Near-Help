type BookingCreatedTemplateInput = {
	recipientName: string;
	serviceTitle: string;
	bookingDate: string;
	bookingTime: string;
	bookingAddress: string;
	bookingNote?: string;
};

export const getBookingCreatedTemplate = (
	input: BookingCreatedTemplateInput,
): { subject: string; text: string; html: string } => {
	const recipientName = input.recipientName || 'Customer';
	const noteLine = input.bookingNote ? `Booking note: ${input.bookingNote}` : 'Booking note: -';

	return {
		subject: `Booking received: ${input.serviceTitle}`,
		text: [
			`Hello ${recipientName},`,
			'',
			'Your booking request has been received successfully.',
			`Service: ${input.serviceTitle}`,
			`Date: ${input.bookingDate}`,
			`Time: ${input.bookingTime}`,
			`Address: ${input.bookingAddress}`,
			noteLine,
			'',
			'We will notify you once the booking status is updated.',
			'',
			'NearHelp',
		].join('\n'),
		html: `
			<div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
				<h2 style="margin-bottom: 16px;">Booking Request Received</h2>
				<p>Hello <strong>${recipientName}</strong>,</p>
				<p>Your booking request has been received successfully.</p>
				<ul>
					<li><strong>Service:</strong> ${input.serviceTitle}</li>
					<li><strong>Date:</strong> ${input.bookingDate}</li>
					<li><strong>Time:</strong> ${input.bookingTime}</li>
					<li><strong>Address:</strong> ${input.bookingAddress}</li>
					<li><strong>Booking note:</strong> ${input.bookingNote ?? '-'}</li>
				</ul>
				<p>We will notify you once the booking status is updated.</p>
				<p style="margin-top: 24px;">NearHelp</p>
			</div>
		`,
	};
};
