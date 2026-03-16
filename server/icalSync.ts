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

/** Format a Date as "HH:MM:SS" in the coach's local timezone */
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

/** Format a Date as "YYYY-MM-DD" in the coach's local timezone */
function toDateString(date: Date): string {
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
