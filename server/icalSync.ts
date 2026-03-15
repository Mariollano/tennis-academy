/**
 * iCal Sync Service
 * Fetches Apple Calendar (.ics) events and creates blocked_times entries
 * so students cannot book during personal appointments.
 */
import ical, { VEvent } from "node-ical";
import { getDb } from "./db";
import { icalSyncSettings, blockedTimes } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// How many days ahead to sync (90 days rolling window)
const SYNC_DAYS_AHEAD = 90;
// Prefix used to identify auto-synced blocks (so we can update/delete them safely)
const ICAL_BLOCK_PREFIX = "[iCal]";

/** Format a Date as "HH:MM:SS" in local time */
function toTimeString(date: Date): string {
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}:00`;
}

/** Format a Date as "YYYY-MM-DD" in local time */
function toDateString(date: Date): string {
  const y = date.getFullYear();
  const mo = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

/**
 * Main sync function — fetches the iCal URL, parses events,
 * removes old iCal-sourced blocks, and inserts fresh ones.
 */
export async function syncIcalCalendar(): Promise<{
  success: boolean;
  message: string;
  blocksCreated: number;
}> {
  // 1. Load settings
  const db = await getDb();
  if (!db) return { success: false, message: "Database not available", blocksCreated: 0 };
  const settings = await db.select().from(icalSyncSettings).limit(1);
  if (!settings.length || !settings[0].isEnabled) {
    return { success: false, message: "iCal sync not configured or disabled", blocksCreated: 0 };
  }

  let { icalUrl } = settings[0];

  // Convert webcal:// to https:// — fetch() does not support the webcal:// protocol
  if (icalUrl.startsWith("webcal://")) {
    icalUrl = "https://" + icalUrl.slice("webcal://".length);
  } else if (icalUrl.startsWith("webcals://")) {
    icalUrl = "https://" + icalUrl.slice("webcals://".length);
  }

  console.log(`[iCalSync] Fetching calendar from: ${icalUrl.substring(0, 60)}...`);

  try {
    // 2. Fetch and parse the .ics feed
    const rawEvents = await ical.async.fromURL(icalUrl);

    const now = new Date();
    const cutoff = new Date(now.getTime() + SYNC_DAYS_AHEAD * 24 * 60 * 60 * 1000);
    const windowStart = toDateString(now);
    const windowEnd = toDateString(cutoff);

    // 3. Delete all previously synced iCal blocks in the rolling window
    const existingBlocks = await db.select().from(blockedTimes);

    const icalBlockIds = existingBlocks
      .filter((b) => {
        const dateStr = b.blockedDate instanceof Date ? toDateString(b.blockedDate) : String(b.blockedDate);
        return b.title.startsWith(ICAL_BLOCK_PREFIX) && dateStr >= windowStart && dateStr <= windowEnd;
      })
      .map((b) => b.id);

    for (const id of icalBlockIds) {
      await db.delete(blockedTimes).where(eq(blockedTimes.id, id));
    }

    // 4. Insert fresh blocks from the calendar
    let blocksCreated = 0;
    let totalEvents = 0;

    for (const component of Object.values(rawEvents)) {
      if (!component || component.type !== "VEVENT") continue;
      totalEvents++;

      const event = component as VEvent;
      const start = event.start as Date;
      const end = event.end as Date;

      if (!start || !end) continue;

      // Skip events outside our rolling window
      if (start > cutoff || end < now) continue;

      const summary = (event.summary as string) || "Personal Appointment";
      const title = `${ICAL_BLOCK_PREFIX} ${summary}`;

      // Detect all-day events: node-ical sets datetype = 'date' for all-day
      const isAllDay = (event as any).datetype === "date";

      // Iterate each day the event spans
      const startDate = new Date(start);
      const endDate = new Date(end);

      // For all-day events, iCal end is exclusive (next day midnight), so subtract 1ms
      const adjustedEnd = isAllDay ? new Date(endDate.getTime() - 1) : endDate;

      const current = new Date(startDate);
      current.setHours(0, 0, 0, 0);

      while (current <= adjustedEnd) {
        const dateStr = toDateString(current);

        if (dateStr >= windowStart && dateStr <= windowEnd) {
          let dayStart: string | null = null;
          let dayEnd: string | null = null;

          if (!isAllDay) {
            const nextDay = new Date(current);
            nextDay.setDate(nextDay.getDate() + 1);

            const dayStartDt = current.getTime() > startDate.getTime() ? new Date(current) : startDate;
            const dayEndDt = endDate < nextDay ? endDate : nextDay;

            dayStart = toTimeString(dayStartDt);
            dayEnd = toTimeString(dayEndDt);

            // Skip zero-length blocks
            if (dayStart === dayEnd) {
              current.setDate(current.getDate() + 1);
              continue;
            }
          }

          // blockedDate column expects a Date object
          const blockDate = new Date(current);
          await db.insert(blockedTimes).values({
            title,
            blockedDate: blockDate,
            startTime: dayStart,
            endTime: dayEnd,
            isAllDay,
            affectsPrivateLessons: true,
            affects105Clinic: true,
          });

          blocksCreated++;
        }

        current.setDate(current.getDate() + 1);
      }
    }

    // 5. Update last sync timestamp
    await db.update(icalSyncSettings).set({
      lastSyncedAt: new Date(),
      lastSyncStatus: "success",
      lastSyncMessage: `Synced ${blocksCreated} blocks from ${totalEvents} events`,
    }).where(eq(icalSyncSettings.id, settings[0].id));

    return {
      success: true,
      message: `Successfully synced ${blocksCreated} time blocks from ${totalEvents} calendar events`,
      blocksCreated,
    };
  } catch (err: any) {
    const db2 = await getDb();
    if (db2) {
      const settingsRow = await db2.select().from(icalSyncSettings).limit(1);
      if (settingsRow.length) {
        await db2.update(icalSyncSettings).set({
          lastSyncedAt: new Date(),
          lastSyncStatus: "error",
          lastSyncMessage: err.message || "Unknown error",
        }).where(eq(icalSyncSettings.id, settingsRow[0].id));
      }
    }

    return {
      success: false,
      message: err.message || "Failed to sync calendar",
      blocksCreated: 0,
    };
  }
}
