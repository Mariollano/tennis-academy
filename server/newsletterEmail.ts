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
    <tr>
      <th style="padding:10px 14px;text-align:left;font-family:Georgia,serif;font-size:11px;font-weight:400;color:#8fa3b8;text-transform:uppercase;letter-spacing:1.5px;border-bottom:1px solid #1b2d45;">Program</th>
      <th style="padding:10px 14px;text-align:left;font-family:Georgia,serif;font-size:11px;font-weight:400;color:#8fa3b8;text-transform:uppercase;letter-spacing:1.5px;border-bottom:1px solid #1b2d45;">Duration</th>
      <th style="padding:10px 14px;text-align:right;font-family:Georgia,serif;font-size:11px;font-weight:400;color:#8fa3b8;text-transform:uppercase;letter-spacing:1.5px;border-bottom:1px solid #1b2d45;">Price</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding:12px 14px;border-bottom:1px solid #1b2d45;font-family:Georgia,serif;font-size:14px;color:#f0ede6;">Private Lessons</td>
      <td style="padding:12px 14px;border-bottom:1px solid #1b2d45;font-family:Georgia,serif;font-size:13px;color:#8fa3b8;">1 hour &middot; 1-on-1 coaching</td>
      <td style="padding:12px 14px;border-bottom:1px solid #1b2d45;font-family:Georgia,serif;font-size:14px;color:#c9a84c;text-align:right;font-weight:bold;">$80 / session</td>
    </tr>
    <tr>
      <td style="padding:12px 14px;border-bottom:1px solid #1b2d45;font-family:Georgia,serif;font-size:14px;color:#f0ede6;">105 Game Clinic</td>
      <td style="padding:12px 14px;border-bottom:1px solid #1b2d45;font-family:Georgia,serif;font-size:13px;color:#8fa3b8;">90 min &middot; Group drill &amp; match-play</td>
      <td style="padding:12px 14px;border-bottom:1px solid #1b2d45;font-family:Georgia,serif;font-size:14px;color:#c9a84c;text-align:right;font-weight:bold;">$35 / session</td>
    </tr>
    <tr>
      <td style="padding:12px 14px;border-bottom:1px solid #1b2d45;font-family:Georgia,serif;font-size:14px;color:#f0ede6;">Junior Program</td>
      <td style="padding:12px 14px;border-bottom:1px solid #1b2d45;font-family:Georgia,serif;font-size:13px;color:#8fa3b8;">1 hour &middot; Ages 6&ndash;17</td>
      <td style="padding:12px 14px;border-bottom:1px solid #1b2d45;font-family:Georgia,serif;font-size:14px;color:#c9a84c;text-align:right;font-weight:bold;">$120 / month</td>
    </tr>
    <tr>
      <td style="padding:12px 14px;border-bottom:1px solid #1b2d45;font-family:Georgia,serif;font-size:14px;color:#f0ede6;">Summer Camp</td>
      <td style="padding:12px 14px;border-bottom:1px solid #1b2d45;font-family:Georgia,serif;font-size:13px;color:#8fa3b8;">Half / Full day</td>
      <td style="padding:12px 14px;border-bottom:1px solid #1b2d45;font-family:Georgia,serif;font-size:14px;color:#c9a84c;text-align:right;font-weight:bold;">$200 / week</td>
    </tr>
    <tr>
      <td style="padding:12px 14px;font-family:Georgia,serif;font-size:14px;color:#f0ede6;">Mental Coaching</td>
      <td style="padding:12px 14px;font-family:Georgia,serif;font-size:13px;color:#8fa3b8;">1 hour &middot; Delete Fear method</td>
      <td style="padding:12px 14px;font-family:Georgia,serif;font-size:14px;color:#c9a84c;text-align:right;font-weight:bold;">$60 / session</td>
    </tr>
  </tbody>
</table>`;


export function buildNewsletterHtml(data: NewsletterEmailData): string {
  const date = formatDate();
  const programHtml = data.programScheduleHtml || DEFAULT_PROGRAMS_TABLE;

  const bodyHtml = data.bodyHtml.includes("<")
    ? data.bodyHtml
    : data.bodyHtml
        .split(/\n\n+/)
        .map(
          (p) =>
            `<p style="margin:0 0 18px;font-family:Georgia,serif;font-size:15px;line-height:1.8;color:#c8d8e8;">${p.replace(/\n/g, "<br>")}</p>`
        )
        .join("");

  const tennisTipSection = data.tennisTip
    ? `<td style="padding:28px 20px 28px 40px;${data.mentalTip ? "border-right:1px solid #1b2d45;" : ""}">
        <p style="margin:0 0 10px;font-family:Georgia,serif;font-size:10px;color:#c9a84c;text-transform:uppercase;letter-spacing:3px;">Tennis Tip of the Week</p>
        <p style="margin:0;font-family:Georgia,serif;font-size:14px;line-height:1.75;color:#c8d8e8;font-style:italic;">${data.tennisTip}</p>
      </td>`
    : "";

  const mentalTipSection = data.mentalTip
    ? `<td style="padding:28px 40px 28px 20px;">
        <p style="margin:0 0 10px;font-family:Georgia,serif;font-size:10px;color:#c9a84c;text-transform:uppercase;letter-spacing:3px;">Delete Fear Mental Tip</p>
        <p style="margin:0;font-family:Georgia,serif;font-size:14px;line-height:1.75;color:#c8d8e8;font-style:italic;">${data.mentalTip}</p>
      </td>`
    : "";

  const tipsRow =
    data.tennisTip || data.mentalTip
      ? `<table width="100%" cellpadding="0" cellspacing="0"><tr valign="top">${tennisTipSection}${mentalTipSection}</tr></table>
         <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:0 40px;"><div style="height:1px;background:#1b2d45;"></div></td></tr></table>`
      : "";

  const winnerSection = data.winnerSpotlight
    ? `<table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:28px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
              <tr>
                <td width="3" style="background:#c9a84c;">&nbsp;</td>
                <td style="padding:0 0 0 14px;">
                  <p style="margin:0;font-family:Georgia,serif;font-size:10px;color:#c9a84c;text-transform:uppercase;letter-spacing:3px;">Winner Spotlight</p>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-family:Georgia,serif;font-size:15px;line-height:1.8;color:#c8d8e8;">${data.winnerSpotlight}</p>
          </td>
        </tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:0 40px;"><div style="height:1px;background:#1b2d45;"></div></td></tr></table>`
    : "";

  const headlineBanner = data.headline
    ? `<table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:28px 40px 0;text-align:center;">
            <h2 style="margin:0;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#f0ede6;line-height:1.4;font-style:italic;">${data.headline}</h2>
            <div style="width:48px;height:2px;background:#c9a84c;margin:16px auto 0;"></div>
          </td>
        </tr>
      </table>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${data.subject}</title>
</head>
<body style="margin:0;padding:0;background:#060f18;font-family:Georgia,'Times New Roman',serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#060f18;padding:32px 0;">
<tr><td align="center">

<table width="620" cellpadding="0" cellspacing="0" style="background:#0d1b2a;max-width:620px;border:1px solid #1b2d45;">
<tr><td>

  <!-- HERO HEADER -->
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="background:#0d1b2a;padding:44px 40px 36px;text-align:center;border-bottom:1px solid #1b2d45;">
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr>
            <td style="background:#1b2d45;height:1px;width:35%;"></td>
            <td style="background:#c9a84c;height:2px;width:30%;"></td>
            <td style="background:#1b2d45;height:1px;width:35%;"></td>
          </tr>
        </table>
        <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:11px;font-weight:400;color:#c9a84c;text-transform:uppercase;letter-spacing:4px;">Rhode Island Tennis Academy</p>
        <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:54px;font-weight:400;color:#f0ede6;letter-spacing:-1px;line-height:1;">Newsletter</h1>
        <p style="margin:0 0 24px;font-family:Georgia,serif;font-size:12px;font-weight:400;color:#8fa3b8;letter-spacing:2px;text-transform:uppercase;font-style:italic;">Coach Mario Llano</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
          <tr>
            <td style="background:#1b2d45;height:1px;width:35%;"></td>
            <td style="background:#c9a84c;height:2px;width:30%;"></td>
            <td style="background:#1b2d45;height:1px;width:35%;"></td>
          </tr>
        </table>
        <p style="margin:0;font-family:Georgia,serif;font-size:12px;color:#8fa3b8;letter-spacing:1px;">${date}</p>
      </td>
    </tr>
  </table>

  ${headlineBanner}

  <!-- MAIN BODY -->
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:32px 40px 0;">
        <p style="margin:0 0 16px;font-family:Georgia,serif;font-size:10px;font-weight:400;color:#c9a84c;text-transform:uppercase;letter-spacing:3px;">From Coach Mario</p>
        <div style="font-family:Georgia,serif;font-size:15px;color:#c8d8e8;line-height:1.8;">${bodyHtml}</div>
      </td>
    </tr>
  </table>

  <!-- CTA -->
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:28px 40px 32px;text-align:center;">
        <table cellpadding="0" cellspacing="0" style="display:inline-table;margin:0 auto;">
          <tr>
            <td style="background:#c9a84c;padding:14px 40px;">
              <a href="https://tennispro-kzzfscru.manus.space/book"
                 style="color:#0d1b2a;font-family:Georgia,serif;font-size:13px;font-weight:700;text-decoration:none;text-transform:uppercase;letter-spacing:2px;">Book Your Session</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- Divider -->
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:0 40px;"><div style="height:1px;background:#1b2d45;"></div></td></tr></table>

  ${tipsRow}
  ${winnerSection}

  <!-- PROGRAMS -->
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:28px 40px;">
        <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:10px;color:#c9a84c;text-transform:uppercase;letter-spacing:3px;">Spring 2026 Programs</p>
        ${programHtml}
        <p style="margin:16px 0 0;font-family:Georgia,serif;font-size:11px;color:#8fa3b8;text-align:center;font-style:italic;">All sessions held at Rhode Island Tennis Academy</p>
      </td>
    </tr>
  </table>

  <!-- Divider -->
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:0 40px;"><div style="height:1px;background:#1b2d45;"></div></td></tr></table>

  <!-- QUICK LINKS -->
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:24px 40px;text-align:center;">
        <p style="margin:0 0 14px;font-family:Georgia,serif;font-size:10px;color:#8fa3b8;text-transform:uppercase;letter-spacing:2px;">Quick Links</p>
        <p style="margin:0;font-family:Georgia,serif;font-size:13px;line-height:2.4;color:#8fa3b8;">
          <a href="https://tennispro-kzzfscru.manus.space/programs/private-lessons" style="color:#c9a84c;text-decoration:none;">Private Lessons</a>
          &nbsp;&nbsp;&middot;&nbsp;&nbsp;
          <a href="https://tennispro-kzzfscru.manus.space/programs/105-clinic" style="color:#c9a84c;text-decoration:none;">105 Game Clinic</a>
          &nbsp;&nbsp;&middot;&nbsp;&nbsp;
          <a href="https://tennispro-kzzfscru.manus.space/programs/junior" style="color:#c9a84c;text-decoration:none;">Junior Programs</a>
          &nbsp;&nbsp;&middot;&nbsp;&nbsp;
          <a href="https://tennispro-kzzfscru.manus.space/programs/summer-camp" style="color:#c9a84c;text-decoration:none;">Summer Camp</a>
          &nbsp;&nbsp;&middot;&nbsp;&nbsp;
          <a href="https://tennispro-kzzfscru.manus.space/programs/mental-coaching" style="color:#c9a84c;text-decoration:none;">Mental Coaching</a>
        </p>
      </td>
    </tr>
  </table>

  <!-- FOOTER -->
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="background:#060f18;padding:32px 40px;border-top:1px solid #1b2d45;">
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr>
            <td style="background:#1b2d45;height:1px;width:35%;"></td>
            <td style="background:#c9a84c;height:1px;width:30%;"></td>
            <td style="background:#1b2d45;height:1px;width:35%;"></td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr valign="top">
            <td>
              <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:13px;color:#f0ede6;">RI Tennis Academy</p>
              <p style="margin:0 0 2px;font-family:Georgia,serif;font-size:11px;color:#8fa3b8;">Coach Mario Llano &middot; Rhode Island</p>
              <p style="margin:0;font-family:Georgia,serif;font-size:11px;"><a href="mailto:ritennismario@gmail.com" style="color:#c9a84c;text-decoration:none;">ritennismario@gmail.com</a></p>
            </td>
            <td align="center" valign="middle">
              <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:12px;color:#8fa3b8;font-style:italic;">"Delete Fear. Elevate Your Game."</p>
              <p style="margin:0;font-family:Georgia,serif;font-size:11px;">
                <a href="https://www.instagram.com/deletefearwithMario" style="color:#c9a84c;text-decoration:none;margin:0 6px;">Instagram</a>
                <a href="https://www.youtube.com/@RiTennisMario" style="color:#c9a84c;text-decoration:none;margin:0 6px;">YouTube</a>
                <a href="https://www.tiktok.com/@deletefear" style="color:#c9a84c;text-decoration:none;margin:0 6px;">TikTok</a>
              </p>
            </td>
            <td align="right" valign="top">
              <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:11px;color:#8fa3b8;">You're receiving this because</p>
              <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:11px;color:#8fa3b8;">you're part of RI Tennis Academy.</p>
              <a href="mailto:ritennismario@gmail.com?subject=Unsubscribe" style="font-family:Georgia,serif;font-size:11px;color:#8fa3b8;text-decoration:underline;">Unsubscribe</a>
            </td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
          <tr>
            <td style="background:#1b2d45;height:1px;width:35%;"></td>
            <td style="background:#c9a84c;height:1px;width:30%;"></td>
            <td style="background:#1b2d45;height:1px;width:35%;"></td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-family:Georgia,serif;font-size:10px;color:#3d5166;text-align:center;letter-spacing:1px;text-transform:uppercase;">
          &copy; ${new Date().getFullYear()} RI Tennis Academy &middot; All Rights Reserved
        </p>
      </td>
    </tr>
  </table>

</td></tr>
</table>

</td></tr>
</table>

</body>
</html>`;
}
