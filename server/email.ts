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
  if (isResendConfigured()) {
    const resend = new Resend(resendApiKey!);
    // tennispromario.com not yet verified in Resend (free plan = 1 domain).
    // Using verified getroger.biz domain. Switch to noreply@tennispromario.com
    // once tennispromario.com is added to Resend (requires plan upgrade or removing getroger.biz).
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
    const transporter = getGmailTransporter();
    await transporter.sendMail({
      from: `"RI Tennis Academy" <${gmailUser}>`,
      to: `"${opts.toName}" <${opts.to}>`,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    console.log(`[Email/Gmail] Sent "${opts.subject}" to ${opts.to}`);
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
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#0a1628 0%,#1a3a8f 100%);padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:2px;font-weight:900;">RI TENNIS ACADEMY</h1>
            <p style="margin:6px 0 0;color:#c4ff00;font-size:13px;letter-spacing:1px;">Coach Mario Llano · #DeleteFear</p>
          </td>
        </tr>
        <tr><td style="padding:32px;">${bodyHtml}</td></tr>
        <tr>
          <td style="background:#f0f3ff;padding:16px 32px;text-align:center;border-top:1px solid #dde3f5;">
            <p style="margin:0;font-size:12px;color:#888;">
              RI Tennis Academy · Rhode Island's Premier Tennis Academy<br>
              <a href="https://tennispromario.com" style="color:#1a3a8f;">tennispromario.com</a> · 401-965-5873<br>
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
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
        <tr>
          <td align="center">
            <a href="https://tennispromario.com/booking/private_lesson"
               style="display:inline-block;background:#1a3a8f;color:#ffffff;font-weight:bold;font-size:14px;padding:12px 28px;border-radius:6px;text-decoration:none;">
              Book Another Session →
            </a>
          </td>
        </tr>
      </table>
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
