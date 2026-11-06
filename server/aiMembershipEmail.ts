import nodemailer from "nodemailer";
import { Resend } from "resend";
import { isMembershipOrigin } from "../shared/aiMembership";

export const escapeHtml = (text: string) => text.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));
export function membershipEmailHtml(origin: string, signInUrl: string, welcome = true) {
  if (!isMembershipOrigin(origin)) throw new Error("Invalid academy origin");
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#182434"><div style="max-width:600px;margin:24px auto;background:white;border-radius:12px;overflow:hidden"><header style="background:#0D1B2A;color:white;padding:28px"><p style="color:#F3C85D;font-size:12px;letter-spacing:2px">RI TENNIS ACADEMY · COACH MARIO</p><h1 style="font-size:28px">${welcome ? "Welcome to the membership" : "Your member sign-in link"}</h1></header><main style="padding:28px"><p>${welcome ? "Thank you for joining AI for the Working Tennis Pro. Your member account is ready using the email you paid with." : "Use the secure link below to sign in to your member account."}</p><p><a style="display:inline-block;background:#F3C85D;color:#0D1B2A;padding:14px 22px;border-radius:8px;font-weight:bold;text-decoration:none" href="${escapeHtml(signInUrl)}">Sign in to your member account</a></p><p>This private, one-time sign-in link expires in one hour. Never share it. You can request a fresh link from the member library.</p><h2 style="font-size:20px">Get started in three steps</h2><ol style="padding-left:22px;line-height:1.8"><li>Sign in with the button above.</li><li>Open <a href="${origin}/ai-members">your member library</a>.</li><li>Choose a guide. If its PDF is not uploaded yet, it says “Coming soon”. The Prompt Library opens when Coach Mario adds the prompts.</li></ol><p><a href="${origin}/ai-members">Open the member library</a></p><p>Your membership is $20 USD per month. You can cancel future renewal anytime from the library. Access continues through your paid month; guides already downloaded are yours to keep.</p><p>Questions? <a href="mailto:ritennismario@gmail.com">Email Coach Mario</a> or call/text (401) 965-5873.</p></main></div></body></html>`;
}
function gmailTransport() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) throw new Error("Gmail sending credentials are missing");
  return nodemailer.createTransport({ service: "gmail", auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_APP_PASSWORD }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000 });
}
export async function verifyMembershipEmail() {
  if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) {
    try { await gmailTransport().verify(); return { ready: true, provider: "gmail" as const }; } catch { /* try verified Resend fallback */ }
  }
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const result = await resend.domains.list();
      const from = process.env.RESEND_FROM_EMAIL || "noreply@getroger.biz";
      const domain = from.split("@")[1];
      if (!result.error && result.data?.data.some(d => d.name === domain && d.status === "verified")) return { ready: true, provider: "resend" as const };
    } catch { /* closed on credential/network failure */ }
  }
  return { ready: false, provider: null };
}
export async function sendMemberEmail(email: string, origin: string, signInUrl: string, welcome = true) {
  const verified = await verifyMembershipEmail();
  if (!verified.ready) throw new Error("Membership email delivery is not configured correctly");
  const subject = welcome ? "Welcome to AI for the Working Tennis Pro — RI Tennis Academy" : "Your member sign-in link — RI Tennis Academy";
  const html = membershipEmailHtml(origin, signInUrl, welcome);
  const text = `${welcome ? "Welcome to AI for the Working Tennis Pro! Your member account is ready." : "Your member sign-in link:"}\n\nSign in: ${signInUrl}\nThis private one-time link expires in one hour.\n\nGet started: sign in, open ${origin}/ai-members, and choose a guide. PDFs not yet uploaded say Coming soon.\n\n$20 USD per month. Cancel future renewal anytime from the member library. Downloaded guides are yours to keep.\n\nQuestions: ritennismario@gmail.com / (401) 965-5873.`;
  if (verified.provider === "gmail") {
    await gmailTransport().sendMail({ from: `"RI Tennis Academy" <${process.env.EMAIL_USER}>`, to: email, subject, text, html });
  } else {
    const result = await new Resend(process.env.RESEND_API_KEY!).emails.send({ from: `RI Tennis Academy <${process.env.RESEND_FROM_EMAIL || "noreply@getroger.biz"}>`, to: email, subject, text, html });
    if (result.error) throw new Error("Welcome email was rejected by the sending provider");
  }
}
