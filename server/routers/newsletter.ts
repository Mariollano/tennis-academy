/**
 * Newsletter Router
 * Handles newsletter subscriptions, composition, and sending.
 * Newsletters are sent twice a week (Tue + Fri) and include:
 *   - Program schedule & costs
 *   - Tennis Tip of the Week
 *   - Mental Tip of the Week
 *   - Weekly Winner Spotlight
 *   - General coaching notes
 */
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { users, newsletters } from "../../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { isEmailConfigured } from "../email";
import nodemailer from "nodemailer";

// Admin guard
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});

// ─── Email sender ─────────────────────────────────────────────────────────────
async function sendNewsletterEmail(
  toEmail: string,
  toName: string,
  subject: string,
  htmlBody: string
): Promise<void> {
  if (!isEmailConfigured()) return;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_APP_PASSWORD },
  });
  await transporter.sendMail({
    from: `"RI Tennis Academy" <${process.env.EMAIL_USER}>`,
    to: `${toName} <${toEmail}>`,
    subject,
    html: htmlBody,
  });
}

// ─── Newsletter HTML builder ──────────────────────────────────────────────────
function buildNewsletterHtml(nl: {
  headline?: string | null;
  body?: string | null;
  tennisTip?: string | null;
  mentalTip?: string | null;
  winnerSpotlight?: string | null;
  includeSchedule: boolean;
}): string {
  const scheduleHtml = nl.includeSchedule
    ? `<tr><td style="padding:24px 32px 0;">
        <h3 style="margin:0 0 12px;font-size:16px;color:#22c55e;font-family:Arial,sans-serif;">📅 Upcoming Programs & Schedule</h3>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
          <thead><tr style="background:#22c55e;color:#0D1B2A;">
            <th style="padding:8px 12px;text-align:left;">Program</th>
            <th style="padding:8px 12px;text-align:left;">Schedule</th>
            <th style="padding:8px 12px;text-align:right;">Price</th>
          </tr></thead>
          <tbody>
            <tr style="background:rgba(255,255,255,0.05);"><td style="padding:8px 12px;border-bottom:1px solid #253545;color:#F4F6F0;">Private Lesson</td><td style="padding:8px 12px;border-bottom:1px solid #253545;color:#8A9BAD;">By appointment</td><td style="padding:8px 12px;border-bottom:1px solid #253545;text-align:right;color:#F4F6F0;">$120/hr</td></tr>
            <tr><td style="padding:8px 12px;border-bottom:1px solid #253545;color:#F4F6F0;">105 Game Clinic</td><td style="padding:8px 12px;border-bottom:1px solid #253545;color:#8A9BAD;">Mon/Wed/Fri/Sun</td><td style="padding:8px 12px;border-bottom:1px solid #253545;text-align:right;color:#F4F6F0;">$35/1.5hr</td></tr>
            <tr style="background:rgba(255,255,255,0.05);"><td style="padding:8px 12px;border-bottom:1px solid #253545;color:#F4F6F0;">Junior Program</td><td style="padding:8px 12px;border-bottom:1px solid #253545;color:#8A9BAD;">Mon–Fri, 3:30–6:30 PM</td><td style="padding:8px 12px;border-bottom:1px solid #253545;text-align:right;color:#F4F6F0;">$80/day · $350/wk</td></tr>
            <tr><td style="padding:8px 12px;color:#F4F6F0;">Summer Camp</td><td style="padding:8px 12px;color:#8A9BAD;">Mon–Fri, 9 AM–2 PM</td><td style="padding:8px 12px;text-align:right;color:#F4F6F0;">$90/day · $420/wk</td></tr>
          </tbody>
        </table>
      </td></tr>`
    : "";

  const tennisTipHtml = nl.tennisTip
    ? `<tr><td style="padding:24px 32px 0;">
        <div style="background:rgba(34,197,94,0.08);border-left:4px solid #22c55e;padding:16px 20px;border-radius:0 8px 8px 0;">
          <h3 style="margin:0 0 8px;font-size:15px;color:#22c55e;font-family:Arial,sans-serif;">🎾 Tennis Tip of the Week</h3>
          <p style="margin:0;font-size:14px;color:#F4F6F0;line-height:1.6;">${nl.tennisTip}</p>
        </div>
      </td></tr>`
    : "";

  const mentalTipHtml = nl.mentalTip
    ? `<tr><td style="padding:24px 32px 0;">
        <div style="background:rgba(124,58,237,0.1);border-left:4px solid #7c3aed;padding:16px 20px;border-radius:0 8px 8px 0;">
          <h3 style="margin:0 0 8px;font-size:15px;color:#a78bfa;font-family:Arial,sans-serif;">🧠 Mental Tip of the Week</h3>
          <p style="margin:0;font-size:14px;color:#F4F6F0;line-height:1.6;">${nl.mentalTip}</p>
        </div>
      </td></tr>`
    : "";

  const winnerHtml = nl.winnerSpotlight
    ? `<tr><td style="padding:24px 32px 0;">
        <div style="background:rgba(245,158,11,0.1);border-left:4px solid #f59e0b;padding:16px 20px;border-radius:0 8px 8px 0;">
          <h3 style="margin:0 0 8px;font-size:15px;color:#fbbf24;font-family:Arial,sans-serif;">🏆 Weekly Winner Spotlight</h3>
          <p style="margin:0;font-size:14px;color:#F4F6F0;line-height:1.6;">${nl.winnerSpotlight}</p>
        </div>
      </td></tr>`
    : "";

  const bodyHtml = nl.body
    ? `<tr><td style="padding:24px 32px 0;font-size:14px;color:#9BAFC0;line-height:1.8;">${nl.body.replace(/\n/g, "<br>")}</td></tr>`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A1520;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A1520;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#0D1B2A;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.4);">
        <!-- Masthead with Logo -->
        <tr><td style="background:#0D1B2A;padding:20px 32px;border-bottom:1px solid #253545;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:middle;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;padding-right:14px;">
                      <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663342968318/kzZFsCRUb4iWMZR8LEwAKz/ri-tennis-logo_17005d5c.png" alt="RI Tennis Academy" width="72" height="72" style="display:block;border-radius:50%;object-fit:contain;" />
                    </td>
                    <td style="vertical-align:middle;">
                      <div style="font-size:20px;font-weight:900;letter-spacing:2px;color:#ffffff;line-height:1;">RI <span style="color:#22c55e;">TENNIS</span> ACADEMY</div>
                      <div style="font-size:9px;font-weight:500;letter-spacing:3px;text-transform:uppercase;color:#8A9BAD;margin-top:4px;">COACH MARIO LLANO · RHODE ISLAND</div>
                      <div style="font-size:9px;letter-spacing:2px;color:#22c55e;margin-top:3px;font-style:italic;">#DeleteFear · #PlayStrong</div>
                    </td>
                  </tr>
                </table>
              </td>
              <td style="text-align:right;vertical-align:middle;">
                <div style="font-size:9px;font-weight:500;letter-spacing:3px;text-transform:uppercase;color:#8A9BAD;margin-bottom:4px;">WEEKLY NEWSLETTER</div>
                <div style="font-size:16px;font-style:italic;color:#F4F6F0;font-weight:300;">Spring 2026</div>
              </td>
            </tr>
          </table>
        </td></tr>
        <!-- Hero Header -->
        <tr><td style="background:linear-gradient(135deg,#162436 0%,#1E3045 100%);padding:36px 32px 32px;text-align:center;border-bottom:3px solid #22c55e;">
          <div style="display:inline-block;margin-bottom:14px;">
            <span style="display:inline-block;width:26px;height:2px;background:#22c55e;vertical-align:middle;"></span>
            <span style="font-size:9px;font-weight:600;letter-spacing:4px;text-transform:uppercase;color:#22c55e;vertical-align:middle;margin:0 8px;">COACH MARIO LLANO</span>
            <span style="display:inline-block;width:26px;height:2px;background:#22c55e;vertical-align:middle;"></span>
          </div>
          <h1 style="margin:0 0 10px;font-size:30px;color:#fff;font-weight:900;line-height:1.15;letter-spacing:1px;">${nl.headline || "Weekly Tennis Update"}</h1>
          <div style="font-size:12px;color:#8A9BAD;margin-top:8px;">Rhode Island Tennis Academy · Weekly Update</div>
        </td></tr>
        <!-- Body sections -->
        ${bodyHtml}
        ${scheduleHtml}
        ${tennisTipHtml}
        ${mentalTipHtml}
        ${winnerHtml}
        <!-- CTA -->
        <tr><td style="background:#162436;padding:36px 32px;text-align:center;border-top:1px solid #253545;">
          <div style="font-size:9px;font-weight:600;letter-spacing:4px;text-transform:uppercase;color:#22c55e;margin-bottom:12px;">READY TO PLAY?</div>
          <div style="font-size:22px;font-weight:900;color:#ffffff;margin-bottom:8px;line-height:1.2;">TAKE YOUR GAME<br><span style="color:#22c55e;">TO THE NEXT LEVEL</span></div>
          <div style="font-size:13px;color:#8A9BAD;margin-bottom:22px;">Book a session with Coach Mario today.</div>
          <a href="https://www.tennispromario.com/programs" style="display:inline-block;background:#22c55e;color:#ffffff;font-weight:900;font-size:13px;padding:14px 36px;border-radius:100px;text-decoration:none;letter-spacing:2px;text-transform:uppercase;">BOOK A SESSION →</a>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#0D1B2A;padding:22px 32px;border-top:1px solid #253545;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:top;">
                <div style="font-size:14px;font-weight:900;letter-spacing:2px;color:#ffffff;margin-bottom:4px;">RI <span style="color:#22c55e;">TENNIS</span> ACADEMY</div>
                <div style="font-size:11px;color:#8A9BAD;line-height:1.9;">
                  Coach Mario Llano · Rhode Island<br>
                  <a href="mailto:ritennismario@gmail.com" style="color:#22c55e;text-decoration:none;">ritennismario@gmail.com</a><br>
                  <a href="tel:4019655873" style="color:#8A9BAD;text-decoration:none;">401-965-5873</a>
                </div>
              </td>
              <td style="text-align:right;vertical-align:top;">
                <div style="font-size:10px;color:#8A9BAD;line-height:2.2;">
                  <a href="https://www.tennispromario.com" style="display:block;color:#8A9BAD;text-decoration:none;">tennispromario.com</a>
                  <a href="https://www.tennispromario.com/newsletter" style="display:block;color:#8A9BAD;text-decoration:none;">Newsletter Archive</a>
                </div>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="background:#0a1520;padding:12px 32px;text-align:center;font-size:10px;color:#3A5060;border-top:1px solid #253545;">
          You are receiving this because you are a student at RI Tennis Academy.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export const newsletterRouter = router({
  // ── Public: list published newsletters (archive page) ────────────────────────────────────────
  listPublished: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select({
        id: newsletters.id,
        slug: newsletters.slug,
        subject: newsletters.subject,
        season: newsletters.season,
        status: newsletters.status,
        publishedAt: newsletters.publishedAt,
        createdAt: newsletters.createdAt,
      })
      .from(newsletters)
      .where(eq(newsletters.status, "published"))
      .orderBy(desc(newsletters.publishedAt));
  }),

  // ── Public: get newsletter by slug (shareable URL) ─────────────────────────────────────────
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db
        .select()
        .from(newsletters)
        .where(eq(newsletters.slug, input.slug))
        .limit(1);
      if (!rows.length) throw new TRPCError({ code: "NOT_FOUND", message: "Newsletter not found" });
      return rows[0];
    }),

  // ── Admin: create newsletter with HTML content (for uploaded HTML newsletters) ─────────────────────────────────────────
  createWithHtml: adminProcedure
    .input(z.object({
      slug: z.string().min(1).max(200),
      subject: z.string().min(1).max(500),
      season: z.string().optional(),
      htmlContent: z.string().optional(),
      status: z.enum(["draft", "published"]).default("draft"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const now = new Date();
      await db.insert(newsletters).values({
        slug: input.slug,
        subject: input.subject,
        season: input.season || null,
        htmlContent: input.htmlContent || null,
        status: input.status,
        publishedAt: input.status === "published" ? now : null,
        includeSchedule: false,
        createdAt: now,
        updatedAt: now,
      });
      const rows = await db.select().from(newsletters).where(eq(newsletters.slug, input.slug)).limit(1);
      return rows[0];
    }),

  // ── Admin: publish/unpublish a newsletter ─────────────────────────────────────────
  setPublished: adminProcedure
    .input(z.object({ id: z.number(), published: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(newsletters).set({
        status: input.published ? "published" : "draft",
        publishedAt: input.published ? new Date() : null,
        updatedAt: new Date(),
      }).where(eq(newsletters.id, input.id));
      return { ok: true };
    }),

  // ── Get subscriber count (admin) ─────────────────────────────────────────
  getSubscriberCount: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { count: 0 };
    const rows = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.smsOptIn, true));
    return { count: Number(rows[0]?.count ?? 0) };
  }),

  // ── List newsletters (admin) ─────────────────────────────────────────────
  list: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(newsletters).orderBy(desc(newsletters.createdAt)).limit(50);
  }),

  // ── Get single newsletter (admin) ────────────────────────────────────────
  get: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const rows = await db.select().from(newsletters).where(eq(newsletters.id, input.id)).limit(1);
    if (!rows.length) throw new TRPCError({ code: "NOT_FOUND" });
    return rows[0];
  }),

  // ── Create newsletter draft (admin) ─────────────────────────────────────
  create: adminProcedure
    .input(z.object({
      subject: z.string().min(1),
      headline: z.string().optional(),
      body: z.string().optional(),
      tennisTip: z.string().optional(),
      mentalTip: z.string().optional(),
      winnerSpotlight: z.string().optional(),
      includeSchedule: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Generate a slug from subject + timestamp
      const slugBase = input.subject
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80);
      const slug = `${slugBase}-${Date.now()}`;
      const result = await db.insert(newsletters).values({
        slug,
        subject: input.subject,
        headline: input.headline || null,
        body: input.body || null,
        tennisTip: input.tennisTip || null,
        mentalTip: input.mentalTip || null,
        winnerSpotlight: input.winnerSpotlight || null,
        includeSchedule: input.includeSchedule,
        status: "draft",
      });
      return { id: Number((result as any).insertId), slug };
    }),

  // ── Update newsletter draft (admin) ─────────────────────────────────────
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      subject: z.string().min(1).optional(),
      headline: z.string().optional(),
      body: z.string().optional(),
      tennisTip: z.string().optional(),
      mentalTip: z.string().optional(),
      winnerSpotlight: z.string().optional(),
      includeSchedule: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...fields } = input;
      await db.update(newsletters).set({ ...fields, updatedAt: new Date() }).where(eq(newsletters.id, id));
      return { ok: true };
    }),

  // ── Delete newsletter draft (admin) ─────────────────────────────────────
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(newsletters).where(and(eq(newsletters.id, input.id), eq(newsletters.status, "draft")));
      return { ok: true };
    }),

  // ── AI-generate newsletter content (admin) ───────────────────────────────
  aiGenerate: adminProcedure
    .input(z.object({
      context: z.string().optional(), // Optional context/theme for this week
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are Coach Mario Llano from RI Tennis Academy in Rhode Island. Generate a weekly newsletter for tennis students. Return JSON with these exact fields:
{
  "subject": "Email subject line (engaging, max 60 chars)",
  "headline": "Newsletter headline (bold, inspiring, max 80 chars)",
  "body": "2-3 paragraph intro from Coach Mario (warm, motivating, personal)",
  "tennisTip": "One specific, actionable tennis technique tip (2-3 sentences)",
  "mentalTip": "One mental performance tip from the Delete Fear methodology (2-3 sentences)",
  "winnerSpotlight": "A fictional but realistic student achievement story (2-3 sentences, use a first name only)"
}`,
          },
          {
            role: "user",
            content: input.context
              ? `Generate a newsletter with this theme/context: ${input.context}`
              : "Generate this week's newsletter. Make it inspiring and practical.",
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "newsletter_content",
            strict: true,
            schema: {
              type: "object",
              properties: {
                subject: { type: "string" },
                headline: { type: "string" },
                body: { type: "string" },
                tennisTip: { type: "string" },
                mentalTip: { type: "string" },
                winnerSpotlight: { type: "string" },
              },
              required: ["subject", "headline", "body", "tennisTip", "mentalTip", "winnerSpotlight"],
              additionalProperties: false,
            },
          },
        },
      });
      const content = (response.choices[0]?.message?.content as string) || "{}";
      try {
        return JSON.parse(content);
      } catch {
        return { subject: "", headline: "", body: content, tennisTip: "", mentalTip: "", winnerSpotlight: "" };
      }
    }),

  // ── Send newsletter to all opted-in users (admin) ────────────────────────
  send: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Get newsletter
      const nlRows = await db.select().from(newsletters).where(eq(newsletters.id, input.id)).limit(1);
      if (!nlRows.length) throw new TRPCError({ code: "NOT_FOUND", message: "Newsletter not found" });
      const nl = nlRows[0];
      if (nl.status === "sent") throw new TRPCError({ code: "BAD_REQUEST", message: "Newsletter already sent" });

      // Get all users with email (smsOptIn is used as newsletter opt-in too)
      const subscribers = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(sql`${users.email} IS NOT NULL AND ${users.email} != ''`);

      if (!isEmailConfigured()) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Email not configured" });
      }

      const htmlBody = buildNewsletterHtml(nl);
      let sent = 0;
      for (const sub of subscribers) {
        if (!sub.email) continue;
        try {
          await sendNewsletterEmail(sub.email, sub.name || "Tennis Player", nl.subject, htmlBody);
          sent++;
        } catch (e: any) {
          console.error(`[Newsletter] Failed to send to ${sub.email}:`, e?.message);
        }
      }

      // Mark as sent
      await db.update(newsletters).set({
        status: "sent",
        sentAt: new Date(),
        recipientCount: sent,
        updatedAt: new Date(),
      }).where(eq(newsletters.id, input.id));

      return { sent, total: subscribers.length };
    }),

  // ── Send preview email to owner for approval (admin) ───────────────────────
  sendPreviewToOwner: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(newsletters).where(eq(newsletters.id, input.id)).limit(1);
      if (!rows.length) throw new TRPCError({ code: "NOT_FOUND", message: "Newsletter not found" });
      const nl = rows[0];
      if (!isEmailConfigured()) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Email not configured" });
      }
      const ownerEmail = process.env.EMAIL_USER;
      if (!ownerEmail) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Owner email not configured" });
      }
      const htmlBody = buildNewsletterHtml(nl);
      // Wrap with approval banner at top of body
      const approvalBanner = `<div style="background:#fff3cd;border:2px solid #ffc107;border-radius:8px;padding:16px 20px;margin:0 0 0 0;font-family:Arial,sans-serif;"><p style="margin:0 0 6px;font-size:15px;font-weight:bold;color:#856404;">&#128203; PREVIEW &mdash; For Your Approval Only</p><p style="margin:0;font-size:13px;color:#856404;">This is exactly how the newsletter will look to your students. Review it, then go back to the Newsletter Manager and click <strong>"Send to All Students"</strong> when ready.</p></div>`;
      const previewHtml = htmlBody.replace(/<body([^>]*)>/, `<body$1>${approvalBanner}`);
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_APP_PASSWORD },
      });
      await transporter.sendMail({
        from: `"RI Tennis Academy" <${process.env.EMAIL_USER}>`,
        to: ownerEmail,
        subject: `[PREVIEW FOR APPROVAL] ${nl.subject}`,
        html: previewHtml,
      });
      return { ok: true, sentTo: ownerEmail };
    }),

  // ── Preview newsletter HTML (admin) ─────────────────────────────────────
  preview: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(newsletters).where(eq(newsletters.id, input.id)).limit(1);
      if (!rows.length) throw new TRPCError({ code: "NOT_FOUND" });
      return { html: buildNewsletterHtml(rows[0]) };
    }),
});
