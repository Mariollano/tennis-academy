/**
 * Doubles League Router
 * Handles session listing, player sign-up (with Stripe), and admin matchmaking.
 * Sessions: Tue/Thu 5:30–7 PM, Sat 9–11 AM · $15/session · All skill levels
 */
import { z } from "zod";
import { router, publicProcedure, adminProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { doublesLeagueSessions, doublesLeagueSignups } from "../../drizzle/schema";
import { eq, and, gte, desc, asc, sql } from "drizzle-orm";
import Stripe from "stripe";
import { sendSms, isTwilioConfigured } from "../sms";
import { notifyOwner } from "../_core/notification";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime12h(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || "0", 10);
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function normalizeDate(raw: any): string {
  // MySQL date columns can come back as Date objects or "YYYY-MM-DD" strings
  if (raw instanceof Date) {
    const y = raw.getUTCFullYear();
    const m = String(raw.getUTCMonth() + 1).padStart(2, "0");
    const d = String(raw.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(raw).slice(0, 10);
}

function formatDateFriendly(rawDate: any): string {
  const dateStr = normalizeDate(rawDate);
  const d = new Date(dateStr + "T12:00:00"); // noon to avoid TZ edge cases
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function formatDateShort(rawDate: any): string {
  const dateStr = normalizeDate(rawDate);
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// Generate Tue/Thu/Sat sessions for the next N weeks starting from today
function generateSessionDates(weeksAhead: number): Array<{ date: string; dayOfWeek: "tuesday" | "thursday" | "saturday"; startTime: string; endTime: string }> {
  const sessions: Array<{ date: string; dayOfWeek: "tuesday" | "thursday" | "saturday"; startTime: string; endTime: string }> = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setDate(end.getDate() + weeksAhead * 7);

  const cursor = new Date(today);
  while (cursor <= end) {
    const dow = cursor.getDay(); // 0=Sun, 2=Tue, 4=Thu, 6=Sat
    if (dow === 2) {
      sessions.push({ date: cursor.toISOString().slice(0, 10), dayOfWeek: "tuesday", startTime: "18:30:00", endTime: "20:00:00" });
    } else if (dow === 4) {
      sessions.push({ date: cursor.toISOString().slice(0, 10), dayOfWeek: "thursday", startTime: "18:30:00", endTime: "20:00:00" });
    } else if (dow === 6) {
      sessions.push({ date: cursor.toISOString().slice(0, 10), dayOfWeek: "saturday", startTime: "09:00:00", endTime: "11:00:00" });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return sessions;
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const doublesLeagueRouter = router({
  // ── List upcoming sessions with signup counts ─────────────────────────────
  listSessions: publicProcedure
    .input(z.object({ weeksAhead: z.number().min(1).max(52).default(8) }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const rows = await db
        .select({
          id: doublesLeagueSessions.id,
          sessionDate: doublesLeagueSessions.sessionDate,
          startTime: doublesLeagueSessions.startTime,
          endTime: doublesLeagueSessions.endTime,
          dayOfWeek: doublesLeagueSessions.dayOfWeek,
          priceInCents: doublesLeagueSessions.priceInCents,
          notes: doublesLeagueSessions.notes,
        })
        .from(doublesLeagueSessions)
        .where(
          and(
            eq(doublesLeagueSessions.isActive, true),
            gte(doublesLeagueSessions.sessionDate, today.toISOString().slice(0, 10) as any)
          )
        )
        .orderBy(asc(doublesLeagueSessions.sessionDate));

      // Attach signup counts (paid + pending)
      const sessionIds = rows.map(r => r.id);
      if (sessionIds.length === 0) return [];

      const signupCounts = await db
        .select({
          sessionId: doublesLeagueSignups.sessionId,
          count: sql<number>`count(*)`,
        })
        .from(doublesLeagueSignups)
        .where(
          and(
            sql`${doublesLeagueSignups.sessionId} IN (${sql.join(sessionIds.map(id => sql`${id}`), sql`, `)})`,
            sql`${doublesLeagueSignups.status} != 'cancelled'`
          )
        )
        .groupBy(doublesLeagueSignups.sessionId);

      const countMap = new Map(signupCounts.map(r => [r.sessionId, Number(r.count)]));

      return rows.map(r => ({
        ...r,
        sessionDate: normalizeDate(r.sessionDate),
        startTime: String(r.startTime),
        endTime: String(r.endTime),
        signupCount: countMap.get(r.id) ?? 0,
        displayDate: formatDateFriendly(r.sessionDate),
        displayTime: `${formatTime12h(String(r.startTime))} – ${formatTime12h(String(r.endTime))}`,
      }));
    }),

  // ── Get first names of signed-up players (public display) ─────────────────
  getSignups: publicProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select({
          id: doublesLeagueSignups.id,
          firstName: sql<string>`SUBSTRING_INDEX(${doublesLeagueSignups.playerName}, ' ', 1)`,
          courtNumber: doublesLeagueSignups.courtNumber,
          partnerId: doublesLeagueSignups.partnerId,
        })
        .from(doublesLeagueSignups)
        .where(
          and(
            eq(doublesLeagueSignups.sessionId, input.sessionId),
            sql`${doublesLeagueSignups.status} != 'cancelled'`
          )
        )
        .orderBy(asc(doublesLeagueSignups.createdAt));
      return rows;
    }),

  // ── Sign up for a session ─────────────────────────────────────────────────
  signUp: publicProcedure
    .input(z.object({
      sessionId: z.number(),
      playerName: z.string().min(1).max(200),
      playerEmail: z.string().email(),
      playerPhone: z.string().max(20).optional(),
      paymentMethod: z.enum(["card", "cash", "check"]).default("card"),
      origin: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify session exists and is active
      const [session] = await db
        .select()
        .from(doublesLeagueSessions)
        .where(and(eq(doublesLeagueSessions.id, input.sessionId), eq(doublesLeagueSessions.isActive, true)))
        .limit(1);
      if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found or no longer available" });

      // Check for duplicate signup (same email, same session)
      const [existing] = await db
        .select({ id: doublesLeagueSignups.id })
        .from(doublesLeagueSignups)
        .where(
          and(
            eq(doublesLeagueSignups.sessionId, input.sessionId),
            eq(doublesLeagueSignups.playerEmail, input.playerEmail),
            sql`${doublesLeagueSignups.status} != 'cancelled'`
          )
        )
        .limit(1);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "You're already signed up for this session!" });

      const sessionDateStr = normalizeDate(session.sessionDate);
      const displayDate = formatDateShort(session.sessionDate);
      const displayTime = `${formatTime12h(String(session.startTime))} – ${formatTime12h(String(session.endTime))}`;

      // Insert signup record
      const [inserted] = await db.insert(doublesLeagueSignups).values({
        sessionId: input.sessionId,
        playerName: input.playerName,
        playerEmail: input.playerEmail,
        playerPhone: input.playerPhone || null,
        userId: ctx.user?.id || null,
        status: input.paymentMethod === "card" ? "pending" : "paid",
        paymentMethod: input.paymentMethod,
        paidAt: input.paymentMethod !== "card" ? new Date() : null,
      });

      const signupId = (inserted as any).insertId as number;

      // Notify Coach Mario
      try {
        await notifyOwner({
          title: `🎾 New Doubles League Signup`,
          content: `Player: ${input.playerName}\nEmail: ${input.playerEmail}\nPhone: ${input.playerPhone || "N/A"}\nSession: ${displayDate} ${displayTime}\nPayment: ${input.paymentMethod}`,
        });
      } catch {}

      // SMS to Mario
      if (isTwilioConfigured()) {
        const marioPhone = "4019655873";
        const marioMsg = `🎾 NEW DOUBLES SIGNUP! ${input.playerName} signed up for ${displayDate} ${displayTime}. Phone: ${input.playerPhone || "N/A"} Email: ${input.playerEmail} Payment: ${input.paymentMethod}`;
        sendSms(marioPhone, marioMsg).catch(() => {});
      }

      // If paying by card, create Stripe checkout
      if (input.paymentMethod === "card") {
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe not configured" });

        const stripe = new Stripe(stripeKey, { apiVersion: "2026-02-25.clover" as any });
        const stripeSession = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "payment",
          customer_email: input.playerEmail,
          allow_promotion_codes: true,
          line_items: [{
            price_data: {
              currency: "usd",
              unit_amount: session.priceInCents,
              product_data: {
                name: `Doubles League — ${displayDate}`,
                description: `RI Tennis Academy · ${displayTime} · All skill levels welcome`,
              },
            },
            quantity: 1,
          }],
          metadata: {
            type: "doubles_league",
            signup_id: signupId.toString(),
            session_id: input.sessionId.toString(),
            player_name: input.playerName,
            player_email: input.playerEmail,
            session_date: sessionDateStr,
          },
          client_reference_id: `doubles_${signupId}`,
          success_url: `${input.origin}/doubles-league?payment=success&signup=${signupId}`,
          cancel_url: `${input.origin}/doubles-league?payment=cancelled`,
        });

        // Save Stripe session ID
        await db.update(doublesLeagueSignups)
          .set({ stripeSessionId: stripeSession.id })
          .where(eq(doublesLeagueSignups.id, signupId));

        return { signupId, checkoutUrl: stripeSession.url, requiresPayment: true };
      }

      return { signupId, checkoutUrl: null, requiresPayment: false };
    }),

  // ── Admin: get full signup details for a session ──────────────────────────
  adminGetSignups: adminProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(doublesLeagueSignups)
        .where(eq(doublesLeagueSignups.sessionId, input.sessionId))
        .orderBy(asc(doublesLeagueSignups.createdAt));
    }),

  // ── Admin: assign doubles partner and court number ────────────────────────
  adminAssignPartner: adminProcedure
    .input(z.object({
      signupId: z.number(),
      partnerId: z.number().nullable(),
      courtNumber: z.number().nullable(),
      matchNotes: z.string().max(500).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(doublesLeagueSignups)
        .set({
          partnerId: input.partnerId,
          courtNumber: input.courtNumber,
          matchNotes: input.matchNotes || null,
        })
        .where(eq(doublesLeagueSignups.id, input.signupId));
      return { success: true };
    }),

  // ── Admin: generate recurring sessions for the next N weeks ──────────────
  generateSessions: adminProcedure
    .input(z.object({ weeksAhead: z.number().min(1).max(52).default(8) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const dates = generateSessionDates(input.weeksAhead);
      let created = 0;
      let skipped = 0;

      for (const s of dates) {
        // Check for existing session on this date
        const [existing] = await db
          .select({ id: doublesLeagueSessions.id })
          .from(doublesLeagueSessions)
          .where(eq(doublesLeagueSessions.sessionDate, s.date as any))
          .limit(1);

        if (existing) {
          skipped++;
          continue;
        }

        await db.insert(doublesLeagueSessions).values({
          sessionDate: s.date as any,
          startTime: s.startTime as any,
          endTime: s.endTime as any,
          dayOfWeek: s.dayOfWeek,
          priceInCents: 1500,
          isActive: true,
        });
        created++;
      }

      return { created, skipped, total: dates.length };
    }),

  // ── Admin: list all sessions (including past) ─────────────────────────────
  adminListSessions: adminProcedure
    .input(z.object({ includePast: z.boolean().default(false) }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const rows = await db
        .select({
          id: doublesLeagueSessions.id,
          sessionDate: doublesLeagueSessions.sessionDate,
          startTime: doublesLeagueSessions.startTime,
          endTime: doublesLeagueSessions.endTime,
          dayOfWeek: doublesLeagueSessions.dayOfWeek,
          priceInCents: doublesLeagueSessions.priceInCents,
          isActive: doublesLeagueSessions.isActive,
          notes: doublesLeagueSessions.notes,
        })
        .from(doublesLeagueSessions)
        .orderBy(desc(doublesLeagueSessions.sessionDate));

      // Attach signup counts
      const sessionIds = rows.map(r => r.id);
      if (sessionIds.length === 0) return [];

      const signupCounts = await db
        .select({
          sessionId: doublesLeagueSignups.sessionId,
          count: sql<number>`count(*)`,
        })
        .from(doublesLeagueSignups)
        .where(
          sql`${doublesLeagueSignups.sessionId} IN (${sql.join(sessionIds.map(id => sql`${id}`), sql`, `)})`
        )
        .groupBy(doublesLeagueSignups.sessionId);

      const countMap = new Map(signupCounts.map(r => [r.sessionId, Number(r.count)]));

      return rows.map(r => ({
        ...r,
        sessionDate: normalizeDate(r.sessionDate),
        startTime: String(r.startTime),
        endTime: String(r.endTime),
        signupCount: countMap.get(r.id) ?? 0,
        displayDate: formatDateFriendly(r.sessionDate),
        displayTime: `${formatTime12h(String(r.startTime))} – ${formatTime12h(String(r.endTime))}`,
      }));
    }),

  // ── Admin: mark a signup as paid (cash/check) ────────────────────────────
  adminMarkPaid: adminProcedure
    .input(z.object({ signupId: z.number(), paymentMethod: z.enum(["cash", "check"]) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(doublesLeagueSignups)
        .set({ status: "paid", paymentMethod: input.paymentMethod, paidAt: new Date() })
        .where(eq(doublesLeagueSignups.id, input.signupId));
      return { success: true };
    }),

  // ── Admin: cancel a signup ────────────────────────────────────────────────
  adminCancelSignup: adminProcedure
    .input(z.object({ signupId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(doublesLeagueSignups)
        .set({ status: "cancelled" })
        .where(eq(doublesLeagueSignups.id, input.signupId));
      return { success: true };
    }),
});
