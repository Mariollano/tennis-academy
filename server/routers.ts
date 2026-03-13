import { z } from "zod";
import { stripeRouter } from "./stripeRouter";
import { promoCodeRouter } from "./promoCodeRouter";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { sdk } from "./_core/sdk";
import { ENV } from "./_core/env";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "./_core/llm";
import { sendSms, sendBulkSms, isTwilioConfigured } from "./sms";
import { sendBookingConfirmation, sendBookingConfirmed, sendBookingCancelled, sendBookingReminder, sendBookingReservedCash, isEmailConfigured } from "./email";
import { maybeRewardReferrer } from "./referral";
import { postAnnouncement, getAnnouncements, markAnnouncementRead, getUnreadCount, deleteAnnouncement } from "./announcements";

// Convert "HH:MM:SS" or "HH:MM" to "9:00 AM" style
function formatTime12h(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || "0", 10);
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}
import { getDb } from "./db";
import {
  users, bookings, programs, scheduleSlots, payments,
  smsBroadcasts, mentalCoachingResources, merchandise, tournamentBookings, tournamentParticipants,
  blockedTimes, sessionWaitlist, scheduledReminders
} from "../drizzle/schema";
import { newsletterRouter } from "./routers/newsletter";
import { giftCardsRouter } from "./routers/giftCards";
import { leaderboardRouter } from "./routers/leaderboard";
import { voiceBookingRouter } from "./routers/voiceBooking";
import { eq, desc, and, sql, gte, lte, or } from "drizzle-orm";

function buildProgramScheduleHtml(): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:#1a3a8f;color:#fff;">
          <th style="padding:8px 12px;text-align:left;">Program</th>
          <th style="padding:8px 12px;text-align:left;">Schedule</th>
          <th style="padding:8px 12px;text-align:right;">Price</th>
        </tr>
      </thead>
      <tbody>
        <tr style="background:#f9f9f9;"><td style="padding:8px 12px;border-bottom:1px solid #eee;">Private Lesson (1-on-1)</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">By appointment</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">$120 / hr</td></tr>
        <tr><td style="padding:8px 12px;border-bottom:1px solid #eee;">105 Game Adult Clinic</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">See schedule</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">$35 / 1.5 hr</td></tr>
        <tr style="background:#f9f9f9;"><td style="padding:8px 12px;border-bottom:1px solid #eee;">Junior Program – Daily</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">Mon–Fri, 3:30–6:30 PM</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">$80 / day</td></tr>
        <tr><td style="padding:8px 12px;border-bottom:1px solid #eee;">Junior Program – Weekly</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">Mon–Fri, 3:30–6:30 PM</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">$350 / week</td></tr>
        <tr style="background:#f9f9f9;"><td style="padding:8px 12px;border-bottom:1px solid #eee;">Summer Camp – Daily</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">Mon–Fri, 9 AM–2 PM</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">$90 / day</td></tr>
        <tr><td style="padding:8px 12px;border-bottom:1px solid #eee;">Summer Camp – Weekly</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">Mon–Fri, 9 AM–2 PM</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">$420 / week</td></tr>
        <tr style="background:#f9f9f9;"><td style="padding:8px 12px;border-bottom:1px solid #eee;">After Camp</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">2–5 PM (add-on)</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">+$20/day or $50 afternoon</td></tr>
        <tr><td style="padding:8px 12px;">Mental Coaching</td><td style="padding:8px 12px;">By appointment</td><td style="padding:8px 12px;text-align:right;">Contact for pricing</td></tr>
      </tbody>
    </table>`;
}

// Admin guard middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  newsletter: newsletterRouter,
  giftCards: giftCardsRouter,
  leaderboard: leaderboardRouter,
  voiceBooking: voiceBookingRouter,
  promoCodes: promoCodeRouter,

  // ─── Announcements ──────────────────────────────────────────────────────────
  announcements: router({
    // Public: get all announcements (with read status if logged in)
    list: publicProcedure.query(async ({ ctx }) => {
      return getAnnouncements(ctx.user?.id);
    }),

    // Protected: get unread count for badge
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      const count = await getUnreadCount(ctx.user.id);
      return { count };
    }),

    // Protected: mark an announcement as read
    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await markAnnouncementRead(input.id, ctx.user.id);
        return { success: true };
      }),

    // Admin: post a new announcement and broadcast it
    post: adminProcedure
      .input(z.object({
        title: z.string().min(1).max(200),
        body: z.string().min(1),
        type: z.enum(["info", "cancellation", "rain_cancellation", "schedule_change", "urgent", "event"]),
        sendEmail: z.boolean().default(true),
        sendSms: z.boolean().default(false),
        targetProgram: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await postAnnouncement({
          ...input,
          targetProgram: input.targetProgram || null,
          createdBy: ctx.user.id,
        });
        return result;
      }),

    // Admin: delete an announcement
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteAnnouncement(input.id);
        return { success: true };
      }),
  }),

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    // Simple password-only admin login — no OAuth required
    adminLogin: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Ritennismario";
        if (input.password !== ADMIN_PASSWORD) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Incorrect password" });
        }
        // Find or create the owner admin user
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const ownerOpenId = ENV.ownerOpenId || "admin-local";
        let adminUser = await db.select().from(users).where(eq(users.openId, ownerOpenId)).limit(1).then(r => r[0] ?? null);
        if (!adminUser) {
          // Create admin user record if it doesn't exist
          await db.insert(users).values({
            openId: ownerOpenId,
            name: "Coach Mario",
            email: null,
            role: "admin",
            loginMethod: "password",
            lastSignedIn: new Date(),
          }).onDuplicateKeyUpdate({ set: { role: "admin", lastSignedIn: new Date() } });
          adminUser = await db.select().from(users).where(eq(users.openId, ownerOpenId)).limit(1).then(r => r[0] ?? null);
        } else if (adminUser.role !== "admin") {
          await db.update(users).set({ role: "admin", lastSignedIn: new Date() }).where(eq(users.openId, ownerOpenId));
        } else {
          await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.openId, ownerOpenId));
        }
        // Issue session cookie
        const token = await sdk.createSessionToken(ownerOpenId, { name: "Coach Mario" });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true };
      }),
  }),

  // ─── User Profile ───────────────────────────────────────────────────────────
  user: router({
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        smsOptIn: z.boolean().optional(),
        newsletterOptIn: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const updateData: Record<string, any> = { updatedAt: new Date() };
        if (input.name !== undefined) updateData.name = input.name;
        if (input.phone !== undefined) updateData.phone = input.phone;
        if (input.smsOptIn !== undefined) {
          updateData.smsOptIn = input.smsOptIn;
          if (input.smsOptIn) updateData.smsOptInAt = new Date();
        }
        if (input.newsletterOptIn !== undefined) {
          updateData.newsletterOptIn = input.newsletterOptIn;
          if (input.newsletterOptIn) updateData.newsletterOptInAt = new Date();
        }
        await db.update(users).set(updateData).where(eq(users.id, ctx.user.id));
        return { success: true };
      }),

    getMyBookings: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db.select({
        id: bookings.id,
        status: bookings.status,
        totalAmountCents: bookings.totalAmountCents,
        sessionDate: bookings.sessionDate,
        createdAt: bookings.createdAt,
        programName: programs.name,
        programType: programs.type,
      })
        .from(bookings)
        .leftJoin(programs, eq(bookings.programId, programs.id))
        .where(eq(bookings.userId, ctx.user.id))
        .orderBy(desc(bookings.createdAt))
        .limit(50);
      return rows;
    }),

    cancelBooking: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        // Fetch the booking and verify ownership
        const [booking] = await db.select().from(bookings).where(eq(bookings.id, input.id)).limit(1);
        if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found." });
        if (booking.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "You can only cancel your own bookings." });
        if (booking.status === "cancelled") throw new TRPCError({ code: "BAD_REQUEST", message: "Booking is already cancelled." });
        if (booking.status === "completed") throw new TRPCError({ code: "BAD_REQUEST", message: "Completed bookings cannot be cancelled." });
        // Cancel the booking
        await db.update(bookings).set({ status: "cancelled", updatedAt: new Date() }).where(eq(bookings.id, input.id));
        // If it was a 105 Clinic slot, decrement enrollment count
        if (booking.scheduleSlotId) {
          await db.update(scheduleSlots)
            .set({ currentParticipants: sql`GREATEST(currentParticipants - 1, 0)` })
            .where(eq(scheduleSlots.id, booking.scheduleSlotId));
        }
        return { success: true };
      }),

    // Get the user's referral code and stats
    getReferralInfo: protectedProcedure.query(async ({ ctx }) => {
      const { ensureReferralCode } = await import("./referral");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Ensure they have a code
      const code = await ensureReferralCode(ctx.user.id, ctx.user.name || null);
      // Count how many referrals they've made
      const { referrals } = await import("../drizzle/schema");
      const allReferrals = await db.select().from(referrals).where(eq(referrals.referrerId, ctx.user.id));
      const totalReferrals = allReferrals.length;
      const rewardedReferrals = allReferrals.filter(r => r.status === "rewarded").length;
      return {
        referralCode: code,
        referralLink: `https://tennispromario.com?ref=${code}`,
        totalReferrals,
        rewardedReferrals,
      };
    }),
  }),

  // ─── Programs ───────────────────────────────────────────────────────────────
  programs: router({
    list: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(programs).where(eq(programs.isActive, true));
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;
        const result = await db.select().from(programs).where(eq(programs.id, input.id)).limit(1);
        return result[0] || null;
      }),

    // Admin: create/update program
    upsert: adminProcedure
      .input(z.object({
        id: z.number().optional(),
        name: z.string(),
        type: z.enum(["private_lesson","clinic_105","junior_daily","junior_weekly","summer_camp_daily","summer_camp_weekly","after_camp","mental_coaching","tournament_attendance","stringing","merchandise"]),
        description: z.string().optional(),
        priceInCents: z.number(),
        durationMinutes: z.number().optional(),
        season: z.enum(["fall","spring","summer","year_round"]).optional(),
        maxParticipants: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        if (input.id) {
          await db.update(programs).set({ ...input, updatedAt: new Date() }).where(eq(programs.id, input.id));
          return { success: true };
        }
        await db.insert(programs).values({ ...input, isActive: input.isActive ?? true });
        return { success: true };
      }),
  }),

  // ─── Bookings ───────────────────────────────────────────────────────────────
  booking: router({
    create: publicProcedure
      .input(z.object({
        programType: z.string(),
        // Guest fields (required when not signed in)
        guestName: z.string().optional(),
        guestEmail: z.string().email().optional(),
        guestPhone: z.string().optional(),
        sessionDate: z.string().optional(),
        scheduleSlotId: z.number().optional(), // link booking to a specific schedule slot
        sessionStartTime: z.string().optional(), // HH:MM:SS for private lessons
        sessionEndTime: z.string().optional(),   // HH:MM:SS for private lessons
        pricingOption: z.string(),
        afterCampAddon: z.boolean().optional(),
        notes: z.string().optional(),
        totalAmountCents: z.number(),
        weekStartDate: z.string().optional(),
        sharedStudentCount: z.number().optional(),
        stringProvidedBy: z.enum(["academy","customer"]).optional(),
        merchandiseSize: z.string().optional(),
        quantity: z.number().optional(),
        paymentMethod: z.enum(["card", "cash", "check"]).default("card"),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Resolve user: use logged-in user if available, otherwise find/create guest by email
        let resolvedUserId: number;
        if (ctx.user) {
          resolvedUserId = ctx.user.id;
        } else {
          // Guest booking — require name + email
          if (!input.guestEmail || !input.guestName) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Name and email are required to book as a guest." });
          }
          // Find existing user by email or create a new guest record
          const existingUsers = await db.select({ id: users.id })
            .from(users)
            .where(eq(users.email, input.guestEmail))
            .limit(1);
          if (existingUsers[0]) {
            resolvedUserId = existingUsers[0].id;
          } else {
            const guestInsert = await db.insert(users).values({
              openId: `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`,
              name: input.guestName,
              email: input.guestEmail,
              phone: input.guestPhone || null,
              role: "user",
            });
            resolvedUserId = Number((guestInsert as any).insertId);
          }
        }

        // If a schedule slot is selected, enforce capacity
        if (input.scheduleSlotId) {
          const slotRows = await db.select().from(scheduleSlots)
            .where(eq(scheduleSlots.id, input.scheduleSlotId)).limit(1);
          const slot = slotRows[0];
          if (!slot) throw new TRPCError({ code: "NOT_FOUND", message: "Session slot not found." });
          if (!slot.isAvailable) throw new TRPCError({ code: "BAD_REQUEST", message: "This session is no longer available." });
          if (slot.currentParticipants >= slot.maxParticipants) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Sorry, this session is full. Please choose another time." });
          }
        }

        // Find or create a matching program
        const existingPrograms = await db.select().from(programs)
          .where(and(eq(programs.type, input.programType as any), eq(programs.isActive, true)))
          .limit(1);

        let programId = existingPrograms[0]?.id;
        if (!programId) {
          const result = await db.insert(programs).values({
            name: input.programType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
            type: input.programType as any,
            priceInCents: input.totalAmountCents,
            isActive: true,
          });
          programId = Number((result as any).insertId);
        }

        // ✅ FIX #6: capture insertId directly to avoid race condition
        const bookingInsertResult = await db.insert(bookings).values({
          userId: resolvedUserId,
          programId,
          scheduleSlotId: input.scheduleSlotId || null,
          totalAmountCents: input.totalAmountCents,
          // Append T12:00:00 to avoid UTC midnight shifting the date by one day in EST
          sessionDate: input.sessionDate ? new Date(input.sessionDate + "T12:00:00") as any : undefined,
          sessionStartTime: input.sessionStartTime || null,
          sessionEndTime: input.sessionEndTime || null,
          weekStartDate: input.weekStartDate ? new Date(input.weekStartDate + "T12:00:00") as any : undefined,
          sharedStudentCount: input.sharedStudentCount || 1,
          stringProvidedBy: input.stringProvidedBy,
          merchandiseSize: input.merchandiseSize,
          quantity: input.quantity || 1,
          notes: input.notes,
          paymentMethod: input.paymentMethod,
          // Cash/check bookings are immediately confirmed (spot reserved); card bookings stay pending until payment
          status: (input.paymentMethod === "cash" || input.paymentMethod === "check") ? "confirmed" : "pending",
        });
        const newBookingId = Number((bookingInsertResult as any).insertId) || 0;

        // Increment participant count on the slot
        if (input.scheduleSlotId) {
          await db.update(scheduleSlots)
            .set({ currentParticipants: sql`${scheduleSlots.currentParticipants} + 1`, updatedAt: new Date() })
            .where(eq(scheduleSlots.id, input.scheduleSlotId));
        }

        const programLabel = input.programType.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
        const dateStr = input.sessionDate
          ? new Date(input.sessionDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
          : undefined;
        // Build time string: show range if both times present, just start if only one, or extract from notes
        let timeStr: string | undefined;
        if (input.sessionStartTime && input.sessionEndTime) {
          timeStr = `${formatTime12h(input.sessionStartTime)} – ${formatTime12h(input.sessionEndTime)}`;
        } else if (input.sessionStartTime) {
          timeStr = formatTime12h(input.sessionStartTime);
        } else if (input.notes) {
          // Fallback: extract preferred time from notes (e.g. "[Preferred time: 11:00]")
          const m = input.notes.match(/\[Preferred time:\s*([\d:]+)\]/);
          if (m) {
            const raw = m[1].includes(":") ? m[1] + ":00" : m[1] + ":00:00";
            timeStr = formatTime12h(raw);
          }
        }

        const isCashOrCheck = input.paymentMethod === "cash" || input.paymentMethod === "check";
        const paymentLabel = input.paymentMethod === "check" ? "check" : "cash";

        const notifyEmail = ctx.user?.email || input.guestEmail;
        const notifyName = ctx.user?.name || input.guestName || "there";
        const notifyPhone = ctx.user?.phone || input.guestPhone;

        // Send email confirmation to the student
        if (isEmailConfigured() && notifyEmail) {
          if (isCashOrCheck) {
            // Cash/check: spot is reserved — send the "reserved" email with payment-at-lesson note
            sendBookingReservedCash({
              toEmail: notifyEmail!,
              toName: notifyName,
              programLabel,
              sessionDate: dateStr,
              sessionTime: timeStr,
              bookingId: newBookingId,
              paymentMethod: input.paymentMethod as "cash" | "check",
            }).catch(() => {});
          } else {
            sendBookingConfirmation({
              toEmail: notifyEmail!,
              toName: notifyName,
              programLabel,
              sessionDate: dateStr,
              sessionTime: timeStr,
              bookingId: newBookingId,
            }).catch(() => {}); // non-blocking
          }
        }

        // Send SMS confirmation to the student
        if (isTwilioConfigured() && notifyPhone) {
          const smsDateStr = input.sessionDate
            ? new Date(input.sessionDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
            : "";
          const smsTimePart = timeStr ? ` at ${timeStr}` : "";
          const msg = isCashOrCheck
            ? `Hi ${notifyName}! ✅ Your spot for ${programLabel}${smsDateStr ? " on " + smsDateStr : ""}${smsTimePart} is RESERVED. Please bring ${paymentLabel} to the lesson. Questions? Call/text 401-965-5873. Reply STOP to unsubscribe.`
            : `Hi ${notifyName}! ✅ Booking received for ${programLabel}${smsDateStr ? " on " + smsDateStr : ""}${smsTimePart}. Mario will confirm your spot shortly. Questions? Call/text 401-965-5873. Reply STOP to unsubscribe.`;
          await sendSms(notifyPhone!, msg).catch(() => {}); // non-blocking
        }

        // Check if this is the user's first booking and reward the referrer if applicable
        maybeRewardReferrer(resolvedUserId).catch(() => {});

        return { success: true, paymentMethod: input.paymentMethod, bookingId: newBookingId };
      }),

    // Admin: list all bookings
    adminList: adminProcedure
      .input(z.object({ status: z.string().optional(), limit: z.number().default(50) }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const conditions = input.status ? [eq(bookings.status, input.status as any)] : [];
        return db.select({
          booking: bookings,
          user: { id: users.id, name: users.name, email: users.email, phone: users.phone },
          program: { id: programs.id, name: programs.name, type: programs.type },
        })
          .from(bookings)
          .leftJoin(users, eq(bookings.userId, users.id))
          .leftJoin(programs, eq(bookings.programId, programs.id))
          .where(conditions.length ? and(...conditions) : undefined)
          .orderBy(desc(bookings.createdAt))
          .limit(input.limit);
      }),

    // Admin: update booking status
    updateStatus: adminProcedure
      .input(z.object({ id: z.number(), status: z.enum(["pending","confirmed","cancelled","completed"]) }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        // Fetch current booking to check previous status and scheduleSlotId
        const [existing] = await db.select().from(bookings).where(eq(bookings.id, input.id)).limit(1);
        await db.update(bookings).set({ status: input.status, updatedAt: new Date() }).where(eq(bookings.id, input.id));
        // Sync slot participant counter when moving to/from active statuses
        if (existing?.scheduleSlotId) {
          const wasActive = ["pending", "confirmed"].includes(existing.status);
          const isNowActive = ["pending", "confirmed"].includes(input.status);
          if (wasActive && !isNowActive) {
            // Booking deactivated — decrement counter
            await db.update(scheduleSlots)
              .set({ currentParticipants: sql`GREATEST(currentParticipants - 1, 0)`, updatedAt: new Date() })
              .where(eq(scheduleSlots.id, existing.scheduleSlotId));
          } else if (!wasActive && isNowActive) {
            // Booking reactivated — increment counter
            await db.update(scheduleSlots)
              .set({ currentParticipants: sql`${scheduleSlots.currentParticipants} + 1`, updatedAt: new Date() })
              .where(eq(scheduleSlots.id, existing.scheduleSlotId));
          }
        }
        return { success: true };
      }),

    // Admin: confirm a booking immediately (no charge) — marks it confirmed
    confirmNow: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.update(bookings)
          .set({ status: "confirmed", paidAt: new Date(), updatedAt: new Date() })
          .where(eq(bookings.id, input.id));

        // Send confirmation email + SMS to the student
        try {
          const rows = await db.select({
            booking: bookings,
            user: { id: users.id, name: users.name, email: users.email, phone: users.phone },
            programName: programs.name,
          })
            .from(bookings)
            .leftJoin(users, eq(bookings.userId, users.id))
            .leftJoin(programs, eq(bookings.programId, programs.id))
            .where(eq(bookings.id, input.id))
            .limit(1);

          if (rows.length) {
            const { booking, user, programName } = rows[0];
            const sessionDate = booking.sessionDate
              ? new Date(booking.sessionDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
              : undefined;
            const sessionTime = booking.sessionStartTime && booking.sessionEndTime
              ? `${formatTime12h(booking.sessionStartTime)} – ${formatTime12h(booking.sessionEndTime)}`
              : undefined;

            if (user?.email && isEmailConfigured()) {
              await sendBookingConfirmed({
                toEmail: user.email,
                toName: user.name || "Student",
                programLabel: programName || "Tennis Session",
                sessionDate,
                sessionTime,
                bookingId: booking.id,
              });
            }

            if (user?.phone && isTwilioConfigured()) {
              const dateStr = sessionDate ? ` on ${sessionDate}` : "";
              const timeStr = sessionTime ? ` at ${sessionTime}` : "";
              await sendSms(
                user.phone,
                `Hi ${user.name || "there"}! Your ${programName || "tennis session"} booking #${booking.id}${dateStr}${timeStr} has been CONFIRMED by Coach Mario. See you on the court! — RI Tennis Academy`
              );
            }
          }
        } catch (notifyErr: any) {
          console.error("[confirmNow] Failed to send confirmation notification:", notifyErr?.message);
          // Don't fail the mutation — booking is confirmed regardless
        }

        return { success: true };
      }),

    // Admin: cancel a booking and notify the student via email + SMS
    cancelNow: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Fetch current booking to check scheduleSlotId and status
        const [existing] = await db.select().from(bookings).where(eq(bookings.id, input.id)).limit(1);
        if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });

        // Update status to cancelled
        await db.update(bookings)
          .set({ status: "cancelled", updatedAt: new Date() })
          .where(eq(bookings.id, input.id));

        // Decrement slot counter if applicable
        if (existing.scheduleSlotId && ["pending", "confirmed"].includes(existing.status)) {
          await db.update(scheduleSlots)
            .set({ currentParticipants: sql`GREATEST(currentParticipants - 1, 0)`, updatedAt: new Date() })
            .where(eq(scheduleSlots.id, existing.scheduleSlotId));
        }

        // Send cancellation email + SMS to the student
        try {
          const rows = await db.select({
            booking: bookings,
            user: { id: users.id, name: users.name, email: users.email, phone: users.phone },
            programName: programs.name,
          })
            .from(bookings)
            .leftJoin(users, eq(bookings.userId, users.id))
            .leftJoin(programs, eq(bookings.programId, programs.id))
            .where(eq(bookings.id, input.id))
            .limit(1);

          if (rows.length) {
            const { booking, user, programName } = rows[0];
            const sessionDate = booking.sessionDate
              ? new Date(booking.sessionDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
              : undefined;
            const sessionTime = booking.sessionStartTime && booking.sessionEndTime
              ? `${formatTime12h(booking.sessionStartTime)} \u2013 ${formatTime12h(booking.sessionEndTime)}`
              : undefined;

            if (user?.email && isEmailConfigured()) {
              await sendBookingCancelled({
                toEmail: user.email,
                toName: user.name || "Student",
                programLabel: programName || "Tennis Session",
                sessionDate,
                sessionTime,
                bookingId: booking.id,
              });
            }

            if (user?.phone && isTwilioConfigured()) {
              const dateStr = sessionDate ? ` on ${sessionDate}` : "";
              const timeStr = sessionTime ? ` at ${sessionTime}` : "";
              await sendSms(
                user.phone,
                `Hi ${user.name || "there"}, your ${programName || "tennis session"} booking #${booking.id}${dateStr}${timeStr} has been CANCELLED by Coach Mario. Please contact us to reschedule. — RI Tennis Academy`
              );
            }
          }
        } catch (notifyErr: any) {
          console.error("[cancelNow] Failed to send cancellation notification:", notifyErr?.message);
          // Don't fail the mutation — booking is cancelled regardless
        }

        return { success: true };
      }),

    // Admin: schedule a reminder to fire 2 hours before the lesson time
    remindNow: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const rows = await db.select({
          booking: bookings,
          user: { id: users.id, name: users.name, email: users.email, phone: users.phone },
          programName: programs.name,
        })
          .from(bookings)
          .leftJoin(users, eq(bookings.userId, users.id))
          .leftJoin(programs, eq(bookings.programId, programs.id))
          .where(eq(bookings.id, input.id))
          .limit(1);

        if (!rows.length) throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });

        const { booking, user } = rows[0];

        // Calculate sendAt = session date + start time - 2 hours
        // If no session date/time, fall back to sending immediately
        let sendAt: Date;
        let scheduledFor: string | undefined;
        if (booking.sessionDate && booking.sessionStartTime) {
          // sessionDate is a date string like "2026-03-07", sessionStartTime is "HH:MM:SS"
          const [h, m] = booking.sessionStartTime.split(":").map(Number);
          // Parse as local date at the session time
          const lessonTime = new Date(booking.sessionDate);
          lessonTime.setHours(h, m, 0, 0);
          sendAt = new Date(lessonTime.getTime() - 2 * 60 * 60 * 1000); // 2 hours before
          scheduledFor = lessonTime.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
        } else {
          // No session time — send in 1 minute (immediate fallback)
          sendAt = new Date(Date.now() + 60 * 1000);
        }

        // Cancel any existing pending reminder for this booking
        await db.update(scheduledReminders)
          .set({ status: "cancelled" })
          .where(and(eq(scheduledReminders.bookingId, input.id), eq(scheduledReminders.status, "pending")));

        // Insert new scheduled reminder
        await db.insert(scheduledReminders).values({
          bookingId: input.id,
          userId: user?.id ?? 0,
          sendAt,
          status: "pending",
        });

        return {
          success: true,
          scheduledFor: scheduledFor || sendAt.toLocaleString(),
          sendAt: sendAt.toISOString(),
          emailSent: false,
          smsSent: false,
        };
      }),

    // Admin: create a Stripe checkout link to charge the student, then confirm on payment
    sendPaymentLink: adminProcedure
      .input(z.object({
        bookingId: z.number(),
        origin: z.string(),
      }))
      .mutation(async ({ input }) => {
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2026-02-25.clover" as any });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        // Fetch booking + user + program
        const rows = await db.select({
          booking: bookings,
          user: { id: users.id, name: users.name, email: users.email },
          programName: programs.name,
        })
          .from(bookings)
          .leftJoin(users, eq(bookings.userId, users.id))
          .leftJoin(programs, eq(bookings.programId, programs.id))
          .where(eq(bookings.id, input.bookingId))
          .limit(1);
        if (!rows.length) throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
        const { booking, user, programName } = rows[0];
        if (booking.totalAmountCents < 50) throw new TRPCError({ code: "BAD_REQUEST", message: "Amount too small to charge (minimum $0.50)" });
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "payment",
          customer_email: user?.email || undefined,
          allow_promotion_codes: true,
          line_items: [{
            price_data: {
              currency: "usd",
              product_data: {
                name: programName || "Tennis Session",
                description: `RI Tennis Academy — Booking #${booking.id}`,
              },
              unit_amount: booking.totalAmountCents,
            },
            quantity: 1,
          }],
          client_reference_id: String(user?.id || ""),
          metadata: {
            user_id: String(user?.id || ""),
            booking_id: String(booking.id),
            customer_email: user?.email || "",
            customer_name: user?.name || "",
          },
          success_url: `${input.origin}/profile?payment=success&booking=${booking.id}`,
          cancel_url: `${input.origin}/profile?payment=cancelled`,
        });
        return { url: session.url };
      }),

    // Admin: update coach notes for a booking
    updateCoachNotes: adminProcedure
      .input(z.object({
        id: z.number(),
        coachNotes: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.update(bookings)
          .set({ coachNotes: input.coachNotes, updatedAt: new Date() })
          .where(eq(bookings.id, input.id));
        return { success: true };
      }),

    // Admin: mark a cash/check booking as paid
    markPaid: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.update(bookings)
          .set({ paidAt: new Date(), status: "confirmed", updatedAt: new Date() })
          .where(eq(bookings.id, input.id));
        return { success: true };
      }),

    // Admin: get a single booking with coach notes
    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const rows = await db.select({
          booking: bookings,
          user: { id: users.id, name: users.name, email: users.email, phone: users.phone },
          programName: programs.name,
          programType: programs.type,
        })
          .from(bookings)
          .leftJoin(users, eq(bookings.userId, users.id))
          .leftJoin(programs, eq(bookings.programId, programs.id))
          .where(eq(bookings.id, input.id))
          .limit(1);
        if (!rows.length) throw new TRPCError({ code: "NOT_FOUND" });
        return rows[0];
      }),
  }),

   // ─── Schedule ────────────────────────────────────────────────────────────
  schedule: router({
    // Public: list available slots (for students booking)
    listAvailable: publicProcedure
      .input(z.object({
        programType: z.enum(["clinic_105", "private_lesson"]),
        from: z.string().optional(), // ISO date YYYY-MM-DD
        to: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        // Find program IDs matching this type
        const matchingPrograms = await db.select({ id: programs.id })
          .from(programs)
          .where(and(eq(programs.type, input.programType as any), eq(programs.isActive, true)));
        if (!matchingPrograms.length) return [];
        const programIds = matchingPrograms.map(p => p.id);
        // Use DATE() SQL comparison to avoid UTC offset issues (same as listAvailableMulti)
        const fromStr = input.from ?? new Date().toISOString().slice(0, 10);
        const toStr = input.to ?? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const slots = await db.select({
          slot: scheduleSlots,
          programName: programs.name,
          programType: programs.type,
          priceInCents: programs.priceInCents,
          // Real-time booking count — self-healing even if cached counter drifts
          activeBookings: sql<number>`(
            SELECT COUNT(*) FROM bookings b
            WHERE b.scheduleSlotId = ${scheduleSlots.id}
            AND b.status IN ('pending','confirmed')
          )`,
        })
          .from(scheduleSlots)
          .leftJoin(programs, eq(scheduleSlots.programId, programs.id))
          .where(and(
            eq(scheduleSlots.isAvailable, true),
            sql`DATE(${scheduleSlots.slotDate}) >= ${fromStr}`,
            sql`DATE(${scheduleSlots.slotDate}) <= ${toStr}`,
            sql`${scheduleSlots.programId} IN (${sql.join(programIds.map(id => sql`${id}`), sql`, `)})`
          ))
          .orderBy(scheduleSlots.slotDate, scheduleSlots.startTime)
          .limit(60);
        return slots.map(s => {
          const realCount = Number(s.activeBookings ?? 0);
          const spotsLeft = Math.max(0, s.slot.maxParticipants - realCount);
          return {
            ...s.slot,
            currentParticipants: realCount, // override cached value with live count
            programName: s.programName,
            programType: s.programType,
            priceInCents: s.priceInCents,
            spotsLeft,
            isFull: spotsLeft <= 0,
          };
        });
      }),

    // Public: list available slots for multiple program types (used by Schedule page)
    listAvailableMulti: publicProcedure
      .input(z.object({
        programTypes: z.array(z.enum(["clinic_105", "private_lesson"])).optional(),
        from: z.string().optional(),
        to: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const types = input.programTypes ?? ["clinic_105", "private_lesson"];
        const matchingPrograms = await db.select({ id: programs.id, type: programs.type })
          .from(programs)
          .where(and(
            sql`${programs.type} IN (${sql.join(types.map(t => sql`${t}`), sql`, `)})`,
            eq(programs.isActive, true)
          ));
        if (!matchingPrograms.length) return [];
        const programIds = matchingPrograms.map(p => p.id);
        // Use plain date strings (YYYY-MM-DD) for comparison to avoid timezone conversion issues
        const fromStr = input.from ?? new Date().toISOString().slice(0, 10);
        const toStr = input.to ?? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const slots = await db.select({
          slot: scheduleSlots,
          programName: programs.name,
          programType: programs.type,
          priceInCents: programs.priceInCents,
          // Real-time booking count — self-healing even if cached counter drifts
          activeBookings: sql<number>`(
            SELECT COUNT(*) FROM bookings b
            WHERE b.scheduleSlotId = ${scheduleSlots.id}
            AND b.status IN ('pending','confirmed')
          )`,
        })
          .from(scheduleSlots)
          .leftJoin(programs, eq(scheduleSlots.programId, programs.id))
          .where(and(
            eq(scheduleSlots.isAvailable, true),
            sql`DATE(${scheduleSlots.slotDate}) >= ${fromStr}`,
            sql`DATE(${scheduleSlots.slotDate}) <= ${toStr}`,
            sql`${scheduleSlots.programId} IN (${sql.join(programIds.map(id => sql`${id}`), sql`, `)})`
          ))
          .orderBy(scheduleSlots.slotDate, scheduleSlots.startTime)
          .limit(200);
        return slots.map(s => {
          const realCount = Number(s.activeBookings ?? s.slot.currentParticipants ?? 0);
          const spotsLeft = Math.max(0, s.slot.maxParticipants - realCount);
          return {
            ...s.slot,
            currentParticipants: realCount,
            programName: s.programName,
            programType: s.programType,
            priceInCents: s.priceInCents,
            spotsLeft,
            isFull: spotsLeft <= 0,
          };
        });
      }),

    // Authenticated: list the current user's active private lesson bookings as calendar events
    listMyPrivateLessons: protectedProcedure
      .input(z.object({
        from: z.string().optional(),
        to: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return [];
        const fromStr = input.from ?? new Date().toISOString().slice(0, 10);
        const toStr = input.to ?? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const rows = await db.select({
          id: bookings.id,
          status: bookings.status,
          sessionDate: bookings.sessionDate,
          sessionStartTime: bookings.sessionStartTime,
          sessionEndTime: bookings.sessionEndTime,
          totalAmountCents: bookings.totalAmountCents,
          programName: programs.name,
          programType: programs.type,
        })
          .from(bookings)
          .leftJoin(programs, eq(bookings.programId, programs.id))
          .where(and(
            eq(bookings.userId, ctx.user.id),
            sql`${bookings.status} IN ('pending', 'confirmed')`,
            sql`${bookings.sessionDate} IS NOT NULL`,
            sql`DATE(${bookings.sessionDate}) >= ${fromStr}`,
            sql`DATE(${bookings.sessionDate}) <= ${toStr}`,
          ))
          .orderBy(bookings.sessionDate, bookings.sessionStartTime)
          .limit(100);
        // Return in the same shape as a schedule slot so the frontend can merge them
        return rows.map(r => ({
          id: -r.id, // negative ID to distinguish from real slot IDs
          bookingId: r.id,
          programType: r.programType,
          programName: r.programName,
          slotDate: r.sessionDate,
          startTime: r.sessionStartTime,
          endTime: r.sessionEndTime,
          status: r.status,
          maxParticipants: 1,
          currentParticipants: 1,
          isAvailable: false, // already booked
          spotsLeft: 0,
          isFull: true,
          isMyBooking: true,
          priceInCents: r.totalAmountCents,
        }));
      }),

    // Admin: full calendar view (slots + bookings + blocked times)
    adminCalendar: adminProcedure
      .input(z.object({ from: z.string(), to: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return { slots: [], bookings: [], blocked: [] };
        const fromDate = new Date(input.from);
        const toDate = new Date(input.to);
        const [slots, calBookings, blocked] = await Promise.all([
          db.select({
            slot: scheduleSlots,
            programName: programs.name,
            programType: programs.type,
            activeBookings: sql<number>`(
              SELECT COUNT(*) FROM bookings b
              WHERE b.scheduleSlotId = ${scheduleSlots.id}
              AND b.status IN ('pending','confirmed')
            )`,
          })
            .from(scheduleSlots)
            .leftJoin(programs, eq(scheduleSlots.programId, programs.id))
            .where(and(
              gte(scheduleSlots.slotDate, fromDate as any),
              lte(scheduleSlots.slotDate, toDate as any),
            ))
            .orderBy(scheduleSlots.slotDate, scheduleSlots.startTime)
            .limit(300),
          db.select({
            id: bookings.id,
            status: bookings.status,
            sessionDate: bookings.sessionDate,
            createdAt: bookings.createdAt,
            notes: bookings.notes,
            totalAmountCents: bookings.totalAmountCents,
            scheduleSlotId: bookings.scheduleSlotId,
            studentName: users.name,
            studentEmail: users.email,
            programName: programs.name,
            programType: programs.type,
          })
            .from(bookings)
            .leftJoin(users, eq(bookings.userId, users.id))
            .leftJoin(programs, eq(bookings.programId, programs.id))
            .where(and(
              sql`${bookings.status} IN ('pending','confirmed')`,
              sql`(
                (${bookings.sessionDate} IS NOT NULL AND ${bookings.sessionDate} >= ${fromDate.toISOString().slice(0,10)} AND ${bookings.sessionDate} <= ${toDate.toISOString().slice(0,10)})
                OR
                (${bookings.sessionDate} IS NULL AND ${bookings.createdAt} >= ${fromDate.toISOString()} AND ${bookings.createdAt} <= ${toDate.toISOString()})
              )`,
            ))
            .orderBy(bookings.sessionDate, bookings.createdAt)
            .limit(300),
          db.select().from(blockedTimes)
            .where(and(
              gte(blockedTimes.blockedDate, fromDate as any),
              lte(blockedTimes.blockedDate, toDate as any),
            ))
            .orderBy(blockedTimes.blockedDate)
            .limit(100),
        ]);
        return {
          slots: slots.map(s => {
            const realCount = Number(s.activeBookings ?? s.slot.currentParticipants ?? 0);
            const spotsLeft = Math.max(0, s.slot.maxParticipants - realCount);
            return {
              ...s.slot,
              currentParticipants: realCount,
              programName: s.programName,
              programType: s.programType,
              spotsLeft,
              isFull: spotsLeft <= 0,
            };
          }),
          bookings: calBookings,
          blocked,
        };
      }),

    // Admin: full schedule view (all slots + blocked times)
    adminView: adminProcedure
      .input(z.object({ from: z.string().optional(), to: z.string().optional() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return { slots: [], blocked: [] };
        const fromDate = input.from ? new Date(input.from) : new Date();
        const toDate = input.to ? new Date(input.to) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
        const [slots, blocked] = await Promise.all([
          db.select({
            slot: scheduleSlots,
            programName: programs.name,
            programType: programs.type,
            activeBookings: sql<number>`(
              SELECT COUNT(*) FROM bookings b
              WHERE b.scheduleSlotId = ${scheduleSlots.id}
              AND b.status IN ('pending','confirmed')
            )`,
          })
            .from(scheduleSlots)
            .leftJoin(programs, eq(scheduleSlots.programId, programs.id))
            .where(and(
              gte(scheduleSlots.slotDate, fromDate as any),
              lte(scheduleSlots.slotDate, toDate as any),
            ))
            .orderBy(scheduleSlots.slotDate, scheduleSlots.startTime)
            .limit(200),
          db.select().from(blockedTimes)
            .where(and(
              gte(blockedTimes.blockedDate, fromDate as any),
              lte(blockedTimes.blockedDate, toDate as any),
            ))
            .orderBy(blockedTimes.blockedDate)
            .limit(100),
        ]);
        return {
          slots: slots.map(s => {
            const realCount = Number(s.activeBookings ?? s.slot.currentParticipants ?? 0);
            const spotsLeft = Math.max(0, s.slot.maxParticipants - realCount);
            return {
              ...s.slot,
              currentParticipants: realCount,
              programName: s.programName,
              programType: s.programType,
              spotsLeft,
              isFull: spotsLeft <= 0,
            };
          }),
          blocked,
        };
      }),

    // Admin: get enrollees for a specific slot
    getEnrollees: adminProcedure
      .input(z.object({ slotId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return db.select({
          bookingId: bookings.id,
          status: bookings.status,
          bookedAt: bookings.createdAt,
          studentName: users.name,
          studentEmail: users.email,
          studentPhone: users.phone,
        })
          .from(bookings)
          .leftJoin(users, eq(bookings.userId, users.id))
          .where(and(
            eq(bookings.scheduleSlotId, input.slotId),
            sql`${bookings.status} IN ('pending','confirmed')`
          ))
          .orderBy(bookings.createdAt);
      }),

    // Admin: roster summary — all slots with enrollment counts, optionally filtered by program type
    getRosterSummary: adminProcedure
      .input(z.object({
        programType: z.string().optional(), // e.g. 'clinic_105', 'junior', 'private_lesson'
        from: z.string().optional(), // YYYY-MM-DD
        to: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const fromStr = input.from ?? new Date().toISOString().slice(0, 10);
        const toDate = new Date();
        toDate.setDate(toDate.getDate() + 90);
        const toStr = input.to ?? toDate.toISOString().slice(0, 10);
        const rows = await db.select({
          slotId: scheduleSlots.id,
          slotDate: scheduleSlots.slotDate,
          startTime: scheduleSlots.startTime,
          endTime: scheduleSlots.endTime,
          maxParticipants: scheduleSlots.maxParticipants,
          programId: programs.id,
          programName: programs.name,
          programType: programs.type,
          activeBookings: sql<number>`(
            SELECT COUNT(*) FROM bookings b
            WHERE b.scheduleSlotId = ${scheduleSlots.id}
            AND b.status IN ('pending','confirmed')
          )`,
        })
          .from(scheduleSlots)
          .leftJoin(programs, eq(scheduleSlots.programId, programs.id))
          .where(and(
            eq(scheduleSlots.isAvailable, true),
            sql`DATE(${scheduleSlots.slotDate}) >= ${fromStr}`,
            sql`DATE(${scheduleSlots.slotDate}) <= ${toStr}`,
            input.programType ? eq(programs.type, input.programType as any) : undefined,
          ))
          .orderBy(scheduleSlots.slotDate, scheduleSlots.startTime);
        return rows.map(r => ({
          slotId: r.slotId,
          slotDate: r.slotDate,
          startTime: r.startTime,
          endTime: r.endTime,
          maxParticipants: r.maxParticipants,
          enrolled: Number(r.activeBookings ?? 0),
          spotsLeft: Math.max(0, r.maxParticipants - Number(r.activeBookings ?? 0)),
          programId: r.programId,
          programName: r.programName,
          programType: r.programType,
        }));
      }),

    // Admin: create a slot
    create: adminProcedure
      .input(z.object({
        programId: z.number(),
        title: z.string().optional(),
        slotDate: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        maxParticipants: z.number().default(12),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.insert(scheduleSlots).values({
          programId: input.programId,
          title: input.title || null,
          slotDate: new Date(input.slotDate) as any,
          startTime: input.startTime,
          endTime: input.endTime,
          maxParticipants: input.maxParticipants,
          notes: input.notes || null,
          isAvailable: true,
          currentParticipants: 0,
        });
        return { success: true };
      }),

    // Admin: update slot capacity or availability
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        maxParticipants: z.number().optional(),
        isAvailable: z.boolean().optional(),
        notes: z.string().optional(),
        title: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { id, ...updates } = input;
        await db.update(scheduleSlots).set({ ...updates, updatedAt: new Date() }).where(eq(scheduleSlots.id, id));
        return { success: true };
      }),

    // Admin: delete a slot
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.delete(scheduleSlots).where(eq(scheduleSlots.id, input.id));
        return { success: true };
      }),

    // Admin: bulk-generate 105 clinic slots for a date range
    generate105Slots: adminProcedure
      .input(z.object({
        programId: z.number(),
        fromDate: z.string(),
        toDate: z.string(),
        weekdayCap: z.number().default(12),   // Mon/Wed/Fri
        sundayCap: z.number().default(24),
        startTime: z.string().default("09:00:00"),
        endTime: z.string().default("10:30:00"),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const start = new Date(input.fromDate);
        const end = new Date(input.toDate);
        const toInsert: any[] = [];
        const cur = new Date(start);
        while (cur <= end) {
          const dow = cur.getDay(); // 0=Sun, 1=Mon, 3=Wed, 5=Fri
          if ([0, 1, 3, 5].includes(dow)) {
            const isSunday = dow === 0;
            const cap = isSunday ? input.sundayCap : input.weekdayCap;
            const dayName = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dow];
            const dateStr = cur.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            toInsert.push({
              programId: input.programId,
              title: `105 Clinic – ${dayName} ${dateStr}`,
              slotDate: new Date(cur) as any,
              startTime: input.startTime,
              endTime: input.endTime,
              maxParticipants: cap,
              isAvailable: true,
              currentParticipants: 0,
            });
          }
          cur.setDate(cur.getDate() + 1);
        }
        if (toInsert.length > 0) {
          for (const slot of toInsert) {
            await db.insert(scheduleSlots).values(slot);
          }
        }
        return { success: true, created: toInsert.length };
      }),

    // Admin: block time
    blockTime: adminProcedure
      .input(z.object({
        title: z.string(),
        blockedDate: z.string(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        isAllDay: z.boolean().default(false),
        affectsPrivateLessons: z.boolean().default(true),
        affects105Clinic: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.insert(blockedTimes).values({
          title: input.title,
          blockedDate: new Date(input.blockedDate) as any,
          startTime: input.startTime || null,
          endTime: input.endTime || null,
          isAllDay: input.isAllDay,
          affectsPrivateLessons: input.affectsPrivateLessons,
          affects105Clinic: input.affects105Clinic,
        });
        return { success: true };
      }),

    // Admin: delete a blocked time
    deleteBlock: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.delete(blockedTimes).where(eq(blockedTimes.id, input.id));
        return { success: true };
      }),

    // Admin: sync currentParticipants to match actual active booking counts
    syncParticipantCounts: adminProcedure
      .mutation(async () => {{
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        // Update each slot's currentParticipants to the real count of pending/confirmed bookings
        await db.execute(sql`
          UPDATE schedule_slots ss
          SET ss.currentParticipants = (
            SELECT COUNT(*)
            FROM bookings b
            WHERE b.scheduleSlotId = ss.id
            AND b.status IN ('pending', 'confirmed')
          ),
          ss.updatedAt = NOW()
        `);
        return { success: true };
      }}),

    // Public: get unavailable hours for a specific date (booked + admin-blocked)
    getUnavailableHours: publicProcedure
      .input(z.object({
        date: z.string(), // YYYY-MM-DD
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return { bookedHours: [], blockedHours: [], allDayBlocked: false };

        // ✅ FIX #7: use DATE() SQL comparison to reliably match date column in MySQL
        // Get confirmed/pending private lesson bookings for this date
        const existingBookings = await db.select({
          sessionStartTime: bookings.sessionStartTime,
        })
          .from(bookings)
          .where(and(
            sql`DATE(${bookings.sessionDate}) = ${input.date}`,
            sql`${bookings.status} IN ('pending', 'confirmed')`,
          ));

        const bookedHours = existingBookings
          .filter(b => b.sessionStartTime)
          .map(b => {
            // sessionStartTime is "HH:MM:SS" — extract hour
            const t = b.sessionStartTime as string;
            return parseInt(t.split(':')[0], 10);
          });

        // Get admin-blocked times for this date that affect private lessons
        const blocks = await db.select().from(blockedTimes)
          .where(and(
            sql`DATE(${blockedTimes.blockedDate}) = ${input.date}`,
            eq(blockedTimes.affectsPrivateLessons, true),
          ));

        const allDayBlocked = blocks.some(b => b.isAllDay);
        const blockedHours: number[] = [];
        for (const block of blocks) {
          if (block.isAllDay) continue; // handled by allDayBlocked flag
          if (block.startTime && block.endTime) {
            const startH = parseInt((block.startTime as string).split(':')[0], 10);
            const endH = parseInt((block.endTime as string).split(':')[0], 10);
            for (let h = startH; h <= endH; h++) blockedHours.push(h);
          }
        }

        return { bookedHours, blockedHours, allDayBlocked };
      }),

    // Public: get blocked dates (for student calendar)
    getBlockedDates: publicProcedure
      .input(z.object({ from: z.string().optional(), to: z.string().optional() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const fromDate = input.from ? new Date(input.from) : new Date();
        const toDate = input.to ? new Date(input.to) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
        return db.select().from(blockedTimes)
          .where(and(
            gte(blockedTimes.blockedDate, fromDate as any),
            lte(blockedTimes.blockedDate, toDate as any),
          ))
          .orderBy(blockedTimes.blockedDate);
      }),

    // Public: get month availability summary (for the availability calendar widget)
    getMonthAvailability: publicProcedure
      .input(z.object({ year: z.number(), month: z.number() })) // month: 1-12
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const firstDay = `${input.year}-${String(input.month).padStart(2, '0')}-01`;
        const lastDayDate = new Date(input.year, input.month, 0);
        const lastDay = `${input.year}-${String(input.month).padStart(2, '0')}-${String(lastDayDate.getDate()).padStart(2, '0')}`;
        const slots = await db.select({
          slotDate: scheduleSlots.slotDate,
          maxParticipants: scheduleSlots.maxParticipants,
          isAvailable: scheduleSlots.isAvailable,
          activeBookings: sql<number>`(
            SELECT COUNT(*) FROM bookings b
            WHERE b.scheduleSlotId = ${scheduleSlots.id}
            AND b.status IN ('pending','confirmed')
          )`,
        })
          .from(scheduleSlots)
          .where(and(
            sql`DATE(${scheduleSlots.slotDate}) >= ${firstDay}`,
            sql`DATE(${scheduleSlots.slotDate}) <= ${lastDay}`,
            eq(scheduleSlots.isAvailable, true),
          ));
        const blocked = await db.select({ blockedDate: blockedTimes.blockedDate })
          .from(blockedTimes)
          .where(and(
            sql`DATE(${blockedTimes.blockedDate}) >= ${firstDay}`,
            sql`DATE(${blockedTimes.blockedDate}) <= ${lastDay}`,
          ));
        const blockedSet = new Set(blocked.map(b => {
          const d = new Date(b.blockedDate as any);
          return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
        }));
        const byDate: Record<string, { totalSlots: number; availableSlots: number; totalSpots: number; spotsLeft: number }> = {};
        for (const slot of slots) {
          const d = new Date(slot.slotDate as any);
          const dateKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
          if (!byDate[dateKey]) byDate[dateKey] = { totalSlots: 0, availableSlots: 0, totalSpots: 0, spotsLeft: 0 };
          const realCount = Number(slot.activeBookings ?? 0);
          const spotsLeft = Math.max(0, slot.maxParticipants - realCount);
          byDate[dateKey].totalSlots++;
          byDate[dateKey].totalSpots += slot.maxParticipants;
          byDate[dateKey].spotsLeft += spotsLeft;
          if (spotsLeft > 0) byDate[dateKey].availableSlots++;
        }
        return Object.entries(byDate).map(([date, info]) => ({
          date,
          ...info,
          isBlocked: blockedSet.has(date),
          status: blockedSet.has(date) ? 'blocked' as const
            : info.spotsLeft === 0 ? 'full' as const
            : info.spotsLeft <= 3 ? 'limited' as const
            : 'available' as const,
        }));
      }),
  }),

  // ─── Waitlist ─────────────────────────────────────────────────────────────
  waitlist: router({
    // Student: join the waitlist for a full session
    join: protectedProcedure
      .input(z.object({ scheduleSlotId: z.number(), programId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        // Check not already on waitlist
        const existing = await db.select().from(sessionWaitlist)
          .where(and(
            eq(sessionWaitlist.scheduleSlotId, input.scheduleSlotId),
            eq(sessionWaitlist.userId, ctx.user.id),
            sql`${sessionWaitlist.status} IN ('waiting','notified')`,
          )).limit(1);
        if (existing.length) throw new TRPCError({ code: "CONFLICT", message: "You are already on the waitlist for this session." });
        await db.insert(sessionWaitlist).values({
          scheduleSlotId: input.scheduleSlotId,
          userId: ctx.user.id,
          programId: input.programId,
          status: "waiting",
        });
        // Notify Mario
        const { notifyOwner } = await import("./_core/notification");
        const slot = await db.select().from(scheduleSlots).where(eq(scheduleSlots.id, input.scheduleSlotId)).limit(1);
        const slotTitle = slot[0]?.title || `Session #${input.scheduleSlotId}`;
        await notifyOwner({
          title: "New Waitlist Entry",
          content: `${ctx.user.name || ctx.user.email || "A student"} joined the waitlist for: ${slotTitle}`,
        });
        return { success: true };
      }),

    // Student: leave the waitlist
    leave: protectedProcedure
      .input(z.object({ scheduleSlotId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.update(sessionWaitlist)
          .set({ status: "removed" })
          .where(and(
            eq(sessionWaitlist.scheduleSlotId, input.scheduleSlotId),
            eq(sessionWaitlist.userId, ctx.user.id),
          ));
        return { success: true };
      }),

    // Student: check if on waitlist for a slot
    myStatus: protectedProcedure
      .input(z.object({ scheduleSlotId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return null;
        const rows = await db.select().from(sessionWaitlist)
          .where(and(
            eq(sessionWaitlist.scheduleSlotId, input.scheduleSlotId),
            eq(sessionWaitlist.userId, ctx.user.id),
            sql`${sessionWaitlist.status} IN ('waiting','notified')`,
          )).limit(1);
        return rows[0] || null;
      }),

    // Public: count of waitlist entries for a slot
    countForSlot: publicProcedure
      .input(z.object({ scheduleSlotId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return 0;
        const rows = await db.select({ count: sql<number>`count(*)` })
          .from(sessionWaitlist)
          .where(and(
            eq(sessionWaitlist.scheduleSlotId, input.scheduleSlotId),
            sql`${sessionWaitlist.status} IN ('waiting','notified')`,
          ));
        return Number(rows[0]?.count || 0);
      }),

    // Admin: list all waitlist entries for a slot
    listForSlot: adminProcedure
      .input(z.object({ scheduleSlotId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return db.select({
          waitlist: sessionWaitlist,
          user: { id: users.id, name: users.name, email: users.email, phone: users.phone },
        })
          .from(sessionWaitlist)
          .leftJoin(users, eq(sessionWaitlist.userId, users.id))
          .where(and(
            eq(sessionWaitlist.scheduleSlotId, input.scheduleSlotId),
            sql`${sessionWaitlist.status} IN ('waiting','notified')`,
          ))
          .orderBy(sessionWaitlist.createdAt);
      }),
  }),

  // ─── Mental Coaching Resources ───────────────────────────────────────────────
  mental: router({
    listResources: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(mentalCoachingResources)
        .where(eq(mentalCoachingResources.isPublished, true))
        .orderBy(desc(mentalCoachingResources.createdAt));
    }),

    getTipOfWeek: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return null;
      // Use week number to deterministically pick a tip (rotates weekly)
      const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
      const resources = await db.select().from(mentalCoachingResources)
        .where(eq(mentalCoachingResources.isPublished, true));
      if (resources.length === 0) return null;
      return resources[weekNum % resources.length];
    }),

    createResource: adminProcedure
      .input(z.object({
        title: z.string(),
        content: z.string(),
        category: z.enum(["mindset","focus","pressure","confidence","routine","general"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.insert(mentalCoachingResources).values({ ...input, isPublished: true });
        return { success: true };
      }),
  }),

  // ─── Merchandise ────────────────────────────────────────────────────────────
  merchandise: router({
    list: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(merchandise).where(eq(merchandise.isActive, true));
    }),
  }),

  // ─── SMS ────────────────────────────────────────────────────────────────────
  sms: router({
    // Admin: send broadcast
    sendBroadcast: adminProcedure
      .input(z.object({ message: z.string().min(1).max(1600) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Get opted-in users with phone numbers
        const subscribers = await db.select({ phone: users.phone, name: users.name })
          .from(users)
          .where(and(eq(users.smsOptIn, true), sql`${users.phone} IS NOT NULL`));

        // Send real SMS via Twilio
        let sent = 0;
        let failed = 0;
        if (isTwilioConfigured() && subscribers.length > 0) {
          const validSubscribers = subscribers.filter(s => s.phone) as { phone: string; name: string | null }[];
          const result = await sendBulkSms(validSubscribers, input.message);
          sent = result.sent;
          failed = result.failed;
        }

        // Log the broadcast
        await db.insert(smsBroadcasts).values({
          sentBy: ctx.user.id,
          message: input.message,
          recipientCount: subscribers.length,
          status: isTwilioConfigured() ? "sent" : "draft",
          sentAt: new Date(),
        });

        return { success: true, recipientCount: subscribers.length, sent, failed };
      }),

    getBroadcasts: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(smsBroadcasts).orderBy(desc(smsBroadcasts.createdAt)).limit(20);
    }),

    getOptInCount: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { count: 0 };
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(eq(users.smsOptIn, true), sql`${users.phone} IS NOT NULL`));
      return { count: result[0]?.count || 0 };
    }),
  }),

  // ─── Admin Stats ────────────────────────────────────────────────────────────
  admin: router({
    stats: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { totalStudents: 0, totalBookings: 0, pendingBookings: 0, smsSubscribers: 0 };

      const [studentCount, bookingCount, pendingCount, smsCount] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, "user")),
        db.select({ count: sql<number>`count(*)` }).from(bookings),
        db.select({ count: sql<number>`count(*)` }).from(bookings).where(eq(bookings.status, "pending")),
        db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.smsOptIn, true)),
      ]);

      return {
        totalStudents: studentCount[0]?.count || 0,
        totalBookings: bookingCount[0]?.count || 0,
        pendingBookings: pendingCount[0]?.count || 0,
        smsSubscribers: smsCount[0]?.count || 0,
      };
    }),

    listStudents: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(users).where(eq(users.role, "user")).orderBy(desc(users.createdAt)).limit(100);
    }),

    listPrograms: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(programs).where(eq(programs.isActive, true)).orderBy(programs.name);
    }),

    // Admin: enhanced analytics - revenue by program, monthly trends
    getAnalytics: adminProcedure
      .input(z.object({ months: z.number().min(1).max(12).default(6) }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return { revenueByProgram: [], monthlyTrends: [], topStudents: [] };
        // Revenue by program type
        const revenueByProgram = await db.select({
          programName: programs.name,
          programType: programs.type,
          bookingCount: sql<number>`COUNT(${bookings.id})`,
          totalRevenueCents: sql<number>`SUM(${bookings.totalAmountCents})`,
        })
          .from(bookings)
          .leftJoin(programs, eq(bookings.programId, programs.id))
          .where(sql`${bookings.status} IN ('confirmed','completed','pending')`)
          .groupBy(programs.id, programs.name, programs.type)
          .orderBy(sql`SUM(${bookings.totalAmountCents}) DESC`);
        // Monthly booking trends (last N months)
        const monthlyTrends = await db.select({
          month: sql<string>`DATE_FORMAT(${bookings.createdAt}, '%Y-%m')`,
          bookingCount: sql<number>`COUNT(${bookings.id})`,
          revenueCents: sql<number>`SUM(CASE WHEN ${bookings.status} IN ('confirmed','completed','pending') THEN ${bookings.totalAmountCents} ELSE 0 END)`,
          newStudents: sql<number>`COUNT(DISTINCT ${bookings.userId})`,
        })
          .from(bookings)
          .where(sql`${bookings.createdAt} >= DATE_SUB(NOW(), INTERVAL ${input.months} MONTH)`)
          .groupBy(sql`DATE_FORMAT(${bookings.createdAt}, '%Y-%m')`)
          .orderBy(sql`DATE_FORMAT(${bookings.createdAt}, '%Y-%m') ASC`);
        // Top students by session count
        const topStudents = await db.select({
          userId: bookings.userId,
          userName: users.name,
          userEmail: users.email,
          sessionCount: sql<number>`COUNT(${bookings.id})`,
          totalSpentCents: sql<number>`SUM(${bookings.totalAmountCents})`,
        })
          .from(bookings)
          .leftJoin(users, eq(bookings.userId, users.id))
          .where(sql`${bookings.status} IN ('confirmed','completed','pending')`)
          .groupBy(bookings.userId, users.name, users.email)
          .orderBy(sql`COUNT(${bookings.id}) DESC`)
          .limit(10);
        return { revenueByProgram, monthlyTrends, topStudents };
      }),
  }),

  // ─── Stripe Payments ────────────────────────────────────────────────────────
  stripe: stripeRouter,

  // ─── AI Chat (FAQ + Mental Coaching) ────────────────────────────────────────
  ai: router({
    chat: publicProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })),
        mode: z.enum(["faq", "mental_coaching"]).default("faq"),
      }))
      .mutation(async ({ input }) => {
        const systemPrompt = input.mode === "mental_coaching"
          ? `You are Mario Llano, head coach and mental performance specialist at RI Tennis Academy in Rhode Island. You have deep expertise in the psychological aspects of tennis — fear elimination, confidence building, focus under pressure, pre-match routines, and mental resilience. You speak with warmth, authority, and genuine passion for helping players unlock their mental potential. Your signature philosophy is "Delete Fear" — helping players remove self-doubt and play freely. Provide thoughtful, practical mental coaching advice. Keep responses concise but impactful.`
          : `You are the AI assistant for RI Tennis Academy, coached by Mario Llano in Rhode Island. You help answer questions about:
- Programs: Private lessons ($120/hr, 1-on-1 with Coach Mario), 105 Game adult clinic ($35/1.5hr), Junior programs (daily $80, weekly $350, 3:30-6:30 PM), Summer camp (daily $90, weekly $420, 9AM-2PM, after camp +$20 or $50 afternoon-only), Mental coaching
- Services: Tournament attendance ($50/hr + $25/hr travel, shareable), Racquet stringing ($35 Mario's string / $25 customer's string), Merchandise (sweatshirts $50, t-shirts $25)
- Booking: Students can book online through the app and pay securely
- SMS: Students can opt in to receive daily updates and motivational messages from Mario
- Social media: YouTube (Ri Tennis Mario), Instagram (deletefearwithMario, RITennisandFAYE), TikTok (@deletefear), Facebook (Mario Llano), Twitter (@RITennisAcademy)
- Tennis technique questions: Answer with expertise
- Mental game: Refer to the Mental Coaching section for deeper guidance
Be friendly, helpful, and knowledgeable. Keep answers concise.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            ...input.messages,
          ],
        });

        const content = response.choices[0]?.message?.content || "I'm here to help! Please ask me anything about RI Tennis Academy.";
        return { content };
      }),
  }),
});

export type AppRouter = typeof appRouter;
