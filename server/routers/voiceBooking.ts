import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { transcribeAudio, WhisperResponse } from "../_core/voiceTranscription";
import { getDb } from "../db";
import { scheduleSlots, blockedTimes, bookings, programs, users } from "../../drizzle/schema";
import { and, eq, sql, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Map spoken program names to booking routes
const PROGRAM_ROUTE_MAP: Record<string, string> = {
  private_lesson: "/book/private",
  clinic_105: "/book/clinic_105",
  junior: "/book/junior",
  summer_camp: "/book/summer_camp",
  mental_coaching: "/book/mental_coaching",
  tournament: "/book/tournament",
};

const PROGRAM_DISPLAY_NAMES: Record<string, string> = {
  private_lesson: "Private Lesson",
  clinic_105: "105 Game Clinic",
  junior: "Junior Program",
  summer_camp: "Summer Camp",
  mental_coaching: "Mental Coaching",
  tournament: "Tournament Attendance",
};

// Program IDs in the database (verified against actual DB rows)
const PROGRAM_IDS: Record<string, number> = {
  clinic_105: 1,
  private_lesson: 2,
  mental_coaching: 30001,
  junior_daily: 60001,
  junior_weekly: 60002,
  summer_camp_daily: 70001,
  // aliases used by voice assistant
  junior: 60001,
  summer_camp: 70001,
};

function formatTime12h(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || "0", 10);
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatDateFriendly(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export const voiceBookingRouter = router({
  // Step 1: Transcribe audio URL to text
  transcribe: publicProcedure
    .input(z.object({
      audioUrl: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      const result = await transcribeAudio({
        audioUrl: input.audioUrl,
        language: "en",
        prompt: "Tennis academy booking request. Programs include private lesson, 105 game clinic, junior program, summer camp, mental coaching.",
      });
      if ('error' in result) {
        throw new Error(result.error);
      }
      return { transcript: (result as WhisperResponse).text };
    }),

  // Step 2: Parse intent from transcript + check availability
  parseAndCheck: publicProcedure
    .input(z.object({
      transcript: z.string(),
    }))
    .mutation(async ({ input }) => {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      // Use AI to parse the booking intent
      const parseResponse = await invokeLLM({
        messages: [
          {
            role: "system" as const,
            content: `You are a booking assistant for RI Tennis Academy. Parse the user's voice request and extract booking details.
Today's date is ${todayStr}.

Programs available:
- private_lesson: Private 1-on-1 lesson with Coach Mario ($120/hr)
- clinic_105: 105 Game Adult Clinic (Mon/Wed/Fri/Sun, $35/1.5hr)
- junior: Junior Program (Mon-Fri 3:30-6:30 PM, $80/day)
- summer_camp: Summer Camp (Mon-Fri 9AM-2PM, $90/day)
- mental_coaching: Mental Coaching session
- tournament: Tournament Attendance

Return ONLY valid JSON with this exact structure:
{
  "program": "private_lesson" | "clinic_105" | "junior" | "summer_camp" | "mental_coaching" | "tournament" | null,
  "date": "YYYY-MM-DD" | null,
  "time": "HH:MM" | null,
  "confidence": "high" | "medium" | "low",
  "understood": true | false,
  "message": "brief friendly confirmation of what you understood"
}

If the date is relative (e.g. "tomorrow", "next Monday"), resolve it to an absolute date based on today being ${todayStr}.
If no specific program is mentioned but context implies one, infer it.
If the request is unclear, set understood=false.`,
          },
          {
            role: "user" as const,
            content: input.transcript,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "booking_intent",
            strict: true,
            schema: {
              type: "object",
              properties: {
                program: { type: ["string", "null"] },
                date: { type: ["string", "null"] },
                time: { type: ["string", "null"] },
                confidence: { type: "string", enum: ["high", "medium", "low"] },
                understood: { type: "boolean" },
                message: { type: "string" },
              },
              required: ["program", "date", "time", "confidence", "understood", "message"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = String(parseResponse.choices[0]?.message?.content || "{}");
      let intent: {
        program: string | null;
        date: string | null;
        time: string | null;
        confidence: string;
        understood: boolean;
        message: string;
      };
      try {
        intent = JSON.parse(rawContent);
      } catch {
        return {
          understood: false,
          message: "I couldn't understand that request. Please try again.",
          redirectUrl: null as string | null,
          alternatives: [] as Array<{ date: string; time: string; spotsLeft: number; label: string }>,
          programName: null as string | null,
          requestedDate: null as string | null,
          requestedTime: null as string | null,
          slotAvailable: null as boolean | null,
        };
      }

      if (!intent.understood || !intent.program) {
        return {
          understood: false,
          message: intent.message || "I couldn't understand your booking request. Please try saying something like 'Book a private lesson for March 20 at 11 AM'.",
          redirectUrl: null as string | null,
          alternatives: [] as Array<{ date: string; time: string; spotsLeft: number; label: string }>,
          programName: null as string | null,
          requestedDate: null as string | null,
          requestedTime: null as string | null,
          slotAvailable: null as boolean | null,
        };
      }

      const programName = PROGRAM_DISPLAY_NAMES[intent.program] || intent.program;
      const bookingRoute = PROGRAM_ROUTE_MAP[intent.program] || "/programs";

      // For programs that don't use schedule slots
      const noSlotPrograms = ["summer_camp", "junior", "mental_coaching", "tournament"];
      if (noSlotPrograms.includes(intent.program)) {
        const redirectUrl = intent.date
          ? `${bookingRoute}?date=${intent.date}${intent.time ? `&time=${intent.time}` : ""}`
          : bookingRoute;
        return {
          understood: true,
          message: intent.message,
          redirectUrl,
          alternatives: [] as Array<{ date: string; time: string; spotsLeft: number; label: string }>,
          programName,
          requestedDate: intent.date,
          requestedTime: intent.time,
          slotAvailable: true,
        };
      }

      // For private lessons and 105 clinic — check actual slot availability
      if (!intent.date) {
        return {
          understood: true,
          message: intent.message + " Please pick a date on the booking page.",
          redirectUrl: bookingRoute,
          alternatives: [] as Array<{ date: string; time: string; spotsLeft: number; label: string }>,
          programName,
          requestedDate: null,
          requestedTime: null,
          slotAvailable: null,
        };
      }

      const db = await getDb();
      if (!db) {
        return {
          understood: true,
          message: intent.message,
          redirectUrl: bookingRoute,
          alternatives: [] as Array<{ date: string; time: string; spotsLeft: number; label: string }>,
          programName,
          requestedDate: intent.date,
          requestedTime: intent.time,
          slotAvailable: null,
        };
      }

      let slotAvailable = false;
      let alternatives: Array<{ date: string; time: string; spotsLeft: number; label: string }> = [];

      if (intent.program === "clinic_105") {
        // Check schedule_slots for 105 clinic using slotDate column
        const slots = await db
          .select()
          .from(scheduleSlots)
          .where(
            and(
              eq(scheduleSlots.programId, PROGRAM_IDS.clinic_105),
              sql`DATE(${scheduleSlots.slotDate}) = ${intent.date}`,
              eq(scheduleSlots.isAvailable, true)
            )
          )
          .limit(5);

        const requestedSlot = intent.time
          ? slots.find(s => s.startTime.startsWith(intent.time!.substring(0, 5)))
          : slots[0];

        if (requestedSlot) {
          const spotsLeft = (requestedSlot.maxParticipants || 12) - (requestedSlot.currentParticipants || 0);
          slotAvailable = spotsLeft > 0;
          if (!slotAvailable) {
            // Find next available slots
            const nextSlots = await db
              .select()
              .from(scheduleSlots)
              .where(
                and(
                  eq(scheduleSlots.programId, PROGRAM_IDS.clinic_105),
                  sql`DATE(${scheduleSlots.slotDate}) >= ${intent.date}`,
                  eq(scheduleSlots.isAvailable, true),
                  sql`(${scheduleSlots.maxParticipants} - ${scheduleSlots.currentParticipants}) > 0`
                )
              )
              .limit(3);
            alternatives = nextSlots.map(s => {
              const dateStr = s.slotDate instanceof Date
                ? s.slotDate.toISOString().split("T")[0]
                : String(s.slotDate);
              return {
                date: dateStr,
                time: s.startTime,
                spotsLeft: (s.maxParticipants || 12) - (s.currentParticipants || 0),
                label: `${formatDateFriendly(dateStr)} at ${formatTime12h(s.startTime)}`,
              };
            });
          }
        } else {
          // No slot on that date — find next available
          const nextSlots = await db
            .select()
            .from(scheduleSlots)
            .where(
              and(
                eq(scheduleSlots.programId, PROGRAM_IDS.clinic_105),
                sql`DATE(${scheduleSlots.slotDate}) >= ${intent.date}`,
                eq(scheduleSlots.isAvailable, true),
                sql`(${scheduleSlots.maxParticipants} - ${scheduleSlots.currentParticipants}) > 0`
              )
            )
            .limit(3);
          alternatives = nextSlots.map(s => {
            const dateStr = s.slotDate instanceof Date
              ? s.slotDate.toISOString().split("T")[0]
              : String(s.slotDate);
            return {
              date: dateStr,
              time: s.startTime,
              spotsLeft: (s.maxParticipants || 12) - (s.currentParticipants || 0),
              label: `${formatDateFriendly(dateStr)} at ${formatTime12h(s.startTime)}`,
            };
          });
        }
      } else if (intent.program === "private_lesson") {
        // Check blocked times for private lessons using blockedDate column
        const blocked = await db
          .select()
          .from(blockedTimes)
          .where(
            and(
              sql`DATE(${blockedTimes.blockedDate}) = ${intent.date}`,
              eq(blockedTimes.affectsPrivateLessons, true)
            )
          )
          .limit(20);

        const requestedHour = intent.time ? parseInt(intent.time.split(":")[0]) : null;
        const isBlocked = blocked.some(b => {
          if (b.isAllDay) return true;
          if (!b.startTime || !b.endTime || requestedHour === null) return false;
          const bStart = parseInt(b.startTime.split(":")[0]);
          const bEnd = parseInt(b.endTime.split(":")[0]);
          return requestedHour >= bStart && requestedHour < bEnd;
        });

        slotAvailable = !isBlocked;

        if (!slotAvailable) {
          // Suggest other times on the same day
          const blockedHours = new Set(blocked.flatMap(b => {
            if (b.isAllDay) return [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
            if (!b.startTime || !b.endTime) return [];
            const start = parseInt(b.startTime.split(":")[0]);
            const end = parseInt(b.endTime.split(":")[0]);
            return Array.from({ length: end - start }, (_, i) => start + i);
          }));
          const availableHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].filter(h => !blockedHours.has(h));
          alternatives = availableHours.slice(0, 3).map(h => ({
            date: intent.date!,
            time: `${String(h).padStart(2, "0")}:00`,
            spotsLeft: 1,
            label: `${formatDateFriendly(intent.date!)} at ${formatTime12h(`${String(h).padStart(2, "0")}:00`)}`,
          }));
        }
      }

      const redirectUrl = slotAvailable && intent.date
        ? `${bookingRoute}?date=${intent.date}${intent.time ? `&time=${intent.time}` : ""}`
        : null;

      return {
        understood: true,
        message: intent.message,
        redirectUrl,
        alternatives,
        programName,
        requestedDate: intent.date,
        requestedTime: intent.time,
        slotAvailable,
      };
    }),

  // ── Quick Book: one-tap booking for logged-in users from voice assistant ──────
  quickBook: protectedProcedure
    .input(z.object({
      programType: z.string(),
      sessionDate: z.string(), // YYYY-MM-DD
      sessionTime: z.string().optional(), // HH:MM
      scheduleSlotId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Validate schedule slot if provided
      if (input.scheduleSlotId) {
        const slotRows = await db.select().from(scheduleSlots)
          .where(eq(scheduleSlots.id, input.scheduleSlotId)).limit(1);
        const slot = slotRows[0];
        if (!slot) throw new TRPCError({ code: "NOT_FOUND", message: "Session slot not found." });
        if (!slot.isAvailable) throw new TRPCError({ code: "BAD_REQUEST", message: "This session is no longer available." });
        if (slot.currentParticipants >= slot.maxParticipants) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Sorry, this session is now full." });
        }
      }

      // Look up the program ID from the hardcoded map (avoids accidental INSERT)
      const hardcodedId = PROGRAM_IDS[input.programType];
      let programId: number | undefined;

      if (hardcodedId) {
        // Verify the program actually exists in the DB
        const existingPrograms = await db.select({ id: programs.id })
          .from(programs)
          .where(eq(programs.id, hardcodedId))
          .limit(1);
        programId = existingPrograms[0]?.id;
      }

      if (!programId) {
        // Fallback: search by type without inserting
        const existingPrograms = await db.select({ id: programs.id })
          .from(programs)
          .where(and(eq(programs.type, input.programType as any), eq(programs.isActive, true)))
          .limit(1);
        programId = existingPrograms[0]?.id;
      }

      if (!programId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Program type "${input.programType}" not found. Please book through the booking page.`,
        });
      }

      // Determine price from program type
      const PRICE_MAP: Record<string, number> = {
        private_lesson: 12000,
        clinic_105: 3500,
        junior_daily: 8000,
        junior_weekly: 32000,
        junior: 8000,
        summer_camp_daily: 9000,
        summer_camp_weekly: 36000,
        summer_camp: 9000,
        mental_coaching: 0,
        tournament: 0,
      };
      const totalAmountCents = PRICE_MAP[input.programType] ?? 0;

      // Build session start/end time
      const sessionStartTime = input.sessionTime ? `${input.sessionTime}:00` : null;
      const sessionEndTime = input.sessionTime
        ? `${String(parseInt(input.sessionTime.split(":")[0]) + 1).padStart(2, "0")}:${input.sessionTime.split(":")[1] || "00"}:00`
        : null;

      await db.insert(bookings).values({
        userId: ctx.user.id,
        programId,
        scheduleSlotId: input.scheduleSlotId || null,
        totalAmountCents,
        sessionDate: new Date(input.sessionDate + "T12:00:00") as any,
        sessionStartTime: sessionStartTime || null,
        sessionEndTime: sessionEndTime || null,
        sharedStudentCount: 1,
        quantity: 1,
        notes: "Booked via Voice Assistant",
        status: "pending",
      });

      // Increment slot participant count
      if (input.scheduleSlotId) {
        await db.update(scheduleSlots)
          .set({ currentParticipants: sql`${scheduleSlots.currentParticipants} + 1`, updatedAt: new Date() })
          .where(eq(scheduleSlots.id, input.scheduleSlotId));
      }

      // Get the new booking ID
      const newBookingRows = await db.select({ id: bookings.id })
        .from(bookings).where(eq(bookings.userId, ctx.user.id))
        .orderBy(desc(bookings.createdAt)).limit(1);
      const newBookingId = newBookingRows[0]?.id ?? 0;

      return { success: true, bookingId: newBookingId };
    }),
});
