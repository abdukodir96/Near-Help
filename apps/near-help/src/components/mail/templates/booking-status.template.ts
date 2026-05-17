import { BookingStatus } from '../../../libs/enums/booking-status.enum';

type BookingStatusTemplateInput = {
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

type StatusMeta = {
	badge: string;
	badgeBg: string;
	badgeColor: string;
	icon: string;
	headline: string;
	body: string;
};

const getStatusMeta = (status: BookingStatus): StatusMeta => {
	switch (status) {
		case BookingStatus.CONFIRMED:
			return {
				badge: 'Confirmed',
				badgeBg: '#ecfdf5',
				badgeColor: '#065f46',
				icon: '✓',
				headline: 'Your booking is confirmed!',
				body: 'Great news! The agent has confirmed your booking. Please be ready at the scheduled time and address.',
			};
		case BookingStatus.IN_PROGRESS:
			return {
				badge: 'In Progress',
				badgeBg: '#eff6ff',
				badgeColor: '#1e40af',
				icon: '⚙',
				headline: 'Service is underway',
				body: 'Your service is currently in progress. Our agent is working on your request.',
			};
		case BookingStatus.COMPLETED:
			return {
				badge: 'Completed',
				badgeBg: '#f0fdf4',
				badgeColor: '#166534',
				icon: '★',
				headline: 'Service completed!',
				body: 'Your service has been completed. Thank you for choosing NearHelp. We hope everything went smoothly!',
			};
		case BookingStatus.CANCELED:
			return {
				badge: 'Canceled',
				badgeBg: '#fef2f2',
				badgeColor: '#991b1b',
				icon: '✕',
				headline: 'Booking canceled',
				body: 'Unfortunately your booking has been canceled. Please see the details below.',
			};
		default:
			return {
				badge: 'Updated',
				badgeBg: '#f9fafb',
				badgeColor: '#374151',
				icon: '↻',
				headline: 'Booking status updated',
				body: 'Your booking status has been updated. Please see the details below.',
			};
	}
};

const formatKRW = (amount: number): string =>
	new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(amount);

export const getBookingStatusTemplate = (
	input: BookingStatusTemplateInput,
): { subject: string; text: string; html: string } => {
	const name      = input.recipientName || 'Customer';
	const meta      = getStatusMeta(input.bookingStatus);
	const refNumber = input.bookingId ? input.bookingId.slice(-8).toUpperCase() : '—';

	const priceRows =
		typeof input.quotedPrice === 'number' || typeof input.finalPrice === 'number'
			? `
				${typeof input.quotedPrice === 'number' ? `
				<tr>
					<td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px;width:140px">Quoted Price</td>
					<td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;font-weight:600">${formatKRW(input.quotedPrice)}</td>
				</tr>` : ''}
				${typeof input.finalPrice === 'number' ? `
				<tr>
					<td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px">Final Price</td>
					<td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;font-weight:700;color:#0052da">${formatKRW(input.finalPrice)}</td>
				</tr>` : ''}`
			: '';

	const cancelRow =
		input.bookingStatus === BookingStatus.CANCELED && input.canceledReason
			? `<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:16px 20px;margin-bottom:28px;">
					<p style="margin:0;font-size:14px;color:#991b1b;line-height:1.6;">
						<strong>Reason for cancellation:</strong><br/>${input.canceledReason}
					</p>
				</div>`
			: '';

	const completedNote =
		input.bookingStatus === BookingStatus.COMPLETED
			? `<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px 20px;margin-bottom:8px;">
					<p style="margin:0;font-size:14px;color:#166534;line-height:1.6;">
						We'd love to hear your feedback! Leave a review for the agent on NearHelp.
					</p>
				</div>`
			: '';

	const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Booking ${meta.badge} — NearHelp</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#0052da;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
              <div style="font-size:26px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">NearHelp</div>
              <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:4px;letter-spacing:0.08em;text-transform:uppercase;">House Service Company</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px;">

              <!-- Status badge -->
              <div style="text-align:center;margin-bottom:28px;">
                <span style="display:inline-block;background:${meta.badgeBg};color:${meta.badgeColor};font-size:13px;font-weight:800;padding:8px 20px;border-radius:999px;letter-spacing:0.06em;text-transform:uppercase;">
                  ${meta.icon} ${meta.badge}
                </span>
              </div>

              <!-- Greeting -->
              <p style="margin:0 0 8px;font-size:22px;font-weight:900;color:#111827;">${meta.headline}</p>
              <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.7;">
                Hello <strong>${name}</strong>, ${meta.body}
              </p>

              ${cancelRow}

              <!-- Service title card -->
              <div style="background:#f8faff;border:1px solid #dbeafe;border-radius:10px;padding:20px 24px;margin-bottom:28px;">
                <div style="font-size:12px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;">Service</div>
                <div style="font-size:18px;font-weight:900;color:#0052da;">${input.serviceTitle}</div>
              </div>

              <!-- Details table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px;width:140px">Date</td>
                  <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;font-weight:600">${input.bookingDate}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px">Time</td>
                  <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;font-weight:600">${input.bookingTime}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px">Address</td>
                  <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;font-weight:600">${input.bookingAddress}</td>
                </tr>
                ${priceRows}
                <tr>
                  <td style="padding:10px 0;color:#6b7280;font-size:14px">Reference #</td>
                  <td style="padding:10px 0;color:#111827;font-size:14px;font-weight:600;font-family:monospace;">${refNumber}</td>
                </tr>
              </table>

              ${completedNote}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#253041;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:15px;font-weight:800;color:#ffffff;">NearHelp</p>
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.5);">
                This is an automated message. Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

	const priceTextLines: string[] = [];
	if (typeof input.quotedPrice === 'number') priceTextLines.push(`Quoted Price:  ${formatKRW(input.quotedPrice)}`);
	if (typeof input.finalPrice === 'number')  priceTextLines.push(`Final Price:   ${formatKRW(input.finalPrice)}`);
	if (input.canceledReason) priceTextLines.push(`Reason:        ${input.canceledReason}`);

	const text = [
		`Hello ${name},`,
		'',
		meta.headline,
		meta.body,
		'',
		`Service:   ${input.serviceTitle}`,
		`Date:      ${input.bookingDate}`,
		`Time:      ${input.bookingTime}`,
		`Address:   ${input.bookingAddress}`,
		...priceTextLines,
		`Ref #:     ${refNumber}`,
		'',
		'NearHelp',
	].join('\n');

	return {
		subject: `[${meta.badge}] ${input.serviceTitle} — NearHelp`,
		text,
		html,
	};
};
