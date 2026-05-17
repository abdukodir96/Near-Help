type BookingCreatedTemplateInput = {
	bookingId?: string;
	recipientName: string;
	serviceTitle: string;
	serviceCategory?: string;
	bookingDate: string;
	bookingTime: string;
	bookingAddress: string;
	bookingNote?: string;
};

export const getBookingCreatedTemplate = (
	input: BookingCreatedTemplateInput,
): { subject: string; text: string; html: string } => {
	const name        = input.recipientName || 'Customer';
	const refNumber   = input.bookingId ? input.bookingId.slice(-8).toUpperCase() : '—';
	const noteRow     = input.bookingNote
		? `<tr>
				<td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px;width:140px">Note</td>
				<td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;font-weight:600">${input.bookingNote}</td>
			</tr>`
		: '';
	const categoryRow = input.serviceCategory
		? `<tr>
				<td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px;width:140px">Category</td>
				<td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;font-weight:600">${input.serviceCategory}</td>
			</tr>`
		: '';

	const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Booking Received — NearHelp</title>
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
                <span style="display:inline-block;background:#ecfdf5;color:#065f46;font-size:13px;font-weight:800;padding:8px 20px;border-radius:999px;letter-spacing:0.06em;text-transform:uppercase;">
                  ✓ Booking Received
                </span>
              </div>

              <!-- Greeting -->
              <p style="margin:0 0 8px;font-size:22px;font-weight:900;color:#111827;">Hello, ${name}!</p>
              <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.7;">
                Your booking request has been successfully submitted. Our team will review it and confirm shortly.
              </p>

              <!-- Service title card -->
              <div style="background:#f8faff;border:1px solid #dbeafe;border-radius:10px;padding:20px 24px;margin-bottom:28px;">
                <div style="font-size:12px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;">Service</div>
                <div style="font-size:18px;font-weight:900;color:#0052da;">${input.serviceTitle}</div>
              </div>

              <!-- Details table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                ${categoryRow}
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
                ${noteRow}
                <tr>
                  <td style="padding:10px 0;color:#6b7280;font-size:14px">Reference #</td>
                  <td style="padding:10px 0;color:#111827;font-size:14px;font-weight:600;font-family:monospace;">${refNumber}</td>
                </tr>
              </table>

              <!-- Info box -->
              <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:16px 20px;margin-bottom:8px;">
                <p style="margin:0;font-size:14px;color:#92400e;line-height:1.6;">
                  <strong>What's next?</strong> The assigned agent will confirm your booking soon.
                  You will receive another email when your booking status is updated.
                </p>
              </div>

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

	const text = [
		`Hello ${name},`,
		'',
		'Your booking request has been received successfully.',
		'',
		`Service:   ${input.serviceTitle}`,
		input.serviceCategory ? `Category:  ${input.serviceCategory}` : '',
		`Date:      ${input.bookingDate}`,
		`Time:      ${input.bookingTime}`,
		`Address:   ${input.bookingAddress}`,
		input.bookingNote ? `Note:      ${input.bookingNote}` : '',
		`Ref #:     ${refNumber}`,
		'',
		'The assigned agent will confirm your booking soon.',
		'You will receive another email when your booking status is updated.',
		'',
		'NearHelp',
	].filter((line) => line !== '').join('\n');

	return {
		subject: `✓ Booking received — ${input.serviceTitle}`,
		text,
		html,
	};
};
