/**
 * iCal Sync Service
 * Fetches Google/Apple Calendar (.ics) events and creates blocked_times entries
 * so students cannot book during Coach Mario's personal appointments and lessons.
 *
 * Handles:
 *   - Single (non-recurring) events
 *   - Recurring events (RRULE) — expanded into individual occurrences
 *   - All-day events
 *   - Multi-day events
 *
 * TIMEZONE NOTES:
 *   - All calendar events are in America/New_York timezone
 *   - blockedDate is stored as a MySQL DATE column (YYYY-MM-DD string)
 *   - startTime / endTime are stored as "HH:MM:SS" strings in Eastern time
 *   - The blockedDate value stored must match what MySQL DATE() returns
 *     (i.e., the Eastern-timezone date of the event, stored as a UTC midnight Date)
 *   - Cleanup uses toISOString().substring(0,10) to get the UTC date from
 *     the database-returned Date object (MySQL DATE columns come back as midnight UTC)
 */
import ical, { VEvent } from "node-ical";
import pkg from "rrule";
const { rrulestr } = pkg;
import { getDb } from "./db";
import { icalSyncSettings, blockedTimes } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// How many days ahead to sync (90 days rolling window)
const SYNC_DAYS_AHEAD = 90;
// Prefix used to identify auto-synced blocks (so we can update/delete them safely)
const ICAL_BLOCK_PREFIX = "[iCal]";
// Timezone for Coach Mario's calendar — all times stored in this zone
const COACH_TIMEZONE = "America/New_York";

/** Format a Date as "HH:MM:SS" in the coach's Eastern timezone */
function toTimeString(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: COACH_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const h = parts.find((p) => p.type === "hour")?.value ?? "00";
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${h}:${m}:00`;
}

/**
 * Format a Date as "YYYY-MM-DD" in the coach's Eastern timezone.
 * Used for windowStart/windowEnd comparisons and for creating the blockedDate value.
 */
function toDateStringEastern(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: COACH_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value ?? "2000";
  const mo = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${mo}-${d}`;
}

/**
 * Create a Date object representing midnight UTC for a given YYYY-MM-DD string.
 * MySQL DATE columns are stored/returned as midnight UTC, so we use this to
 * create a blockedDate value that MySQL will store as the correct date.
 */
function dateStringToMidnightUTC(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00.000Z");
}

/**
 * Given a single event occurrence (start + end + summary + isAllDay),
 * insert blocked_times rows for each day it spans that falls within the window.
 */
async function insertBlocksForOccurrence(
  db: Awaited<ReturnType<typeof getDb>>,
  title: string,
  startDate: Date,
  endDate: Date,
  isAllDay: boolean,
  windowStart: string,
  windowEnd: string
): Promise<number> {
  if (!db) return 0;
  let blocksCreated = 0;

  // For all-day events, iCal end is exclusive (next day midnight), so subtract 1ms
  const adjustedEnd = isAllDay ? new Date(endDate.getTime() - 1) : endDate;

  // Start iterating from the Eastern-timezone date of the event start
  // We use the Eastern date string to avoid UTC/local confusion
  const startDateStr = toDateStringEastern(startDate);
  const endDateStr = toDateStringEastern(adjustedEnd);

  // Build a list of dates to process (YYYY-MM-DD strings)
  const datesToProcess: string[] = [];
  const cursor = new Date(startDateStr + "T12:00:00.000Z"); // noon UTC to avoid DST edge cases
  const endCursor = new Date(endDateStr + "T12:00:00.000Z");

  while (cursor <= endCursor) {
    datesToProcess.push(cursor.toISOString().substring(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  for (const dateStr of datesToProcess) {
    if (dateStr < windowStart || dateStr > windowEnd) continue;

    let dayStart: string | null = null;
    let dayEnd: string | null = null;

    if (!isAllDay) {
      // Determine the start/end times for this specific day
      // If event starts before this day, use midnight Eastern as start
      // If event ends after this day, use midnight Eastern as end
      const dayStartMidnightUTC = new Date(dateStr + "T00:00:00.000Z");
      const dayEndMidnightUTC = new Date(dateStr + "T00:00:00.000Z");
      dayEndMidnightUTC.setUTCDate(dayEndMidnightUTC.getUTCDate() + 1);

      // Use the actual event start/end, clamped to this day's Eastern midnight boundaries
      // We compare by Eastern date string to determine if event starts/ends on this day
      const eventStartDateStr = toDateStringEastern(startDate);
      const eventEndDateStr = toDateStringEastern(endDate);

      const dayStartDt = eventStartDateStr === dateStr ? startDate : dayStartMidnightUTC;
      const dayEndDt = eventEndDateStr === dateStr ? endDate : dayEndMidnightUTC;

      dayStart = toTimeString(dayStartDt);
      dayEnd = toTimeString(dayEndDt);

      // Skip zero-length blocks
      if (dayStart === dayEnd) continue;
    }

    // Store blockedDate as midnight UTC for this date string
    // MySQL DATE column stores/returns dates as midnight UTC
    const blockDate = dateStringToMidnightUTC(dateStr);

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

  return blocksCreated;
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

  // Convert webcal:// and webcals:// to https:// — fetch() does not support these protocols
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
    const windowStart = toDateStringEastern(now);
    const windowEnd = toDateStringEastern(cutoff);

    // 3. Delete all previously synced iCal blocks in the rolling window
    // CRITICAL: MySQL DATE columns are returned by Drizzle as Date objects at midnight UTC.
    // For example, the date 2026-03-18 comes back as new Date('2026-03-18T00:00:00.000Z').
    // We must use toISOString().substring(0,10) to get "2026-03-18" — NOT toDateStringEastern()
    // which would convert midnight UTC to Eastern time and return "2026-03-17" (wrong!).
    const existingBlocks = await db.select().from(blockedTimes);
    const icalBlockIds = existingBlocks
      .filter((b) => {
        // Get the date string as stored in MySQL (UTC-based)
        const dateStr = b.blockedDate instanceof Date
          ? b.blockedDate.toISOString().substring(0, 10)
          : String(b.blockedDate).substring(0, 10);
        return b.title.startsWith(ICAL_BLOCK_PREFIX) && dateStr >= windowStart && dateStr <= windowEnd;
      })
      .map((b) => b.id);

    console.log(`[iCalSync] Deleting ${icalBlockIds.length} old iCal blocks in window ${windowStart}..${windowEnd}`);

    for (const id of icalBlockIds) {
      await db.delete(blockedTimes).where(eq(blockedTimes.id, id));
    }

    // 4. Process all events — both single and recurring
    let blocksCreated = 0;
    let totalEvents = 0;
    let totalOccurrences = 0;

    for (const component of Object.values(rawEvents)) {
      if (!component || component.type !== "VEVENT") continue;
      totalEvents++;

      const event = component as VEvent;
      const summary = (event.summary as string) || "Personal Appointment";
      const title = `${ICAL_BLOCK_PREFIX} ${summary}`;
      const isAllDay = (event as any).datetype === "date";

      // ── Recurring events ────────────────────────────────────────────────────
      if (event.rrule) {
        try {
          const rruleObj = event.rrule as any;
          let rule: any;

          if (typeof rruleObj === "string") {
            rule = rrulestr(rruleObj, { dtstart: event.start as Date });
          } else if (rruleObj.toString) {
            const rruleString = rruleObj.toString();
            rule = rrulestr(rruleString, { dtstart: event.start as Date });
          } else {
            continue;
          }

          // Get all occurrences in our window
          const occurrences: Date[] = rule.between(now, cutoff, true);

          // Get the duration of the event to compute end time for each occurrence
          const originalStart = event.start as Date;
          const originalEnd = event.end as Date;
          const durationMs = originalEnd && originalStart
            ? originalEnd.getTime() - originalStart.getTime()
            : 60 * 60 * 1000; // default 1 hour

          // Build set of exception dates (EXDATE) to skip cancelled occurrences
          const exdates = new Set<string>();
          if ((event as any).exdate) {
            const exdateVal = (event as any).exdate;
            const exdateList = Array.isArray(exdateVal) ? exdateVal : Object.values(exdateVal);
            for (const ex of exdateList) {
              const exDate = ex instanceof Date ? ex : new Date(ex);
              exdates.add(exDate.toISOString().substring(0, 10));
            }
          }

          for (const occStart of occurrences) {
            // Skip cancelled occurrences
            const occDateStr = occStart.toISOString().substring(0, 10);
            if (exdates.has(occDateStr)) continue;

            const occEnd = new Date(occStart.getTime() + durationMs);
            totalOccurrences++;
            blocksCreated += await insertBlocksForOccurrence(
              db, title, occStart, occEnd, isAllDay, windowStart, windowEnd
            );
          }
        } catch (rruleErr) {
          // If rrule expansion fails, fall through to treat as single event
          console.warn(`[iCalSync] rrule expansion failed for "${summary}":`, (rruleErr as Error).message);
        }
        continue; // Don't also process as a single event
      }

      // ── Single (non-recurring) events ───────────────────────────────────────
      const start = event.start as Date;
      const end = event.end as Date;
      if (!start || !end) continue;

      // Skip events entirely outside our rolling window
      if (start > cutoff || end < now) continue;

      totalOccurrences++;
      blocksCreated += await insertBlocksForOccurrence(
        db, title, start, end, isAllDay, windowStart, windowEnd
      );
    }

    // 5. Update last sync timestamp
    await db.update(icalSyncSettings).set({
      lastSyncedAt: new Date(),
      lastSyncStatus: "success",
      lastSyncMessage: `Synced ${blocksCreated} blocks from ${totalOccurrences} occurrences (${totalEvents} events)`,
    }).where(eq(icalSyncSettings.id, settings[0].id));

    return {
      success: true,
      message: `Successfully synced ${blocksCreated} time blocks from ${totalOccurrences} occurrences`,
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
