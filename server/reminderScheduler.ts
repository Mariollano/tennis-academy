/**
 * Reminder Scheduler
 * Runs every minute to check for pending scheduled reminders and fires them.
 * Called from server startup (server/_core/server.ts or index.ts).
 */
import { getDb } from "./db";
import { scheduledReminders, bookings, users, programs } from "../drizzle/schema";
import { eq, lte, and } from "drizzle-orm";
import { sendBookingReminder, isEmailConfigured } from "./email";
import { sendSms, isTwilioConfigured } from "./sms";

function formatTime12h(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || "0", 10);
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export async function processScheduledReminders(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const now = new Date();

  // Find all pending reminders that are due — with ECONNRESET retry
  let due: typeof scheduledReminders.$inferSelect[] = [];
  try {
    due = await db
      .select()
      .from(scheduledReminders)
      .where(and(eq(scheduledReminders.status, "pending"), lte(scheduledReminders.sendAt, now)));
  } catch (err: any) {
    // Transient DB connection error (ECONNRESET) — skip this cycle, will retry next interval
    if (err?.cause?.code === "ECONNRESET" || err?.message?.includes("ECONNRESET")) {
      return; // Silent skip — not a real error
    }
    console.error("[ReminderScheduler] DB query error:", err?.message);
    return;
  }

  if (due.length === 0) return;

  console.log(`[ReminderScheduler] Processing ${due.length} due reminder(s)`);

  for (const reminder of due) {
    try {
      // Fetch booking + user + program details
      const rows = await db
        .select({
          booking: bookings,
          user: { id: users.id, name: users.name, email: users.email, phone: users.phone },
          programName: programs.name,
        })
        .from(bookings)
        .leftJoin(users, eq(bookings.userId, users.id))
        .leftJoin(programs, eq(bookings.programId, programs.id))
        .where(eq(bookings.id, reminder.bookingId))
        .limit(1);

      if (!rows.length) {
        await db
          .update(scheduledReminders)
          .set({ status: "failed", error: "Booking not found", sentAt: new Date() })
          .where(eq(scheduledReminders.id, reminder.id));
        continue;
      }

      const { booking, user, programName } = rows[0];

      // Skip if booking is cancelled
      if (booking.status === "cancelled") {
        await db
          .update(scheduledReminders)
          .set({ status: "cancelled", sentAt: new Date() })
          .where(eq(scheduledReminders.id, reminder.id));
        continue;
      }

      const sessionDate = booking.sessionDate
        ? new Date(booking.sessionDate).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : undefined;
      const sessionTime =
        booking.sessionStartTime && booking.sessionEndTime
          ? `${formatTime12h(booking.sessionStartTime)} – ${formatTime12h(booking.sessionEndTime)}`
          : undefined;

      let emailSent = false;
      let smsSent = false;

      // Send reminder email
      if (user?.email && isEmailConfigured()) {
        try {
          await sendBookingReminder({
            toEmail: user.email,
            toName: user.name || "Student",
            programLabel: programName || "Tennis Session",
            sessionDate,
            sessionTime,
            bookingId: booking.id,
          });
          emailSent = true;
        } catch (e: any) {
          console.error(`[ReminderScheduler] Email failed for reminder #${reminder.id}:`, e?.message);
        }
      }

      // Send reminder SMS
      if (user?.phone && isTwilioConfigured()) {
        try {
          const dateStr = sessionDate ? ` on ${sessionDate}` : "";
          const timeStr = sessionTime ? ` at ${sessionTime}` : "";
          await sendSms(
            user.phone,
            `🎾 Reminder: Hi ${user.name || "there"}, your ${programName || "tennis session"} is TODAY${dateStr}${timeStr}. Please arrive 5–10 min early. See you on the court! — Coach Mario`
          );
          smsSent = true;
        } catch (e: any) {
          console.error(`[ReminderScheduler] SMS failed for reminder #${reminder.id}:`, e?.message);
        }
      }

      // Mark as sent
      await db
        .update(scheduledReminders)
        .set({ status: "sent", emailSent, smsSent, sentAt: new Date() })
        .where(eq(scheduledReminders.id, reminder.id));

      console.log(
        `[ReminderScheduler] Reminder #${reminder.id} sent — email: ${emailSent}, SMS: ${smsSent}`
      );
    } catch (err: any) {
      console.error(`[ReminderScheduler] Error processing reminder #${reminder.id}:`, err?.message);
      await db
        .update(scheduledReminders)
        .set({ status: "failed", error: err?.message || "Unknown error", sentAt: new Date() })
        .where(eq(scheduledReminders.id, reminder.id));
    }
  }
}

/**
 * Start the reminder scheduler — polls every 60 seconds.
 */
export function startReminderScheduler(): void {
  console.log("[ReminderScheduler] Started — checking every 60 seconds");
  // Run immediately on startup to catch any missed reminders
  processScheduledReminders().catch(console.error);
  // Then run every 60 seconds
  setInterval(() => {
    processScheduledReminders().catch(console.error);
  }, 60 * 1000);
}
