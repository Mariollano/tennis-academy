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

const DEFAULT_PROGRAMS_TABLE = `
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
  <thead>
    <tr style="background:#1a1a2e;">
      <th style="padding:8px 12px;text-align:left;color:#fff;font-family:Arial,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;">Program</th>
      <th style="padding:8px 12px;text-align:left;color:#fff;font-family:Arial,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;">Duration</th>
      <th style="padding:8px 12px;text-align:left;color:#e05c00;font-family:Arial,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;">Price</th>
      <th style="padding:8px 12px;text-align:left;color:#fff;font-family:Arial,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;">Details</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background:#fff;">
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#1a1a2e;">Private Lessons</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:Arial,sans-serif;font-size:12px;color:#555;">1 hour</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#e05c00;">$80/session</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:Arial,sans-serif;font-size:12px;color:#666;">1-on-1 coaching tailored to your level</td>
    </tr>
    <tr style="background:#fafafa;">
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#1a1a2e;">105 Game Clinic</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:Arial,sans-serif;font-size:12px;color:#555;">90 min</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#e05c00;">$35/session</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:Arial,sans-serif;font-size:12px;color:#666;">Group drill &amp; match-play clinic (max 8)</td>
    </tr>
    <tr style="background:#fff;">
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#1a1a2e;">Junior Program</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:Arial,sans-serif;font-size:12px;color:#555;">1 hour</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#e05c00;">$120/month</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:Arial,sans-serif;font-size:12px;color:#666;">Structured development for ages 6–17</td>
    </tr>
    <tr style="background:#fafafa;">
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#1a1a2e;">Summer Camp</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:Arial,sans-serif;font-size:12px;color:#555;">Half/Full day</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#e05c00;">$200/week</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:Arial,sans-serif;font-size:12px;color:#666;">Intensive summer training program</td>
    </tr>
    <tr style="background:#fff;">
      <td style="padding:8px 12px;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#1a1a2e;">Mental Coaching</td>
      <td style="padding:8px 12px;font-family:Arial,sans-serif;font-size:12px;color:#555;">1 hour</td>
      <td style="padding:8px 12px;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#e05c00;">$60/session</td>
      <td style="padding:8px 12px;font-family:Arial,sans-serif;font-size:12px;color:#666;">Delete Fear performance mindset coaching</td>
    </tr>
  </tbody>
</table>`;

export function buildNewsletterHtml(data: NewsletterEmailData): string {
  const date = formatDate();
  const programHtml = data.programScheduleHtml || DEFAULT_PROGRAMS_TABLE;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${data.subject}</title>
</head>
<body style="margin:0;padding:0;background:#c8c8c8;font-family:Arial,Helvetica,sans-serif;">

<!-- Outer page background -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#c8c8c8;padding:20px 0;">
<tr><td align="center">

<!-- White page (newspaper page) -->
<table width="680" cellpadding="0" cellspacing="0"
  style="background:#ffffff;max-width:680px;box-shadow:0 6px 32px rgba(0,0,0,0.35);">
<tr><td>

  <!-- ══════════════════════════════════
       TOP ACCENT STRIPE
  ══════════════════════════════════ -->
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="background:#e05c00;height:6px;"></td>
    </tr>
  </table>

  <!-- ══════════════════════════════════
       META BAR (date + website)
  ══════════════════════════════════ -->
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:7px 20px;border-bottom:1px solid #ddd;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:10px;color:#777;font-family:Arial,sans-serif;">${date}</td>
            <td align="center" style="font-size:10px;color:#777;font-family:Arial,sans-serif;">◆ &nbsp; Rhode Island's Premier Tennis Academy &nbsp; ◆</td>
            <td align="right" style="font-size:10px;color:#777;font-family:Arial,sans-serif;">tennispro-kzzfscru.manus.space</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- ══════════════════════════════════
       MASTHEAD — Giant NEWSLETTER title
  ══════════════════════════════════ -->
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:12px 20px 8px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr valign="middle">
            <!-- Academy badge left -->
            <td width="110">
              <table cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:4px;overflow:hidden;">
                <tr><td style="padding:6px 8px;text-align:center;">
                  <div style="font-size:8px;font-weight:900;color:#e05c00;text-transform:uppercase;letter-spacing:1.5px;font-family:Arial,sans-serif;">RI TENNIS</div>
                  <div style="font-size:7px;color:#fff;text-transform:uppercase;letter-spacing:1px;font-family:Arial,sans-serif;margin-top:1px;">ACADEMY</div>
                  <div style="font-size:7px;color:#aaa;font-family:Arial,sans-serif;margin-top:2px;">Coach Mario Llano</div>
                </td></tr>
              </table>
            </td>
            <!-- Big title center -->
            <td align="center" style="padding:0 8px;">
              <div style="font-family:Arial Black,'Arial Bold',Arial,sans-serif;font-size:64px;font-weight:900;line-height:1;letter-spacing:-3px;color:#1a1a2e;text-transform:uppercase;">
                NEWS<span style="color:#e05c00;">LETTER</span>
              </div>
            </td>
            <!-- Tennis ball right -->
            <td width="80" align="right">
              <div style="width:64px;height:64px;background:#f0c040;border-radius:50%;text-align:center;line-height:64px;font-size:32px;display:inline-block;">🎾</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Thick rule under masthead -->
    <tr>
      <td style="padding:0 20px 0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:#1a1a2e;height:4px;width:55%;"></td>
            <td style="background:#e05c00;height:4px;width:25%;"></td>
            <td style="background:#f0c040;height:4px;width:20%;"></td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- ══════════════════════════════════
       HEADLINE BANNER (navy)
  ══════════════════════════════════ -->
  ${data.headline ? `
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="background:#1a1a2e;padding:11px 20px;">
        <p style="margin:0;font-family:Arial,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-align:center;letter-spacing:.3px;">${data.headline}</p>
      </td>
    </tr>
  </table>` : ""}

  <!-- ══════════════════════════════════
       MAIN BODY — 3 columns like newspaper
  ══════════════════════════════════ -->
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr valign="top">

      <!-- COL 1 — Main letter (wide, ~55%) -->
      <td width="370" style="padding:16px 12px 16px 20px;border-right:1px solid #e0e0e0;">

        <!-- Section label bar -->
        <table cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
          <tr>
            <td style="background:#e05c00;padding:3px 10px;border-radius:2px;">
              <span style="font-size:9px;font-weight:900;color:#fff;text-transform:uppercase;letter-spacing:1.5px;font-family:Arial,sans-serif;">From Coach Mario</span>
            </td>
          </tr>
        </table>

        <!-- Body text -->
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:13px;color:#222;line-height:1.75;">
          ${data.bodyHtml}
        </div>

        <!-- CTA button -->
        <table cellpadding="0" cellspacing="0" style="margin-top:14px;">
          <tr>
            <td style="background:#e05c00;border-radius:3px;padding:9px 20px;">
              <a href="https://tennispro-kzzfscru.manus.space/book"
                 style="color:#fff;font-family:Arial,sans-serif;font-size:12px;font-weight:700;text-decoration:none;text-transform:uppercase;letter-spacing:.5px;">
                Book Your Session →
              </a>
            </td>
          </tr>
        </table>

      </td>

      <!-- COL 2 — Tips + Quick Links (~45%) -->
      <td width="290" style="padding:16px 20px 16px 12px;">

        <!-- Quick Links box -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;border:1px solid #1a1a2e;border-radius:3px;overflow:hidden;">
          <tr>
            <td style="background:#1a1a2e;padding:5px 10px;">
              <span style="font-size:9px;font-weight:900;color:#f0c040;text-transform:uppercase;letter-spacing:1.5px;font-family:Arial,sans-serif;">📅 Quick Links</span>
            </td>
          </tr>
          <tr>
            <td style="padding:10px;background:#f8f9ff;">
              <div style="font-family:Arial,sans-serif;font-size:11px;line-height:2;color:#1a1a2e;">
                <div>→ <a href="https://tennispro-kzzfscru.manus.space/book" style="color:#e05c00;text-decoration:none;font-weight:700;">Book a Session</a></div>
                <div>→ <a href="https://tennispro-kzzfscru.manus.space/programs/private-lessons" style="color:#1a1a2e;text-decoration:none;">Private Lessons</a></div>
                <div>→ <a href="https://tennispro-kzzfscru.manus.space/programs/105-clinic" style="color:#1a1a2e;text-decoration:none;">105 Game Clinic</a></div>
                <div>→ <a href="https://tennispro-kzzfscru.manus.space/programs/junior" style="color:#1a1a2e;text-decoration:none;">Junior Programs</a></div>
                <div>→ <a href="https://tennispro-kzzfscru.manus.space/programs/summer-camp" style="color:#1a1a2e;text-decoration:none;">Summer Camp</a></div>
              </div>
            </td>
          </tr>
        </table>

        ${data.tennisTip ? `
        <!-- Tennis Tip -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;border:1px solid #e05c00;border-radius:3px;overflow:hidden;">
          <tr>
            <td style="background:#e05c00;padding:5px 10px;">
              <span style="font-size:9px;font-weight:900;color:#fff;text-transform:uppercase;letter-spacing:1.5px;font-family:Arial,sans-serif;">🎾 Tennis Tip of the Week</span>
            </td>
          </tr>
          <tr>
            <td style="padding:10px;background:#fff8f4;">
              <p style="margin:0;font-family:Georgia,serif;font-size:12px;line-height:1.7;color:#333;font-style:italic;">${data.tennisTip}</p>
            </td>
          </tr>
        </table>` : ""}

        ${data.mentalTip ? `
        <!-- Mental / Delete Fear Tip -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;border:1px solid #1a1a2e;border-radius:3px;overflow:hidden;">
          <tr>
            <td style="background:#1a1a2e;padding:5px 10px;">
              <span style="font-size:9px;font-weight:900;color:#f0c040;text-transform:uppercase;letter-spacing:1.5px;font-family:Arial,sans-serif;">🧠 Delete Fear Tip</span>
            </td>
          </tr>
          <tr>
            <td style="padding:10px;background:#f5f6ff;">
              <p style="margin:0;font-family:Georgia,serif;font-size:12px;line-height:1.7;color:#333;font-style:italic;">${data.mentalTip}</p>
            </td>
          </tr>
        </table>` : ""}

        ${data.winnerSpotlight ? `
        <!-- Winner Spotlight -->
        <table width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #f0c040;border-radius:3px;overflow:hidden;">
          <tr>
            <td style="background:#f0c040;padding:5px 10px;">
              <span style="font-size:9px;font-weight:900;color:#1a1a2e;text-transform:uppercase;letter-spacing:1.5px;font-family:Arial,sans-serif;">🏆 Winner Spotlight</span>
            </td>
          </tr>
          <tr>
            <td style="padding:10px;background:#fffdf0;">
              <p style="margin:0;font-family:Georgia,serif;font-size:12px;line-height:1.7;color:#333;">${data.winnerSpotlight}</p>
            </td>
          </tr>
        </table>` : ""}

      </td>
    </tr>
  </table>

  <!-- ══════════════════════════════════
       DIVIDER
  ══════════════════════════════════ -->
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:0 20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:#e05c00;height:3px;width:30%;"></td>
            <td style="background:#1a1a2e;height:3px;width:40%;"></td>
            <td style="background:#f0c040;height:3px;width:30%;"></td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- ══════════════════════════════════
       PROGRAM SCHEDULE SECTION
  ══════════════════════════════════ -->
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:16px 20px;">

        <!-- Section header -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
          <tr>
            <td width="4" style="background:#e05c00;">&nbsp;</td>
            <td style="padding:4px 10px;background:#f5f5f5;border-top:1px solid #ddd;border-bottom:1px solid #ddd;">
              <span style="font-family:Arial,sans-serif;font-size:11px;font-weight:900;color:#1a1a2e;text-transform:uppercase;letter-spacing:.5px;">📋 Spring 2026 Programs — Schedule &amp; Pricing</span>
            </td>
          </tr>
        </table>

        <!-- Program table -->
        <div style="border:1px solid #ddd;border-radius:3px;overflow:hidden;">
          ${programHtml}
        </div>

        <p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:10px;color:#999;text-align:center;">
          All sessions held at Rhode Island Tennis Academy · Book online at tennispro-kzzfscru.manus.space
        </p>
      </td>
    </tr>
  </table>

  <!-- ══════════════════════════════════
       CONTACT ROW
  ══════════════════════════════════ -->
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:12px 20px;border-top:2px solid #1a1a2e;border-bottom:1px solid #eee;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-family:Arial,sans-serif;font-size:11px;color:#444;line-height:1.9;">
              <strong style="color:#1a1a2e;">Contact Coach Mario</strong><br>
              📧 <a href="mailto:ritennismario@gmail.com" style="color:#e05c00;text-decoration:none;">ritennismario@gmail.com</a> &nbsp;|&nbsp;
              📞 <a href="tel:4019655873" style="color:#e05c00;text-decoration:none;">401-965-5873</a>
            </td>
            <td align="right" style="font-family:Arial,sans-serif;font-size:11px;color:#444;line-height:1.9;">
              <strong style="color:#1a1a2e;">Follow Us</strong><br>
              <a href="https://www.instagram.com/deletefearwithMario" style="color:#e05c00;text-decoration:none;">Instagram</a> ·
              <a href="https://www.youtube.com/@RiTennisMario" style="color:#e05c00;text-decoration:none;">YouTube</a> ·
              <a href="https://www.tiktok.com/@deletefear" style="color:#e05c00;text-decoration:none;">TikTok</a> ·
              <a href="https://www.facebook.com/mario.llano" style="color:#e05c00;text-decoration:none;">Facebook</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- ══════════════════════════════════
       FOOTER
  ══════════════════════════════════ -->
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="background:#1a1a2e;padding:12px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-family:Arial,sans-serif;font-size:10px;color:#aaa;">
              © ${new Date().getFullYear()} RI Tennis Academy · Rhode Island, USA
            </td>
            <td align="center" style="font-family:Georgia,serif;font-size:11px;color:#f0c040;font-style:italic;">
              "Delete Fear. Elevate Your Game."
            </td>
            <td align="right" style="font-family:Arial,sans-serif;font-size:10px;">
              <a href="mailto:ritennismario@gmail.com?subject=Unsubscribe" style="color:#e05c00;text-decoration:none;">Unsubscribe</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Bottom orange stripe -->
    <tr>
      <td style="background:#e05c00;height:5px;"></td>
    </tr>
  </table>

</td></tr>
</table>
<!-- End white page -->

</td></tr>
</table>
<!-- End outer background -->

</body>
</html>`;
}
