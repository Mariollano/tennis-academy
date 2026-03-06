import nodemailer from "nodemailer";

const gmailUser = process.env.EMAIL_USER;
const gmailPass = process.env.EMAIL_APP_PASSWORD;

function getTransporter() {
  if (!gmailUser || !gmailPass) {
    throw new Error("Email credentials not configured (EMAIL_USER / EMAIL_APP_PASSWORD)");
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });
}

export function isEmailConfigured(): boolean {
  return !!(gmailUser && gmailPass);
}

export interface BookingConfirmationData {
  toEmail: string;
  toName: string;
  programLabel: string;
  sessionDate?: string;   // e.g. "Saturday, March 8, 2026"
  sessionTime?: string;   // e.g. "9:00 AM – 10:00 AM"
  pricingOption?: string;
  bookingId: number;
}

export async function sendBookingConfirmation(data: BookingConfirmationData): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getTransporter();

    const dateLine = data.sessionDate
      ? `<tr><td style="padding:6px 0;color:#555;font-size:14px;"><strong>Date:</strong></td><td style="padding:6px 0;font-size:14px;">${data.sessionDate}</td></tr>`
      : "";
    const timeLine = data.sessionTime
      ? `<tr><td style="padding:6px 0;color:#555;font-size:14px;"><strong>Time:</strong></td><td style="padding:6px 0;font-size:14px;">${data.sessionTime}</td></tr>`
      : "";

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#1a3a8f;padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:1px;">RI TENNIS ACADEMY</h1>
            <p style="margin:6px 0 0;color:#a0b4e8;font-size:13px;">Coach Mario Llano</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 8px;color:#1a3a8f;font-size:20px;">Booking Confirmed! 🎾</h2>
            <p style="margin:0 0 24px;color:#444;font-size:15px;">
              Hi ${data.toName || "there"},<br><br>
              Your booking has been received and is pending confirmation from Coach Mario. 
              You'll hear from us shortly to finalize the details.
            </p>

            <!-- Booking Details -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9ff;border:1px solid #dde3f5;border-radius:6px;padding:16px 20px;margin-bottom:24px;">
              <tr>
                <td colspan="2" style="padding-bottom:10px;">
                  <strong style="color:#1a3a8f;font-size:15px;">Booking Summary</strong>
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#555;font-size:14px;width:130px;"><strong>Program:</strong></td>
                <td style="padding:6px 0;font-size:14px;">${data.programLabel}</td>
              </tr>
              ${dateLine}
              ${timeLine}
              <tr>
                <td style="padding:6px 0;color:#555;font-size:14px;"><strong>Booking #:</strong></td>
                <td style="padding:6px 0;font-size:14px;">#${data.bookingId}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#555;font-size:14px;"><strong>Status:</strong></td>
                <td style="padding:6px 0;font-size:14px;"><span style="color:#d97706;font-weight:bold;">Pending Confirmation</span></td>
              </tr>
            </table>

            <p style="margin:0 0 16px;color:#444;font-size:14px;">
              <strong>What happens next?</strong><br>
              Coach Mario will review your booking and reach out to confirm your spot and arrange payment. 
              If you have any questions in the meantime, feel free to contact us directly.
            </p>

            <!-- Contact -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee;padding-top:20px;margin-top:8px;">
              <tr>
                <td style="font-size:13px;color:#666;">
                  📧 <a href="mailto:ritennismario@gmail.com" style="color:#1a3a8f;">ritennismario@gmail.com</a><br>
                  📞 <a href="tel:4019655873" style="color:#1a3a8f;">401-965-5873</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f0f3ff;padding:16px 32px;text-align:center;border-top:1px solid #dde3f5;">
            <p style="margin:0;font-size:12px;color:#888;">
              RI Tennis Academy · Rhode Island's Premier Tennis Academy<br>
              This is an automated confirmation. Please do not reply to this email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const text = `
Hi ${data.toName || "there"},

Your booking has been received!

Program: ${data.programLabel}
${data.sessionDate ? `Date: ${data.sessionDate}` : ""}
${data.sessionTime ? `Time: ${data.sessionTime}` : ""}
Booking #: ${data.bookingId}
Status: Pending Confirmation

Coach Mario will reach out shortly to confirm your spot and arrange payment.

Questions? Email ritennismario@gmail.com or call 401-965-5873.

— RI Tennis Academy
`;

    await transporter.sendMail({
      from: `"RI Tennis Academy" <${gmailUser}>`,
      to: `"${data.toName}" <${data.toEmail}>`,
      subject: `Booking Received – ${data.programLabel} | RI Tennis Academy`,
      text: text.trim(),
      html,
    });

    console.log(`[Email] Confirmation sent to ${data.toEmail} for booking #${data.bookingId}`);
    return { success: true };
  } catch (err: any) {
    console.error(`[Email] Failed to send confirmation to ${data.toEmail}:`, err?.message || err);
    return { success: false, error: err?.message || "Unknown error" };
  }
}
