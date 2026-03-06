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

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export async function sendNewsletterEmail(data: NewsletterEmailData): Promise<void> {
  const transporter = getTransporter();
  const html = buildNewsletterHtml(data);

  await transporter.sendMail({
    from: `"Coach Mario – RI Tennis Academy" <${gmailUser}>`,
    to: data.toName ? `"${data.toName}" <${data.toEmail}>` : data.toEmail,
    subject: data.subject,
    html,
  });
}

export function buildNewsletterHtml(data: NewsletterEmailData): string {
  const date = formatDate();

  // ── Winner Spotlight column (right side of top section) ──────────────────
  const winnerCol = data.winnerSpotlight
    ? `<td width="38%" valign="top" style="padding-left:20px;border-left:3px solid #1a3a8f;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="background:#1a3a8f;padding:6px 12px;border-radius:4px 4px 0 0;">
            <p style="margin:0;font-size:11px;font-weight:bold;color:#ccff00;text-transform:uppercase;letter-spacing:2px;">🏆 Winner Spotlight</p>
          </td></tr>
          <tr><td style="background:#f0f4ff;padding:14px;border-radius:0 0 4px 4px;border:1px solid #dde4f5;border-top:none;">
            <p style="margin:0;font-size:13px;color:#222;line-height:1.65;">${data.winnerSpotlight}</p>
          </td></tr>
        </table>
      </td>`
    : `<td width="38%" valign="top" style="padding-left:20px;border-left:3px solid #1a3a8f;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="background:#1a3a8f;padding:6px 12px;border-radius:4px 4px 0 0;">
            <p style="margin:0;font-size:11px;font-weight:bold;color:#ccff00;text-transform:uppercase;letter-spacing:2px;">📅 Quick Links</p>
          </td></tr>
          <tr><td style="background:#f0f4ff;padding:14px;border-radius:0 0 4px 4px;border:1px solid #dde4f5;border-top:none;">
            <p style="margin:0 0 8px;font-size:13px;color:#1a3a8f;font-weight:bold;">Book a Session</p>
            <p style="margin:0 0 6px;font-size:12px;color:#444;">→ <a href="https://tennispro-kzzfscru.manus.space/programs" style="color:#1a3a8f;">Private Lessons</a></p>
            <p style="margin:0 0 6px;font-size:12px;color:#444;">→ <a href="https://tennispro-kzzfscru.manus.space/programs" style="color:#1a3a8f;">105 Game Clinic</a></p>
            <p style="margin:0 0 6px;font-size:12px;color:#444;">→ <a href="https://tennispro-kzzfscru.manus.space/programs" style="color:#1a3a8f;">Junior Programs</a></p>
            <p style="margin:0;font-size:12px;color:#444;">→ <a href="https://tennispro-kzzfscru.manus.space/programs" style="color:#1a3a8f;">Summer Camp</a></p>
          </td></tr>
        </table>
      </td>`;

  // ── Tennis Tip card ───────────────────────────────────────────────────────
  const tennisTipCard = data.tennisTip
    ? `<td width="48%" valign="top" style="padding-right:10px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:6px;overflow:hidden;">
          <tr><td style="background:#1a3a8f;padding:8px 14px;">
            <p style="margin:0;font-size:11px;font-weight:bold;color:#ccff00;text-transform:uppercase;letter-spacing:2px;">🎾 Tennis Tip of the Week</p>
          </td></tr>
          <tr><td style="background:#f9fbff;padding:14px;border:1px solid #dde4f5;border-top:none;border-radius:0 0 6px 6px;">
            <p style="margin:0;font-size:13px;color:#333;line-height:1.65;">${data.tennisTip}</p>
          </td></tr>
        </table>
      </td>`
    : `<td width="48%" valign="top" style="padding-right:10px;"></td>`;

  // ── Mental Tip card ───────────────────────────────────────────────────────
  const mentalTipCard = data.mentalTip
    ? `<td width="48%" valign="top" style="padding-left:10px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:6px;overflow:hidden;">
          <tr><td style="background:#0f2460;padding:8px 14px;">
            <p style="margin:0;font-size:11px;font-weight:bold;color:#ccff00;text-transform:uppercase;letter-spacing:2px;">🧠 Delete Fear Tip</p>
          </td></tr>
          <tr><td style="background:#f5f7ff;padding:14px;border:1px solid #dde4f5;border-top:none;border-radius:0 0 6px 6px;">
            <p style="margin:0;font-size:13px;color:#333;line-height:1.65;">${data.mentalTip}</p>
          </td></tr>
        </table>
      </td>`
    : `<td width="48%" valign="top" style="padding-left:10px;"></td>`;

  // ── Program schedule section ──────────────────────────────────────────────
  const scheduleSection = data.programScheduleHtml
    ? `<!-- Schedule Section -->
      <tr><td style="padding:0 0 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:6px;overflow:hidden;">
          <tr><td style="background:#ccff00;padding:8px 16px;">
            <p style="margin:0;font-size:12px;font-weight:bold;color:#0f2460;text-transform:uppercase;letter-spacing:2px;">📋 Programs, Schedule &amp; Pricing</p>
          </td></tr>
          <tr><td style="padding:0;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 6px 6px;overflow:hidden;">
            ${data.programScheduleHtml}
          </td></tr>
        </table>
      </td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${data.subject}</title>
</head>
<body style="margin:0;padding:0;background:#e8eaf0;font-family:Georgia,'Times New Roman',serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#e8eaf0;padding:24px 0;">
<tr><td align="center">

  <!-- Outer wrapper -->
  <table width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #c8cdd8;box-shadow:0 4px 20px rgba(0,0,0,0.12);">

    <!-- ═══ TOP BAR ═══ -->
    <tr>
      <td style="background:#0f2460;padding:8px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-family:Arial,sans-serif;font-size:11px;color:#a0b4e8;">${date}</td>
            <td style="text-align:right;font-family:Arial,sans-serif;font-size:11px;color:#a0b4e8;">tennispro-kzzfscru.manus.space</td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ═══ MASTHEAD ═══ -->
    <tr>
      <td style="padding:20px 24px 0;border-bottom:4px solid #1a3a8f;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td valign="middle" width="60%">
              <!-- Academy name small -->
              <p style="margin:0 0 2px;font-family:Arial,sans-serif;font-size:10px;font-weight:bold;color:#1a3a8f;text-transform:uppercase;letter-spacing:3px;">RI Tennis Academy</p>
              <!-- Big NEWSLETTER word -->
              <h1 style="margin:0;font-family:Arial,sans-serif;font-size:52px;font-weight:900;color:#0f2460;letter-spacing:-1px;line-height:1;">NEWS<span style="color:#1a3a8f;">LETTER</span></h1>
              <p style="margin:4px 0 0;font-family:Arial,sans-serif;font-size:11px;color:#666;letter-spacing:1px;text-transform:uppercase;">Coach Mario Llano · Rhode Island's Premier Tennis Academy</p>
            </td>
            <td valign="middle" width="40%" style="text-align:right;">
              <!-- Tennis ball accent -->
              <div style="display:inline-block;background:#ccff00;border-radius:50%;width:72px;height:72px;text-align:center;line-height:72px;font-size:36px;">🎾</div>
            </td>
          </tr>
          <!-- Thin rule under masthead -->
          <tr><td colspan="2" style="padding:10px 0 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#1a3a8f;height:3px;width:60%;"></td>
                <td style="background:#ccff00;height:3px;width:20%;"></td>
                <td style="background:#0f2460;height:3px;width:20%;"></td>
              </tr>
            </table>
          </td></tr>
        </table>
      </td>
    </tr>

    <!-- ═══ HEADLINE BANNER ═══ -->
    ${data.headline ? `<tr>
      <td style="background:#1a3a8f;padding:14px 24px;">
        <p style="margin:0;font-family:Arial,sans-serif;font-size:17px;font-weight:bold;color:#ffffff;text-align:center;letter-spacing:0.5px;">${data.headline}</p>
      </td>
    </tr>` : ""}

    <!-- ═══ MAIN CONTENT ═══ -->
    <tr>
      <td style="padding:24px;">
        <table width="100%" cellpadding="0" cellspacing="0">

          <!-- TWO-COLUMN: Body text (left) + Winner/Links (right) -->
          <tr>
            <td width="58%" valign="top" style="padding-right:20px;">
              <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:10px;font-weight:bold;color:#1a3a8f;text-transform:uppercase;letter-spacing:2px;border-bottom:2px solid #ccff00;padding-bottom:4px;display:inline-block;">From Coach Mario</p>
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:14px;color:#222;line-height:1.75;margin-top:10px;">${data.bodyHtml}</div>
            </td>
            ${winnerCol}
          </tr>

          <!-- Divider -->
          <tr><td colspan="2" style="padding:20px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#e5e7eb;height:1px;"></td>
              </tr>
            </table>
          </td></tr>

          <!-- TIPS ROW (two columns) -->
          <tr>
            ${tennisTipCard}
            ${mentalTipCard}
          </tr>

          <!-- Divider before schedule -->
          ${data.programScheduleHtml ? `<tr><td colspan="2" style="padding:20px 0 16px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#e5e7eb;height:1px;"></td>
              </tr>
            </table>
          </td></tr>` : ""}

          ${scheduleSection}

          <!-- CTA BUTTON -->
          <tr><td colspan="2" style="padding:8px 0 20px;text-align:center;">
            <a href="https://tennispro-kzzfscru.manus.space/programs"
               style="display:inline-block;background:#ccff00;color:#0f2460;font-family:Arial,sans-serif;font-size:14px;font-weight:900;padding:14px 40px;border-radius:4px;text-decoration:none;letter-spacing:1px;text-transform:uppercase;border:2px solid #0f2460;">
              Book Your Session Now →
            </a>
          </td></tr>

          <!-- CONTACT ROW -->
          <tr><td colspan="2" style="padding:16px 0 0;border-top:2px solid #0f2460;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td valign="top" style="font-family:Arial,sans-serif;font-size:12px;color:#444;line-height:1.8;">
                  <strong style="color:#0f2460;">Contact Coach Mario</strong><br>
                  📧 <a href="mailto:ritennismario@gmail.com" style="color:#1a3a8f;text-decoration:none;">ritennismario@gmail.com</a><br>
                  📞 <a href="tel:4019655873" style="color:#1a3a8f;text-decoration:none;">401-965-5873</a>
                </td>
                <td valign="top" style="text-align:right;font-family:Arial,sans-serif;font-size:12px;color:#444;line-height:1.8;">
                  <strong style="color:#0f2460;">Follow Us</strong><br>
                  <a href="https://www.instagram.com/deletefearwithMario" style="color:#1a3a8f;text-decoration:none;">Instagram</a> ·
                  <a href="https://www.youtube.com/@RiTennisMario" style="color:#1a3a8f;text-decoration:none;">YouTube</a><br>
                  <a href="https://www.tiktok.com/@deletefear" style="color:#1a3a8f;text-decoration:none;">TikTok</a> ·
                  <a href="https://www.facebook.com/mario.llano" style="color:#1a3a8f;text-decoration:none;">Facebook</a>
                </td>
              </tr>
            </table>
          </td></tr>

        </table>
      </td>
    </tr>

    <!-- ═══ FOOTER ═══ -->
    <tr>
      <td style="background:#0f2460;padding:14px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-family:Arial,sans-serif;font-size:11px;color:#a0b4e8;">
              © ${new Date().getFullYear()} RI Tennis Academy · Rhode Island
            </td>
            <td style="text-align:right;font-family:Arial,sans-serif;font-size:11px;color:#a0b4e8;">
              <a href="mailto:ritennismario@gmail.com?subject=Unsubscribe" style="color:#ccff00;text-decoration:none;">Unsubscribe</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

  </table>
  <!-- End outer wrapper -->

</td></tr>
</table>

</body>
</html>`;
}
