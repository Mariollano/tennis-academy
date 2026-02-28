import { z } from "zod";
import { stripeRouter } from "./stripeRouter";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import {
  users, bookings, programs, scheduleSlots, payments,
  smsBroadcasts, mentalCoachingResources, merchandise, tournamentBookings, tournamentParticipants
} from "../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";

// Admin guard middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── User Profile ───────────────────────────────────────────────────────────
  user: router({
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        smsOptIn: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.update(users)
          .set({ ...input, updatedAt: new Date() })
          .where(eq(users.id, ctx.user.id));
        return { success: true };
      }),

    getMyBookings: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(bookings)
        .where(eq(bookings.userId, ctx.user.id))
        .orderBy(desc(bookings.createdAt))
        .limit(50);
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
    create: protectedProcedure
      .input(z.object({
        programType: z.string(),
        sessionDate: z.string().optional(),
        pricingOption: z.string(),
        afterCampAddon: z.boolean().optional(),
        notes: z.string().optional(),
        totalAmountCents: z.number(),
        weekStartDate: z.string().optional(),
        sharedStudentCount: z.number().optional(),
        stringProvidedBy: z.enum(["academy","customer"]).optional(),
        merchandiseSize: z.string().optional(),
        quantity: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

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

        await db.insert(bookings).values({
          userId: ctx.user.id,
          programId,
          totalAmountCents: input.totalAmountCents,
          sessionDate: input.sessionDate ? new Date(input.sessionDate) as any : undefined,
          weekStartDate: input.weekStartDate ? new Date(input.weekStartDate) as any : undefined,
          sharedStudentCount: input.sharedStudentCount || 1,
          stringProvidedBy: input.stringProvidedBy,
          merchandiseSize: input.merchandiseSize,
          quantity: input.quantity || 1,
          notes: input.notes,
          status: "pending",
        });

        return { success: true };
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
        })
          .from(bookings)
          .leftJoin(users, eq(bookings.userId, users.id))
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
        await db.update(bookings).set({ status: input.status, updatedAt: new Date() }).where(eq(bookings.id, input.id));
        return { success: true };
      }),
  }),

  // ─── Schedule ───────────────────────────────────────────────────────────────
  schedule: router({
    list: publicProcedure
      .input(z.object({ programId: z.number().optional(), from: z.string().optional() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const conditions = [eq(scheduleSlots.isAvailable, true)];
        if (input.programId) conditions.push(eq(scheduleSlots.programId, input.programId));
        return db.select().from(scheduleSlots).where(and(...conditions)).orderBy(scheduleSlots.slotDate).limit(30);
      }),

    create: adminProcedure
      .input(z.object({
        programId: z.number(),
        slotDate: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        maxParticipants: z.number().default(10),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.insert(scheduleSlots).values({
          ...input,
          slotDate: new Date(input.slotDate) as any,
          isAvailable: true,
          currentParticipants: 0,
        });
        return { success: true };
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

        // Log the broadcast
        await db.insert(smsBroadcasts).values({
          sentBy: ctx.user.id,
          message: input.message,
          recipientCount: subscribers.length,
          status: "sent",
          sentAt: new Date(),
        });

        // Note: actual SMS sending requires Twilio credentials (configured separately)
        return { success: true, recipientCount: subscribers.length };
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
- Programs: Private lessons, 105 Game adult clinic ($30/1.5hr), Junior programs (daily $80, weekly $350, 4:30-6:30 PM), Summer camp (daily $100, weekly $450, 9AM-2PM, after camp +$20), Mental coaching
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
