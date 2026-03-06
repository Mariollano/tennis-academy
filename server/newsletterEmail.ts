import nodemailer from "nodemailer";

const gmailUser = process.env.EMAIL_USER;
const gmailPass = process.env.EMAIL_APP_PASSWORD;

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663342968318/kzZFsCRUb4iWMZR8LEwAKz/ri-tennis-logo_3de51834.jpg";
const MARIO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663342968318/kzZFsCRUb4iWMZR8LEwAKz/mario-us-open_68ad2763.jpg";

// Navy / gold brand palette
const NAVY = "#0f1f4b";
const GOLD = "#c9a84c";
const LIGHT_GOLD = "#f0d98a";
const CREAM = "#fdf8ef";
const WHITE = "#ffffff";
const DARK_TEXT = "#1a1a2e";
const MUTED = "#6b7280";

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

export interface NewsletterData {
  subject: string;
  headline?: string;
  body?: string;
  bodyHtml?: string;
  tennisTip?: string;
  mentalTip?: string;
  winnerSpotlight?: string;
  includeSchedule?: boolean;
  programScheduleHtml?: string;
}

export function buildNewsletterHtml(data: NewsletterData): string {
  const issueDate = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const tennisTipBlock = data.tennisTip ? `
    <tr><td style="padding:0 0 28px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:${NAVY};border-radius:10px;overflow:hidden;">
        <tr>
          <td style="padding:6px 20px;background:${GOLD};">
            <span style="font-family:Georgia,serif;font-size:11px;font-weight:bold;letter-spacing:2px;color:${NAVY};text-transform:uppercase;">Tennis Tip of the Week</span>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 24px;">
            <p style="margin:0;font-family:Georgia,serif;font-size:16px;line-height:1.7;color:${WHITE};font-style:italic;">${data.tennisTip}</p>
          </td>
        </tr>
      </table>
    </td></tr>` : "";

  const mentalTipBlock = data.mentalTip ? `
    <tr><td style="padding:0 0 28px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};border-left:4px solid ${GOLD};border-radius:0 10px 10px 0;">
        <tr>
          <td style="padding:6px 20px;background:${LIGHT_GOLD};">
            <span style="font-family:Georgia,serif;font-size:11px;font-weight:bold;letter-spacing:2px;color:${NAVY};text-transform:uppercase;">Delete Fear — Mental Edge</span>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 24px;">
            <p style="margin:0;font-family:Georgia,serif;font-size:16px;line-height:1.7;color:${DARK_TEXT};font-style:italic;">${data.mentalTip}</p>
          </td>
        </tr>
      </table>
    </td></tr>` : "";

  const winnerBlock = data.winnerSpotlight ? `
    <tr><td style="padding:0 0 28px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:${NAVY};border-radius:10px;overflow:hidden;">
        <tr>
          <td style="padding:6px 20px;background:linear-gradient(90deg,${GOLD},${LIGHT_GOLD});">
            <span style="font-family:Georgia,serif;font-size:11px;font-weight:bold;letter-spacing:2px;color:${NAVY};text-transform:uppercase;">Winner Spotlight</span>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 24px;">
            <p style="margin:0;font-family:Georgia,serif;font-size:16px;line-height:1.7;color:${LIGHT_GOLD};font-style:italic;">${data.winnerSpotlight}</p>
          </td>
        </tr>
      </table>
    </td></tr>` : "";

  const scheduleBlock = data.programScheduleHtml ? `
    <tr><td style="padding:0 0 28px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr>
          <td style="padding:10px 20px;background:${NAVY};">
            <span style="font-family:Georgia,serif;font-size:11px;font-weight:bold;letter-spacing:2px;color:${GOLD};text-transform:uppercase;">Program Schedule & Pricing</span>
          </td>
        </tr>
        <tr><td style="padding:0;">${data.programScheduleHtml}</td></tr>
      </table>
    </td></tr>` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${data.subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 16px;">
    <tr><td align="center">

      <!-- Card -->
      <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;background:${WHITE};border-radius:16px;overflow:hidden;box-shadow:0 4px 32px rgba(15,31,75,0.12);">

        <!-- ── TOP GOLD STRIPE ── -->
        <tr><td style="background:linear-gradient(90deg,${GOLD},${LIGHT_GOLD},${GOLD});height:5px;font-size:0;">&nbsp;</td></tr>

        <!-- ── HEADER ── -->
        <tr>
          <td style="background:${NAVY};padding:32px 40px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle;width:72px;">
                  <img src="${LOGO_URL}" alt="RI Tennis Academy" width="64" height="64"
                    style="border-radius:50%;border:3px solid ${GOLD};display:block;">
                </td>
                <td style="vertical-align:middle;padding-left:16px;">
                  <p style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:bold;color:${WHITE};letter-spacing:0.5px;">RI Tennis Academy</p>
                  <p style="margin:4px 0 0;font-size:12px;color:${GOLD};letter-spacing:1.5px;text-transform:uppercase;">Coach Mario Llano · Rhode Island</p>
                </td>
                <td style="vertical-align:middle;text-align:right;width:80px;">
                  <img src="${MARIO_URL}" alt="Coach Mario" width="56" height="56"
                    style="border-radius:50%;border:2px solid ${GOLD};display:block;margin-left:auto;">
                </td>
              </tr>
            </table>

            <!-- Date bar -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;border-top:1px solid rgba(201,168,76,0.3);padding-top:14px;">
              <tr>
                <td style="font-size:11px;color:rgba(255,255,255,0.55);letter-spacing:1px;text-transform:uppercase;">${issueDate}</td>
                <td style="text-align:right;font-size:11px;color:rgba(255,255,255,0.55);letter-spacing:1px;text-transform:uppercase;">ritennisacademy.com</td>
              </tr>
            </table>

            ${data.headline ? `
            <!-- Headline -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
              <tr>
                <td>
                  <p style="margin:0 0 4px;font-size:11px;color:${GOLD};letter-spacing:2px;text-transform:uppercase;">This Week</p>
                  <h1 style="margin:0;font-family:Georgia,serif;font-size:28px;line-height:1.25;color:${WHITE};font-style:italic;">${data.headline}</h1>
                </td>
              </tr>
            </table>` : ""}
          </td>
        </tr>

        <!-- ── GOLD RULE ── -->
        <tr><td style="background:linear-gradient(90deg,${GOLD},${LIGHT_GOLD},${GOLD});height:3px;font-size:0;">&nbsp;</td></tr>

        <!-- ── BODY ── -->
        <tr>
          <td style="padding:36px 40px 8px;">

            <!-- Main letter -->
            <tr><td style="padding:0 0 28px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0 0 4px;font-size:10px;color:${GOLD};letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;">From Coach Mario</p>
                    <div style="font-family:Georgia,serif;font-size:16px;line-height:1.8;color:${DARK_TEXT};">
                      ${(data.bodyHtml || data.body || "").split("\n\n").map(p => p.trim() ? `<p style="margin:0 0 16px;">${p.replace(/\n/g, "<br>")}</p>` : "").join("")}
                    </div>
                  </td>
                </tr>
              </table>
            </td></tr>

            ${tennisTipBlock}
            ${mentalTipBlock}
            ${winnerBlock}
            ${scheduleBlock}

            <!-- CTA -->
            <tr><td style="padding:0 0 36px 0;text-align:center;">
              <a href="https://tennispro-kzzfscru.manus.space" target="_blank"
                style="display:inline-block;background:${GOLD};color:${NAVY};font-family:Georgia,serif;font-size:15px;font-weight:bold;letter-spacing:1px;text-decoration:none;padding:14px 36px;border-radius:50px;">
                Book a Session &rarr;
              </a>
            </td></tr>

          </td>
        </tr>

        <!-- ── BOTTOM GOLD STRIPE ── -->
        <tr><td style="background:linear-gradient(90deg,${GOLD},${LIGHT_GOLD},${GOLD});height:3px;font-size:0;">&nbsp;</td></tr>

        <!-- ── FOOTER ── -->
        <tr>
          <td style="background:${NAVY};padding:24px 40px;text-align:center;">
            <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:13px;color:${GOLD};font-style:italic;">Elevate Your Game. Master Your Mind.</p>
            <p style="margin:0 0 12px;font-size:11px;color:rgba(255,255,255,0.5);">
              <a href="mailto:ritennismario@gmail.com" style="color:${GOLD};text-decoration:none;">ritennismario@gmail.com</a>
              &nbsp;&middot;&nbsp;
              <a href="tel:4019655873" style="color:rgba(255,255,255,0.5);text-decoration:none;">401-965-5873</a>
              &nbsp;&middot;&nbsp;
              <a href="https://tennispro-kzzfscru.manus.space" style="color:rgba(255,255,255,0.5);text-decoration:none;">ritennisacademy.com</a>
            </p>
            <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.3);">
              You're receiving this because you're part of the RI Tennis Academy community.<br>
              <a href="#" style="color:rgba(255,255,255,0.3);text-decoration:underline;">Unsubscribe</a>
            </p>
          </td>
        </tr>

        <!-- ── BOTTOM GOLD STRIPE ── -->
        <tr><td style="background:linear-gradient(90deg,${GOLD},${LIGHT_GOLD},${GOLD});height:5px;font-size:0;">&nbsp;</td></tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}

export async function sendNewsletterEmail(opts: {
  toEmail: string;
  toName?: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"RI Tennis Academy" <${gmailUser}>`,
      to: opts.toName ? `"${opts.toName}" <${opts.toEmail}>` : opts.toEmail,
      subject: opts.subject,
      html: opts.html,
    });
    return { success: true };
  } catch (err: any) {
    console.error("[Newsletter] Failed to send to", opts.toEmail, err?.message);
    return { success: false, error: err?.message || "Unknown error" };
  }
}
