/**
 * Email service — supports two providers:
 *  1. Resend (primary, when RESEND_API_KEY is set)
 *  2. Gmail / nodemailer (fallback, when EMAIL_USER + EMAIL_APP_PASSWORD are set)
 *
 * Resend gives better deliverability, open-rate tracking, and branded sending.
 * Gmail is the existing fallback so nothing breaks if Resend is not configured.
 */
import nodemailer from "nodemailer";
import { Resend } from "resend";

// ─── Provider detection ────────────────────────────────────────────────────
const resendApiKey = process.env.RESEND_API_KEY;
const gmailUser = process.env.EMAIL_USER;
const gmailPass = process.env.EMAIL_APP_PASSWORD;

export function isEmailConfigured(): boolean {
  return !!(resendApiKey || (gmailUser && gmailPass));
}

function isResendConfigured(): boolean {
  return !!resendApiKey;
}

// ─── Nodemailer (Gmail) transporter ───────────────────────────────────────
function getGmailTransporter() {
  if (!gmailUser || !gmailPass) {
    throw new Error("Email credentials not configured (EMAIL_USER / EMAIL_APP_PASSWORD)");
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });
}

// ─── Unified send function ─────────────────────────────────────────────────
export async function sendEmail(opts: {
  to: string;
  toName: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  // Prefer Gmail (ritennismario@gmail.com) over Resend because the Resend account
  // is verified on getroger.biz, not tennispromario.com — emails from getroger.biz
  // are more likely to land in spam for external recipients.
  // Switch back to Resend once tennispromario.com is verified in the Resend dashboard.
  if (gmailUser && gmailPass) {
    const transporter = getGmailTransporter();
    await transporter.sendMail({
      from: `"RI Tennis Academy" <${gmailUser}>`,
      to: `"${opts.toName}" <${opts.to}>`,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    console.log(`[Email/Gmail] Sent "${opts.subject}" to ${opts.to}`);
  } else if (isResendConfigured()) {
    const resend = new Resend(resendApiKey!);
    const fromAddress = "RI Tennis Academy <noreply@getroger.biz>";
    await resend.emails.send({
      from: fromAddress,
      to: `${opts.toName} <${opts.to}>`,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    console.log(`[Email/Resend] Sent "${opts.subject}" to ${opts.to}`);
  } else {
    console.warn(`[Email] No email provider configured — skipping send to ${opts.to}`);
  }
}

// ─── Shared types ──────────────────────────────────────────────────────────
export interface BookingConfirmationData {
  toEmail: string;
  toName: string;
  programLabel: string;
  sessionDate?: string;
  sessionTime?: string;
  pricingOption?: string;
  bookingId: number;
}

// ─── HTML helpers ──────────────────────────────────────────────────────────
function buildEmailShell(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A1520;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A1520;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#0D1B2A;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.4);">
        <!-- Masthead with Logo -->
        <tr><td style="background:#0D1B2A;padding:18px 28px;border-bottom:1px solid #253545;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:middle;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;padding-right:12px;">
                      <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663342968318/kzZFsCRUb4iWMZR8LEwAKz/ri-tennis-logo_17005d5c.png" alt="RI Tennis Academy" width="60" height="60" style="display:block;border-radius:50%;" />
                    </td>
                    <td style="vertical-align:middle;">
                      <div style="font-size:18px;font-weight:900;letter-spacing:2px;color:#ffffff;line-height:1;">RI <span style="color:#22c55e;">TENNIS</span> ACADEMY</div>
                      <div style="font-size:9px;font-weight:500;letter-spacing:2px;text-transform:uppercase;color:#8A9BAD;margin-top:3px;">Coach Mario Llano · Rhode Island</div>
                    </td>
                  </tr>
                </table>
              </td>
              <td style="text-align:right;vertical-align:middle;">
                <div style="font-size:9px;letter-spacing:2px;color:#22c55e;font-style:italic;">#DeleteFear</div>
              </td>
            </tr>
          </table>
        </td></tr>
        <!-- Banner Photo -->
        <tr>
          <td style="padding:0;">
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663342968318/kzZFsCRUb4iWMZR8LEwAKz/email-header-banner_4eee588e.jpg"
              alt="RI Tennis Academy – Coach Mario Llano"
              width="600"
              style="display:block;width:100%;max-width:600px;height:auto;"
            />
          </td>
        </tr>
        <tr><td style="padding:28px 32px;background:#ffffff;">${bodyHtml}</td></tr>
        <tr>
          <td style="background:#0D1B2A;padding:18px 28px;text-align:center;border-top:1px solid #253545;">
            <p style="margin:0;font-size:11px;color:#8A9BAD;line-height:1.8;">
              RI Tennis Academy · Rhode Island's Premier Tennis Academy<br>
              <a href="https://tennispromario.com" style="color:#22c55e;">tennispromario.com</a> · <a href="tel:4019655873" style="color:#8A9BAD;">401-965-5873</a><br>
              This is an automated message. Please do not reply to this email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildSummaryTable(data: BookingConfirmationData, statusHtml: string): string {
  const dateLine = data.sessionDate
    ? `<tr><td style="padding:6px 0;color:#555;font-size:14px;width:130px;"><strong>Date:</strong></td><td style="padding:6px 0;font-size:14px;">${data.sessionDate}</td></tr>`
    : "";
  const timeLine = data.sessionTime
    ? `<tr><td style="padding:6px 0;color:#555;font-size:14px;"><strong>Time:</strong></td><td style="padding:6px 0;font-size:14px;">${data.sessionTime}</td></tr>`
    : "";
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9ff;border:1px solid #dde3f5;border-radius:6px;padding:16px 20px;margin-bottom:24px;">
      <tr><td colspan="2" style="padding-bottom:10px;"><strong style="color:#1a3a8f;font-size:15px;">Booking Summary</strong></td></tr>
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
        <td style="padding:6px 0;font-size:14px;">${statusHtml}</td>
      </tr>
    </table>`;
}

const contactBlock = `
  <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee;padding-top:20px;margin-top:8px;">
    <tr>
      <td style="font-size:13px;color:#666;">
        📧 <a href="mailto:ritennismario@gmail.com" style="color:#1a3a8f;">ritennismario@gmail.com</a><br>
        📞 <a href="tel:4019655873" style="color:#1a3a8f;">401-965-5873</a><br>
        🌐 <a href="https://tennispromario.com" style="color:#1a3a8f;">tennispromario.com</a>
      </td>
    </tr>
  </table>`;

// ─── Booking RECEIVED (pending) ────────────────────────────────────────────
export async function sendBookingConfirmation(data: BookingConfirmationData): Promise<{ success: boolean; error?: string }> {
  try {
    const summaryTable = buildSummaryTable(data, `<span style="color:#d97706;font-weight:bold;">⏳ Pending Confirmation</span>`);
    const bodyHtml = `
      <h2 style="margin:0 0 8px;color:#1a3a8f;font-size:20px;">Booking Request Received 🎾</h2>
      <p style="margin:0 0 24px;color:#444;font-size:15px;">
        Hi ${data.toName || "there"},<br><br>
        Your booking request has been received and is <strong>pending confirmation</strong> from Coach Mario.
        You will receive a separate email once your spot is confirmed.
      </p>
      ${summaryTable}
      <p style="margin:0 0 16px;color:#444;font-size:14px;">
        <strong>What happens next?</strong><br>
        Coach Mario will review your request and confirm your spot shortly.
        If you have any questions in the meantime, feel free to contact us directly.
      </p>
      ${contactBlock}`;

    const text = `Hi ${data.toName || "there"},\n\nYour booking request has been received and is pending confirmation from Coach Mario.\n\nProgram: ${data.programLabel}\n${data.sessionDate ? `Date: ${data.sessionDate}\n` : ""}${data.sessionTime ? `Time: ${data.sessionTime}\n` : ""}Booking #: ${data.bookingId}\nStatus: Pending Confirmation\n\nYou will receive a separate email once your spot is confirmed.\n\nQuestions? Email ritennismario@gmail.com or call 401-965-5873.\n\n— RI Tennis Academy`;

    await sendEmail({
      to: data.toEmail,
      toName: data.toName,
      subject: `Booking Request Received – ${data.programLabel} | RI Tennis Academy`,
      html: buildEmailShell(bodyHtml),
      text,
    });

    console.log(`[Email] Pending confirmation sent to ${data.toEmail} for booking #${data.bookingId}`);
    return { success: true };
  } catch (err: any) {
    console.error(`[Email] Failed to send pending confirmation to ${data.toEmail}:`, err?.message || err);
    return { success: false, error: err?.message || "Unknown error" };
  }
}

// ─── Booking CANCELLED (admin cancelled) ─────────────────────────────────
export async function sendBookingCancelled(data: BookingConfirmationData): Promise<{ success: boolean; error?: string }> {
  try {
    const summaryTable = buildSummaryTable(data, `<span style="color:#dc2626;font-weight:bold;">❌ Cancelled</span>`);
    const bodyHtml = `
      <h2 style="margin:0 0 8px;color:#1a3a8f;font-size:20px;">Booking Cancelled 🎾</h2>
      <p style="margin:0 0 24px;color:#444;font-size:15px;">
        Hi ${data.toName || "there"},<br><br>
        Your booking has been <strong>cancelled</strong> by Coach Mario. We're sorry for any inconvenience.
        If you'd like to reschedule or have any questions, please reach out directly.
      </p>
      ${summaryTable}
      <p style="margin:0 0 16px;color:#444;font-size:14px;">
        We hope to see you back on the court soon! Feel free to book another session at any time.
      </p>
      ${contactBlock}`;

    const text = `Hi ${data.toName || "there"},\n\nYour booking has been cancelled by Coach Mario.\n\nProgram: ${data.programLabel}\n${data.sessionDate ? `Date: ${data.sessionDate}\n` : ""}${data.sessionTime ? `Time: ${data.sessionTime}\n` : ""}Booking #: ${data.bookingId}\nStatus: Cancelled\n\nWe hope to see you back on the court soon! Questions? Email ritennismario@gmail.com or call 401-965-5873.\n\n— RI Tennis Academy`;

    await sendEmail({
      to: data.toEmail,
      toName: data.toName,
      subject: `Booking Cancelled – ${data.programLabel} | RI Tennis Academy`,
      html: buildEmailShell(bodyHtml),
      text,
    });

    console.log(`[Email] Cancellation email sent to ${data.toEmail} for booking #${data.bookingId}`);
    return { success: true };
  } catch (err: any) {
    console.error(`[Email] Failed to send cancellation email to ${data.toEmail}:`, err?.message || err);
    return { success: false, error: err?.message || "Unknown error" };
  }
}

// ─── Booking REMINDER (day-before) ────────────────────────────────────────
export async function sendBookingReminder(data: BookingConfirmationData): Promise<{ success: boolean; error?: string }> {
  try {
    const summaryTable = buildSummaryTable(data, `<span style="color:#1a3a8f;font-weight:bold;">🔔 Reminder</span>`);
    const bodyHtml = `
      <h2 style="margin:0 0 8px;color:#1a3a8f;font-size:20px;">Lesson Reminder – See You Tomorrow! 🎾</h2>
      <p style="margin:0 0 24px;color:#444;font-size:15px;">
        Hi ${data.toName || "there"},<br><br>
        Just a friendly reminder that your lesson is <strong>tomorrow</strong>! Please arrive 5–10 minutes early.
      </p>
      ${summaryTable}
      <p style="margin:0 0 16px;color:#444;font-size:14px;">
        If you need to reschedule or have any questions, please contact Coach Mario as soon as possible.
      </p>
      ${contactBlock}`;

    const text = `Hi ${data.toName || "there"},\n\nJust a friendly reminder that your lesson is tomorrow!\n\nProgram: ${data.programLabel}\n${data.sessionDate ? `Date: ${data.sessionDate}\n` : ""}${data.sessionTime ? `Time: ${data.sessionTime}\n` : ""}Booking #: ${data.bookingId}\n\nPlease arrive 5–10 minutes early. Questions? Email ritennismario@gmail.com or call 401-965-5873.\n\n— RI Tennis Academy`;

    await sendEmail({
      to: data.toEmail,
      toName: data.toName,
      subject: `Reminder: Your Lesson is Tomorrow – ${data.programLabel} | RI Tennis Academy`,
      html: buildEmailShell(bodyHtml),
      text,
    });

    console.log(`[Email] Reminder email sent to ${data.toEmail} for booking #${data.bookingId}`);
    return { success: true };
  } catch (err: any) {
    console.error(`[Email] Failed to send reminder email to ${data.toEmail}:`, err?.message || err);
    return { success: false, error: err?.message || "Unknown error" };
  }
}

// ─── Booking RESERVED (cash or check at lesson) ─────────────────────────────
export async function sendBookingReservedCash(data: BookingConfirmationData & { paymentMethod: "cash" | "check" }): Promise<{ success: boolean; error?: string }> {
  try {
    const payLabel = data.paymentMethod === "check" ? "check" : "cash";
    const summaryTable = buildSummaryTable(data, `<span style="color:#16a34a;font-weight:bold;">✅ Spot Reserved</span>`);
    const bodyHtml = `
      <h2 style="margin:0 0 8px;color:#1a3a8f;font-size:20px;">Your Spot is Reserved! 🎾</h2>
      <p style="margin:0 0 24px;color:#444;font-size:15px;">
        Hi ${data.toName || "there"},<br><br>
        Your spot has been <strong>reserved</strong> with RI Tennis Academy. Please bring <strong>${payLabel}</strong> to the lesson to complete your payment.
      </p>
      ${summaryTable}
      <div style="background:#fefce8;border:1px solid #fde68a;border-radius:6px;padding:14px 18px;margin-bottom:20px;">
        <p style="margin:0;font-size:14px;color:#92400e;">
          <strong>💰 Payment Due at Lesson:</strong> Please bring ${payLabel} for the full amount when you arrive. Your spot is held for you.
        </p>
      </div>
      <p style="margin:0 0 16px;color:#444;font-size:14px;">
        Please arrive 5–10 minutes early and bring your racquet and water. If you need to cancel or reschedule,
        please contact Coach Mario at least 24 hours in advance.
      </p>
      ${contactBlock}`;

    const text = `Hi ${data.toName || "there"},\n\nYour spot has been reserved with RI Tennis Academy!\n\nProgram: ${data.programLabel}\n${data.sessionDate ? `Date: ${data.sessionDate}\n` : ""}${data.sessionTime ? `Time: ${data.sessionTime}\n` : ""}Booking #: ${data.bookingId}\nStatus: Spot Reserved\nPayment: ${payLabel} due at lesson\n\nPlease arrive 5–10 minutes early. To cancel or reschedule, contact Coach Mario at least 24 hours in advance.\nQuestions? Email ritennismario@gmail.com or call 401-965-5873.\n\n— RI Tennis Academy`;

    await sendEmail({
      to: data.toEmail,
      toName: data.toName,
      subject: `✅ Spot Reserved – ${data.programLabel} | RI Tennis Academy`,
      html: buildEmailShell(bodyHtml),
      text,
    });

    console.log(`[Email] Cash/check reservation email sent to ${data.toEmail} for booking #${data.bookingId}`);
    return { success: true };
  } catch (err: any) {
    console.error(`[Email] Failed to send cash reservation email to ${data.toEmail}:`, err?.message || err);
    return { success: false, error: err?.message || "Unknown error" };
  }
}

// ─── Booking CONFIRMED (admin approved or Stripe paid) ────────────────────
export async function sendBookingConfirmed(data: BookingConfirmationData): Promise<{ success: boolean; error?: string }> {
  try {
    const summaryTable = buildSummaryTable(data, `<span style="color:#16a34a;font-weight:bold;">✅ Confirmed</span>`);
    const bodyHtml = `
      <h2 style="margin:0 0 8px;color:#1a3a8f;font-size:20px;">Your Lesson is Confirmed! 🎾</h2>
      <p style="margin:0 0 24px;color:#444;font-size:15px;">
        Hi ${data.toName || "there"},<br><br>
        Great news — Coach Mario has confirmed your booking. We look forward to seeing you on the court!
      </p>
      ${summaryTable}
      <p style="margin:0 0 16px;color:#444;font-size:14px;">
        Please arrive 5–10 minutes early and bring your racquet and water. If you need to reschedule or have any questions,
        contact Coach Mario directly.
      </p>
      ${contactBlock}`;

    const text = `Hi ${data.toName || "there"},\n\nGreat news — Coach Mario has confirmed your booking!\n\nProgram: ${data.programLabel}\n${data.sessionDate ? `Date: ${data.sessionDate}\n` : ""}${data.sessionTime ? `Time: ${data.sessionTime}\n` : ""}Booking #: ${data.bookingId}\nStatus: Confirmed\n\nPlease arrive 5–10 minutes early. Questions? Email ritennismario@gmail.com or call 401-965-5873.\n\n— RI Tennis Academy`;

    await sendEmail({
      to: data.toEmail,
      toName: data.toName,
      subject: `✅ Your Lesson is Confirmed – ${data.programLabel} | RI Tennis Academy`,
      html: buildEmailShell(bodyHtml),
      text,
    });

    console.log(`[Email] Confirmed email sent to ${data.toEmail} for booking #${data.bookingId}`);
    return { success: true };
  } catch (err: any) {
    console.error(`[Email] Failed to send confirmed email to ${data.toEmail}:`, err?.message || err);
    return { success: false, error: err?.message || "Unknown error" };
  }
}

// ─── Owner: new booking alert ──────────────────────────────────────────────
export interface OwnerBookingAlertData {
  studentName: string;
  studentEmail: string;
  studentPhone?: string | null;
  programLabel: string;
  sessionDate?: string;
  sessionTime?: string;
  paymentMethod: string;
  bookingId: number;
}

export async function sendOwnerNewBookingAlert(data: OwnerBookingAlertData): Promise<void> {
  const ownerEmail = process.env.EMAIL_USER;
  if (!ownerEmail || !isEmailConfigured()) return;

  const paymentBadge = data.paymentMethod === "stripe"
    ? "💳 Paid by Card"
    : data.paymentMethod === "cash"
    ? "💵 Cash Due at Lesson"
    : "📝 Check Due at Lesson";

  const bodyHtml = `
    <div style="background:#1a2744;padding:20px 24px;border-radius:8px;margin-bottom:24px;">
      <h2 style="color:#c8f135;margin:0 0 4px;">🎾 New Booking Alert</h2>
      <p style="color:#a0aec0;margin:0;font-size:14px;">A student just reserved a session</p>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:15px;">
      <tr><td style="padding:10px 0;color:#718096;width:140px;">Student</td><td style="padding:10px 0;font-weight:600;">${data.studentName}</td></tr>
      <tr style="border-top:1px solid #e2e8f0;"><td style="padding:10px 0;color:#718096;">Email</td><td style="padding:10px 0;">${data.studentEmail}</td></tr>
      ${data.studentPhone ? `<tr style="border-top:1px solid #e2e8f0;"><td style="padding:10px 0;color:#718096;">Phone</td><td style="padding:10px 0;">${data.studentPhone}</td></tr>` : ""}
      <tr style="border-top:1px solid #e2e8f0;"><td style="padding:10px 0;color:#718096;">Program</td><td style="padding:10px 0;font-weight:600;">${data.programLabel}</td></tr>
      ${data.sessionDate ? `<tr style="border-top:1px solid #e2e8f0;"><td style="padding:10px 0;color:#718096;">Date</td><td style="padding:10px 0;">${data.sessionDate}</td></tr>` : ""}
      ${data.sessionTime ? `<tr style="border-top:1px solid #e2e8f0;"><td style="padding:10px 0;color:#718096;">Time</td><td style="padding:10px 0;">${data.sessionTime}</td></tr>` : ""}
      <tr style="border-top:1px solid #e2e8f0;"><td style="padding:10px 0;color:#718096;">Payment</td><td style="padding:10px 0;">${paymentBadge}</td></tr>
      <tr style="border-top:1px solid #e2e8f0;"><td style="padding:10px 0;color:#718096;">Booking #</td><td style="padding:10px 0;color:#718096;">#${data.bookingId}</td></tr>
    </table>
    <div style="margin-top:24px;padding:16px;background:#f0fff4;border-left:4px solid #48bb78;border-radius:4px;">
      <p style="margin:0;color:#276749;font-size:14px;">Go to <a href="https://www.tennispromario.com/admin" style="color:#276749;font-weight:600;">Admin Dashboard</a> to view and manage this booking.</p>
    </div>
  `;

  const text = `New Booking Alert!\n\nStudent: ${data.studentName}\nEmail: ${data.studentEmail}\n${data.studentPhone ? `Phone: ${data.studentPhone}\n` : ""}Program: ${data.programLabel}\n${data.sessionDate ? `Date: ${data.sessionDate}\n` : ""}${data.sessionTime ? `Time: ${data.sessionTime}\n` : ""}Payment: ${data.paymentMethod}\nBooking #: ${data.bookingId}\n\nManage at: https://www.tennispromario.com/admin`;

  try {
    await sendEmail({
      to: ownerEmail,
      toName: "Coach Mario",
      subject: `🎾 New Booking: ${data.studentName} – ${data.programLabel}`,
      html: buildEmailShell(bodyHtml),
      text,
    });
    console.log(`[Email] Owner alert sent for booking #${data.bookingId}`);
  } catch (err: any) {
    console.error(`[Email] Failed to send owner alert for booking #${data.bookingId}:`, err?.message || err);
  }
}
