/**
 * Gift Cards Router
 * Allows users to purchase a session as a gift for a friend.
 * Gift cards are redeemed during checkout to get a free session.
 */
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { giftCards, users } from "../../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import Stripe from "stripe";
import nodemailer from "nodemailer";
import { isEmailConfigured } from "../email";

// Admin guard
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});

// Generate a unique gift card code: GIFT-XXXX-XXXX
function generateGiftCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `GIFT-${seg()}-${seg()}`;
}

// Program options for gift cards
const GIFT_PROGRAMS = [
  { type: "private_lesson", label: "1 Private Lesson (1 hour)", amountInCents: 12000 },
  { type: "clinic_105", label: "1 x 105 Game Clinic Session", amountInCents: 3500 },
  { type: "junior_daily", label: "1 Junior Program Day", amountInCents: 8000 },
  { type: "summer_camp_daily", label: "1 Summer Camp Day", amountInCents: 9000 },
];

// Send gift card email to recipient
async function sendGiftCardEmail(opts: {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  message: string;
  code: string;
  programLabel: string;
  amountInCents: number;
}): Promise<void> {
  if (!isEmailConfigured()) return;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_APP_PASSWORD },
  });
  const amount = (opts.amountInCents / 100).toFixed(2);
  await transporter.sendMail({
    from: `"RI Tennis Academy" <${process.env.EMAIL_USER}>`,
    to: `${opts.recipientName} <${opts.recipientEmail}>`,
    subject: `🎾 You've received a Tennis Gift Card from ${opts.senderName}!`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#0f1f5c 0%,#1a3a8f 100%);padding:32px;text-align:center;">
          <div style="font-size:13px;color:#ccff00;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;">RI TENNIS ACADEMY</div>
          <h1 style="margin:0;font-size:28px;color:#fff;font-weight:900;">🎾 Gift Card</h1>
        </td></tr>
        <tr><td style="padding:32px;text-align:center;">
          <p style="font-size:16px;color:#333;margin:0 0 16px;">Hi <strong>${opts.recipientName}</strong>!</p>
          <p style="font-size:15px;color:#555;margin:0 0 24px;line-height:1.6;"><strong>${opts.senderName}</strong> has gifted you a tennis session at RI Tennis Academy!</p>
          ${opts.message ? `<div style="background:#f9f9f9;border-radius:8px;padding:16px;margin:0 0 24px;font-style:italic;color:#555;">"${opts.message}"</div>` : ""}
          <div style="background:linear-gradient(135deg,#0f1f5c,#1a3a8f);border-radius:12px;padding:24px;margin:0 0 24px;">
            <div style="font-size:13px;color:#ccff00;font-weight:700;letter-spacing:2px;margin-bottom:8px;">YOUR GIFT</div>
            <div style="font-size:18px;color:#fff;font-weight:700;margin-bottom:8px;">${opts.programLabel}</div>
            <div style="font-size:28px;color:#ccff00;font-weight:900;margin-bottom:16px;">$${amount}</div>
            <div style="background:rgba(255,255,255,0.1);border-radius:8px;padding:12px;display:inline-block;">
              <div style="font-size:11px;color:rgba(255,255,255,0.7);margin-bottom:4px;letter-spacing:1px;">GIFT CODE</div>
              <div style="font-size:22px;color:#fff;font-weight:900;letter-spacing:3px;font-family:monospace;">${opts.code}</div>
            </div>
          </div>
          <p style="font-size:13px;color:#888;margin:0 0 24px;">Enter this code during checkout to redeem your free session. Valid for 1 year.</p>
          <a href="https://tennispro-kzzfscru.manus.space/programs" style="display:inline-block;background:#ccff00;color:#0f1f5c;font-weight:900;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;">BOOK YOUR SESSION →</a>
        </td></tr>
        <tr><td style="background:#f9f9f9;padding:20px 32px;text-align:center;font-size:11px;color:#999;border-top:1px solid #eee;">
          RI Tennis Academy · Coach Mario Llano · Rhode Island
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

export const giftCardsRouter = router({
  // ── List available program options ───────────────────────────────────────
  getProgramOptions: publicProcedure.query(() => {
    return GIFT_PROGRAMS;
  }),

  // ── Purchase a gift card (creates Stripe checkout) ───────────────────────
  purchase: protectedProcedure
    .input(z.object({
      programType: z.string(),
      recipientName: z.string().min(1),
      recipientEmail: z.string().email().optional(),
      recipientMessage: z.string().max(500).optional(),
      origin: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const program = GIFT_PROGRAMS.find(p => p.type === input.programType);
      if (!program) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid program type" });

      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe not configured" });

      const stripe = new Stripe(stripeKey, { apiVersion: "2026-02-25.clover" as any });

      // Pre-generate the gift code
      const code = generateGiftCode();

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: ctx.user.email || undefined,
        allow_promotion_codes: true,
        line_items: [{
          price_data: {
            currency: "usd",
            unit_amount: program.amountInCents,
            product_data: {
              name: `🎾 Gift Card: ${program.label}`,
              description: `For ${input.recipientName} — RI Tennis Academy`,
            },
          },
          quantity: 1,
        }],
        metadata: {
          type: "gift_card",
          gift_code: code,
          purchaser_user_id: ctx.user.id.toString(),
          purchaser_email: ctx.user.email || "",
          purchaser_name: ctx.user.name || "",
          recipient_name: input.recipientName,
          recipient_email: input.recipientEmail || "",
          recipient_message: input.recipientMessage || "",
          program_type: input.programType,
          program_label: program.label,
          amount_in_cents: program.amountInCents.toString(),
        },
        client_reference_id: ctx.user.id.toString(),
        success_url: `${input.origin}/gift-card/success?code=${code}&recipient=${encodeURIComponent(input.recipientName)}`,
        cancel_url: `${input.origin}/gift-card`,
      });

      return { checkoutUrl: session.url };
    }),

  // ── Validate a gift card code (public — used during booking checkout) ────
  validate: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(giftCards).where(eq(giftCards.code, input.code.toUpperCase())).limit(1);
      if (!rows.length) return { valid: false, message: "Gift card not found" };
      const card = rows[0];
      if (card.status === "redeemed") return { valid: false, message: "This gift card has already been redeemed" };
      if (card.status === "expired") return { valid: false, message: "This gift card has expired" };
      if (card.expiresAt && card.expiresAt < new Date()) return { valid: false, message: "This gift card has expired" };
      return {
        valid: true,
        programType: card.programType,
        programLabel: card.programLabel,
        amountInCents: card.amountInCents,
        message: `Gift card valid for ${card.programLabel}`,
      };
    }),

  // ── Redeem a gift card (marks as redeemed after booking) ─────────────────
  redeem: protectedProcedure
    .input(z.object({ code: z.string(), bookingId: z.number().optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(giftCards).where(eq(giftCards.code, input.code.toUpperCase())).limit(1);
      if (!rows.length) throw new TRPCError({ code: "NOT_FOUND", message: "Gift card not found" });
      const card = rows[0];
      if (card.status !== "active") throw new TRPCError({ code: "BAD_REQUEST", message: "Gift card is not active" });
      await db.update(giftCards).set({
        status: "redeemed",
        redeemedByUserId: ctx.user.id,
        redeemedAt: new Date(),
      }).where(eq(giftCards.id, card.id));
      return { ok: true };
    }),

  // ── List my purchased gift cards ─────────────────────────────────────────
  myCards: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(giftCards)
      .where(eq(giftCards.purchasedByUserId, ctx.user.id))
      .orderBy(desc(giftCards.createdAt))
      .limit(20);
  }),

  // ── Admin: list all gift cards ───────────────────────────────────────────
  adminList: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(giftCards).orderBy(desc(giftCards.createdAt)).limit(100);
  }),

  // ── Admin: manually create a gift card (e.g., for a promo) ──────────────
  adminCreate: adminProcedure
    .input(z.object({
      programType: z.string(),
      recipientName: z.string().min(1),
      recipientEmail: z.string().email().optional(),
      recipientMessage: z.string().optional(),
      purchasedByUserId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const program = GIFT_PROGRAMS.find(p => p.type === input.programType);
      if (!program) throw new TRPCError({ code: "BAD_REQUEST" });
      const code = generateGiftCode();
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      await db.insert(giftCards).values({
        code,
        purchasedByUserId: input.purchasedByUserId,
        recipientName: input.recipientName,
        recipientEmail: input.recipientEmail || null,
        recipientMessage: input.recipientMessage || null,
        programType: input.programType,
        programLabel: program.label,
        amountInCents: program.amountInCents,
        status: "active",
        expiresAt,
      });
      return { code };
    }),
});
