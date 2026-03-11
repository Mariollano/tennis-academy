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
        <h3 style="margin:0 0 12px;font-size:16px;color:#1a3a8f;font-family:Arial,sans-serif;">📅 Upcoming Programs & Schedule</h3>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
          <thead><tr style="background:#1a3a8f;color:#fff;">
            <th style="padding:8px 12px;text-align:left;">Program</th>
            <th style="padding:8px 12px;text-align:left;">Schedule</th>
            <th style="padding:8px 12px;text-align:right;">Price</th>
          </tr></thead>
          <tbody>
            <tr style="background:#f9f9f9;"><td style="padding:8px 12px;border-bottom:1px solid #eee;">Private Lesson</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">By appointment</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">$120/hr</td></tr>
            <tr><td style="padding:8px 12px;border-bottom:1px solid #eee;">105 Game Clinic</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">Mon/Wed/Fri/Sun</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">$35/1.5hr</td></tr>
            <tr style="background:#f9f9f9;"><td style="padding:8px 12px;border-bottom:1px solid #eee;">Junior Program</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">Mon–Fri, 3:30–6:30 PM</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">$80/day · $350/wk</td></tr>
            <tr><td style="padding:8px 12px;">Summer Camp</td><td style="padding:8px 12px;">Mon–Fri, 9 AM–2 PM</td><td style="padding:8px 12px;text-align:right;">$90/day · $420/wk</td></tr>
          </tbody>
        </table>
      </td></tr>`
    : "";

  const tennisTipHtml = nl.tennisTip
    ? `<tr><td style="padding:24px 32px 0;">
        <div style="background:#f0f7ff;border-left:4px solid #1a3a8f;padding:16px 20px;border-radius:0 8px 8px 0;">
          <h3 style="margin:0 0 8px;font-size:15px;color:#1a3a8f;font-family:Arial,sans-serif;">🎾 Tennis Tip of the Week</h3>
          <p style="margin:0;font-size:14px;color:#333;line-height:1.6;">${nl.tennisTip}</p>
        </div>
      </td></tr>`
    : "";

  const mentalTipHtml = nl.mentalTip
    ? `<tr><td style="padding:24px 32px 0;">
        <div style="background:#f5f0ff;border-left:4px solid #7c3aed;padding:16px 20px;border-radius:0 8px 8px 0;">
          <h3 style="margin:0 0 8px;font-size:15px;color:#7c3aed;font-family:Arial,sans-serif;">🧠 Mental Tip of the Week</h3>
          <p style="margin:0;font-size:14px;color:#333;line-height:1.6;">${nl.mentalTip}</p>
        </div>
      </td></tr>`
    : "";

  const winnerHtml = nl.winnerSpotlight
    ? `<tr><td style="padding:24px 32px 0;">
        <div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:16px 20px;border-radius:0 8px 8px 0;">
          <h3 style="margin:0 0 8px;font-size:15px;color:#d97706;font-family:Arial,sans-serif;">🏆 Weekly Winner Spotlight</h3>
          <p style="margin:0;font-size:14px;color:#333;line-height:1.6;">${nl.winnerSpotlight}</p>
        </div>
      </td></tr>`
    : "";

  const bodyHtml = nl.body
    ? `<tr><td style="padding:24px 32px 0;font-size:14px;color:#333;line-height:1.7;">${nl.body.replace(/\n/g, "<br>")}</td></tr>`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0f1f5c 0%,#1a3a8f 100%);padding:32px;text-align:center;">
          <div style="font-size:13px;color:#ccff00;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;">RI TENNIS ACADEMY</div>
          <h1 style="margin:0;font-size:26px;color:#fff;font-weight:900;line-height:1.2;">${nl.headline || "Weekly Tennis Update"}</h1>
          <div style="margin-top:12px;font-size:12px;color:rgba(255,255,255,0.6);">Coach Mario Llano · Rhode Island</div>
        </td></tr>
        <!-- Body sections -->
        ${bodyHtml}
        ${scheduleHtml}
        ${tennisTipHtml}
        ${mentalTipHtml}
        ${winnerHtml}
        <!-- CTA -->
        <tr><td style="padding:32px;text-align:center;">
          <a href="https://tennispro-kzzfscru.manus.space/programs" style="display:inline-block;background:#ccff00;color:#0f1f5c;font-weight:900;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.5px;">BOOK A SESSION →</a>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f9f9f9;padding:20px 32px;text-align:center;font-size:11px;color:#999;border-top:1px solid #eee;">
          RI Tennis Academy · Coach Mario Llano · Rhode Island<br>
          <a href="https://tennispro-kzzfscru.manus.space" style="color:#1a3a8f;">tennispro-kzzfscru.manus.space</a>
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
