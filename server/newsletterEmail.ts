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

export interface NewsletterEmailData {
  toEmail: string;
  toName?: string;
  subject: string;
  headline?: string;
  bodyHtml: string;
  tennisTip?: string;
  mentalTip?: string;
  winnerSpotlight?: string;
  programScheduleHtml?: string;
}

export async function sendNewsletterEmail(data: NewsletterEmailData): Promise<void> {
  const transporter = getTransporter();

  const tennisTipSection = data.tennisTip ? `
    <tr><td style="padding:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#e8f4fd;border-left:4px solid #1a3a8f;border-radius:0 6px 6px 0;padding:16px 20px;">
        <tr><td>
          <p style="margin:0 0 6px;font-size:13px;font-weight:bold;color:#1a3a8f;text-transform:uppercase;letter-spacing:1px;">🎾 Tennis Tip of the Week</p>
          <p style="margin:0;font-size:14px;color:#333;line-height:1.6;">${data.tennisTip}</p>
        </td></tr>
      </table>
    </td></tr>` : "";

  const mentalTipSection = data.mentalTip ? `
    <tr><td style="padding:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9f0;border-left:4px solid #22c55e;border-radius:0 6px 6px 0;padding:16px 20px;">
        <tr><td>
          <p style="margin:0 0 6px;font-size:13px;font-weight:bold;color:#166534;text-transform:uppercase;letter-spacing:1px;">🧠 Mental Tip of the Week</p>
          <p style="margin:0;font-size:14px;color:#333;line-height:1.6;">${data.mentalTip}</p>
        </td></tr>
      </table>
    </td></tr>` : "";

  const winnerSection = data.winnerSpotlight ? `
    <tr><td style="padding:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:2px solid #f59e0b;border-radius:8px;padding:16px 20px;">
        <tr><td>
          <p style="margin:0 0 6px;font-size:13px;font-weight:bold;color:#92400e;text-transform:uppercase;letter-spacing:1px;">🏆 Winner Spotlight</p>
          <p style="margin:0;font-size:14px;color:#333;line-height:1.6;">${data.winnerSpotlight}</p>
        </td></tr>
      </table>
    </td></tr>` : "";

  const scheduleSection = data.programScheduleHtml ? `
    <tr><td style="padding:0 0 24px;">
      <p style="margin:0 0 12px;font-size:16px;font-weight:bold;color:#1a3a8f;">📅 Programs & Schedule</p>
      ${data.programScheduleHtml}
    </td></tr>` : "";

  const unsubscribeNote = `
    <tr><td style="padding:16px 0 0;border-top:1px solid #eee;text-align:center;">
      <p style="margin:0;font-size:11px;color:#aaa;">
        You're receiving this because you're a student or subscriber of RI Tennis Academy.<br>
        To unsubscribe, reply to this email with "Unsubscribe" in the subject line.
      </p>
    </td></tr>`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr><td align="center">
      <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.10);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a3a8f 0%,#0f2460 100%);padding:32px;text-align:center;">
            <h1 style="margin:0 0 4px;color:#ffffff;font-size:24px;letter-spacing:2px;font-weight:900;">RI TENNIS ACADEMY</h1>
            <p style="margin:0 0 16px;color:#a0b4e8;font-size:13px;">Coach Mario Llano · Rhode Island's Premier Tennis Academy</p>
            ${data.headline ? `<div style="background:rgba(255,255,255,0.12);border-radius:8px;padding:14px 20px;display:inline-block;">
              <p style="margin:0;color:#ffffff;font-size:18px;font-weight:bold;line-height:1.4;">${data.headline}</p>
            </div>` : ""}
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <table width="100%" cellpadding="0" cellspacing="0">

              <!-- Intro body -->
              <tr><td style="padding:0 0 24px;">
                <div style="font-size:15px;color:#444;line-height:1.7;">${data.bodyHtml}</div>
              </td></tr>

              ${scheduleSection}
              ${tennisTipSection}
              ${mentalTipSection}
              ${winnerSection}

              <!-- CTA -->
              <tr><td style="padding:8px 0 24px;text-align:center;">
                <a href="https://tennispro-kzzfscru.manus.space/programs" style="display:inline-block;background:#1a3a8f;color:#ffffff;font-size:15px;font-weight:bold;padding:14px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.5px;">Book Your Session →</a>
              </tr></td>

              <!-- Contact -->
              <tr><td style="padding:0 0 8px;border-top:1px solid #eee;padding-top:20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:13px;color:#666;">
                      📧 <a href="mailto:ritennismario@gmail.com" style="color:#1a3a8f;">ritennismario@gmail.com</a><br>
                      📞 <a href="tel:4019655873" style="color:#1a3a8f;">401-965-5873</a>
                    </td>
                    <td style="text-align:right;font-size:12px;color:#888;">
                      Follow us:<br>
                      <a href="https://www.instagram.com/deletefearwithMario" style="color:#1a3a8f;">Instagram</a> ·
                      <a href="https://www.youtube.com/@RiTennisMario" style="color:#1a3a8f;">YouTube</a> ·
                      <a href="https://www.tiktok.com/@deletefear" style="color:#1a3a8f;">TikTok</a>
                    </td>
                  </tr>
                </table>
              </td></tr>

              ${unsubscribeNote}

            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0f2460;padding:16px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#a0b4e8;">
              © ${new Date().getFullYear()} RI Tennis Academy · Rhode Island
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"Coach Mario – RI Tennis Academy" <${gmailUser}>`,
    to: data.toName ? `"${data.toName}" <${data.toEmail}>` : data.toEmail,
    subject: data.subject,
    html,
  });
}
