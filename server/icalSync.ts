/**
 * iCal Sync Service
 *
 * Fetches Google/Apple Calendar (.ics) events and creates blocked_times entries.
 *
 * TIMEZONE DESIGN:
 * ────────────────
 * Uses Luxon for all timezone conversions — the community-proven approach for
 * node-ical + rrule timezone handling (see: https://medium.com/@rene_52707/...)
 *
 * node-ical parses DTSTART;TZID=America/New_York:20241205T153000 into:
 *   event.start = Date("2024-12-05T20:30:00.000Z")  (real UTC)
 *   event.start.tz = "America/New_York"              (original timezone)
 *
 * rrule.between() returns "floating" UTC dates where the UTC components equal
 * the original wall-clock time (e.g. 3:30 PM → Date("...T15:30:00Z")).
 *
 * The Luxon fix for each floating occurrence:
 *   1. Read it as UTC: DateTime.fromJSDate(occ, { zone: 'UTC' })
 *   2. Switch to original timezone: .setZone(originalTz)
 *   3. Force the original wall-clock time: .set({ hour, minute, second })
 *   4. Convert to JS Date: .toJSDate()  ← this is the real UTC date
 *
 * This handles DST transitions correctly without any manual offset math.
 *
 * STORAGE:
 * ────────
 * blockedDate: MySQL DATE → midnight UTC (new Date("YYYY-MM-DDT00:00:00.000Z"))
 * startTime / endTime: "HH:MM:SS" Eastern time strings
 */
import ical, { VEvent } from "node-ical";
import pkg from "rrule";
const { rrulestr } = pkg;
import { DateTime } from "luxon";
import { getDb } from "./db";
import { icalSyncSettings, blockedTimes } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const SYNC_DAYS_AHEAD = 90;
const ICAL_BLOCK_PREFIX = "[iCal]";
const COACH_TIMEZONE = "America/New_York";

// ── Timezone helpers (Luxon-based) ────────────────────────────────────────────

/** Format a JS Date as "HH:MM:SS" in Eastern timezone. */
function toTimeString(date: Date): string {
  const dt = DateTime.fromJSDate(date, { zone: COACH_TIMEZONE });
  return dt.toFormat("HH:mm:ss");
}

/** Format a JS Date as "YYYY-MM-DD" in Eastern timezone. */
function toDateStringEastern(date: Date): string {
  const dt = DateTime.fromJSDate(date, { zone: COACH_TIMEZONE });
  return dt.toISODate()!;
}

/**
 * Create a Date at noon UTC for a YYYY-MM-DD string (for MySQL DATE columns).
 *
 * IMPORTANT: Must use noon UTC (T12:00:00Z), NOT midnight UTC (T00:00:00Z).
 * The MySQL connection timezone is Eastern (UTC-4/5). Midnight UTC = 8 PM Eastern
 * the PREVIOUS day, so MySQL stores the wrong date. Noon UTC = 8 AM Eastern,
 * safely within the correct calendar day regardless of DST.
 */
function dateStringToMidnightUTC(dateStr: string): Date {
  return new Date(dateStr + "T12:00:00.000Z");
}

/**
 * Convert a "floating" rrule occurrence to a real UTC Date using Luxon.
 *
 * rrule returns floating dates where UTC components = original wall-clock time.
 * e.g. floating = Date("2026-03-19T15:30:00Z") means "3:30 PM" (floating).
 *
 * We fix this by:
 * 1. Reading the floating date as UTC to extract wall-clock components
 * 2. Applying those components in the original event timezone
 * 3. Converting back to a real UTC JS Date
 */
function floatingOccurrenceToRealDate(
  floatingOcc: Date,
  originalTz: string,
  originalHour: number,
  originalMinute: number,
  originalSecond: number
): Date {
  // Read the floating occurrence as UTC to get the date components
  const floatingDt = DateTime.fromJSDate(floatingOcc, { zone: "UTC" });

  // Apply the original wall-clock time in the original timezone
  const realDt = floatingDt
    .setZone(originalTz)
    .set({
      hour: originalHour,
      minute: originalMinute,
      second: originalSecond,
      millisecond: 0,
    });

  return realDt.toJSDate();
}

// ── Block insertion ───────────────────────────────────────────────────────────

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

  // For all-day events, iCal end is exclusive (next day midnight)
  const adjustedEnd = isAllDay ? new Date(endDate.getTime() - 1) : endDate;

  const startDateStr = toDateStringEastern(startDate);
  const endDateStr = toDateStringEastern(adjustedEnd);

  // Iterate over each Eastern-calendar day the event spans
  const cursor = new Date(startDateStr + "T12:00:00.000Z");
  const endCursor = new Date(endDateStr + "T12:00:00.000Z");

  while (cursor <= endCursor) {
    const dateStr = cursor.toISOString().substring(0, 10);
    if (dateStr >= windowStart && dateStr <= windowEnd) {
      let dayStart: string | null = null;
      let dayEnd: string | null = null;

      if (!isAllDay) {
        const eventStartDateStr = toDateStringEastern(startDate);
        const eventEndDateStr = toDateStringEastern(endDate);

        const dayStartMidnight = new Date(dateStr + "T00:00:00.000Z");
        const dayEndMidnight = new Date(dateStr + "T00:00:00.000Z");
        dayEndMidnight.setUTCDate(dayEndMidnight.getUTCDate() + 1);

        const dayStartDt = eventStartDateStr === dateStr ? startDate : dayStartMidnight;
        const dayEndDt = eventEndDateStr === dateStr ? endDate : dayEndMidnight;

        dayStart = toTimeString(dayStartDt);
        dayEnd = toTimeString(dayEndDt);
        if (dayStart === dayEnd) {
          cursor.setUTCDate(cursor.getUTCDate() + 1);
          continue;
        }
      }

      await db.insert(blockedTimes).values({
        title,
        blockedDate: dateStringToMidnightUTC(dateStr),
        startTime: dayStart,
        endTime: dayEnd,
        isAllDay,
        affectsPrivateLessons: true,
        affects105Clinic: true,
      });
      blocksCreated++;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return blocksCreated;
}

// ── Main sync ─────────────────────────────────────────────────────────────────

export async function syncIcalCalendar(): Promise<{
  success: boolean;
  message: string;
  blocksCreated: number;
}> {
  const db = await getDb();
  if (!db) return { success: false, message: "Database not available", blocksCreated: 0 };

  const settings = await db.select().from(icalSyncSettings).limit(1);
  if (!settings.length || !settings[0].isEnabled) {
    return { success: false, message: "iCal sync not configured or disabled", blocksCreated: 0 };
  }

  let { icalUrl } = settings[0];
  if (icalUrl.startsWith("webcal://")) icalUrl = "https://" + icalUrl.slice(9);
  else if (icalUrl.startsWith("webcals://")) icalUrl = "https://" + icalUrl.slice(10);

  console.log(`[iCalSync] Fetching calendar from: ${icalUrl.substring(0, 60)}...`);

  try {
    const rawEvents = await ical.async.fromURL(icalUrl);

    const now = new Date();
    const cutoff = new Date(now.getTime() + SYNC_DAYS_AHEAD * 24 * 60 * 60 * 1000);
    const windowStart = toDateStringEastern(now);
    const windowEnd = toDateStringEastern(cutoff);

    // Start of today in Eastern time (for single event filter)
    // We include events that started today even if they already ended,
    // so the booking calendar correctly blocks those slots.
    const startOfTodayEastern = DateTime.now().setZone(COACH_TIMEZONE).startOf('day').toJSDate();

    // Delete existing iCal blocks in the window using SQL DATE comparison
    // (avoids JS timezone issues when reading DATE columns back from MySQL)
    const { sql } = await import("drizzle-orm");
    const existingBlocks = await db
      .select()
      .from(blockedTimes)
      .where(
        sql`${blockedTimes.title} LIKE ${ICAL_BLOCK_PREFIX + '%'}
          AND DATE_FORMAT(${blockedTimes.blockedDate}, '%Y-%m-%d') >= ${windowStart}
          AND DATE_FORMAT(${blockedTimes.blockedDate}, '%Y-%m-%d') <= ${windowEnd}`
      );
    const icalBlockIds = existingBlocks.map((b) => b.id);

    console.log(`[iCalSync] Deleting ${icalBlockIds.length} old iCal blocks in window ${windowStart}..${windowEnd}`);
    for (const id of icalBlockIds) {
      await db.delete(blockedTimes).where(eq(blockedTimes.id, id));
    }

    let blocksCreated = 0;
    let totalOccurrences = 0;

    for (const component of Object.values(rawEvents)) {
      if (!component || component.type !== "VEVENT") continue;

      const event = component as VEvent;
      const summary = (event.summary as string) || "Personal Appointment";
      const title = `${ICAL_BLOCK_PREFIX} ${summary}`;
      const isAllDay = (event as any).datetype === "date";

      // ── Recurring events ────────────────────────────────────────────────────
      if (event.rrule) {
        try {
          const rruleObj = event.rrule as any;
          const originalStart = event.start as Date;
          const originalEnd = event.end as Date;
          const durationMs = originalEnd && originalStart
            ? originalEnd.getTime() - originalStart.getTime()
            : 60 * 60 * 1000;

          // Get the original timezone from node-ical (e.g. "America/New_York")
          const originalTz: string = (originalStart as any).tz || COACH_TIMEZONE;

          // Get the original wall-clock time components in the original timezone
          const originalDt = DateTime.fromJSDate(originalStart, { zone: originalTz });
          const origHour = originalDt.hour;
          const origMinute = originalDt.minute;
          const origSecond = originalDt.second;

          // Build floating dtstart: UTC components = original wall-clock time
          // This is what rrule expects for floating time expansion
          const floatingDtstart = new Date(
            Date.UTC(
              originalDt.year, originalDt.month - 1, originalDt.day,
              origHour, origMinute, origSecond
            )
          );

          // Build floating window boundaries for rrule.between()
          // Use start of today (not current time) so recurring events earlier
          // today are not missed when the sync runs mid-day.
          const nowDt = DateTime.fromJSDate(now, { zone: originalTz }).startOf('day');
          const cutoffDt = DateTime.fromJSDate(cutoff, { zone: originalTz });
          const floatingNow = new Date(Date.UTC(nowDt.year, nowDt.month - 1, nowDt.day, 0, 0, 0));
          const floatingCutoff = new Date(Date.UTC(cutoffDt.year, cutoffDt.month - 1, cutoffDt.day, cutoffDt.hour, cutoffDt.minute, cutoffDt.second));

          // Build rrule with floating dtstart
          let rule: any;
          if (typeof rruleObj === "string") {
            rule = rrulestr(rruleObj, { dtstart: floatingDtstart });
          } else if (rruleObj.toString) {
            const rruleString = rruleObj.toString();
            // Strip any embedded DTSTART — we provide our own floating one
            const rruleOnly = rruleString.replace(/^DTSTART[^\n]*\n?/m, "").trim();
            rule = rrulestr(rruleOnly || rruleString, { dtstart: floatingDtstart });
          } else {
            continue;
          }

          const occurrences: Date[] = rule.between(floatingNow, floatingCutoff, true);

          // Build exdate set (cancelled occurrences)
          const exdates = new Set<string>();
          if ((event as any).exdate) {
            const exdateVal = (event as any).exdate;
            const exdateList = Array.isArray(exdateVal) ? exdateVal : Object.values(exdateVal);
            for (const ex of exdateList) {
              const exDate = ex instanceof Date ? ex : new Date(ex);
              exdates.add(toDateStringEastern(exDate));
            }
          }

          for (const floatingOcc of occurrences) {
            // Convert floating occurrence to real UTC using Luxon
            const occStart = floatingOccurrenceToRealDate(
              floatingOcc, originalTz, origHour, origMinute, origSecond
            );
            const occEnd = new Date(occStart.getTime() + durationMs);

            const occDateStr = toDateStringEastern(occStart);
            if (exdates.has(occDateStr)) continue;

            totalOccurrences++;
            blocksCreated += await insertBlocksForOccurrence(
              db, title, occStart, occEnd, isAllDay, windowStart, windowEnd
            );
          }
        } catch (err) {
          console.warn(`[iCalSync] rrule expansion failed for "${summary}":`, (err as Error).message);
        }
        continue;
      }

      // ── Single events ────────────────────────────────────────────────────────
      const start = event.start as Date;
      const end = event.end as Date;
      if (!start || !end) continue;
      // Skip events that ended before today (not just before now),
      // so events that already ended earlier today are still included.
      if (start > cutoff || end < startOfTodayEastern) continue;

      totalOccurrences++;
      blocksCreated += await insertBlocksForOccurrence(
        db, title, start, end, isAllDay, windowStart, windowEnd
      );
    }

    await db.update(icalSyncSettings).set({
      lastSyncedAt: new Date(),
      lastSyncStatus: "success",
      lastSyncMessage: `Synced ${blocksCreated} blocks from ${totalOccurrences} occurrences`,
    }).where(eq(icalSyncSettings.id, settings[0].id));

    console.log(`[iCalSync] Initial sync: Successfully synced ${blocksCreated} time blocks from ${totalOccurrences} occurrences`);

    return {
      success: true,
      message: `Successfully synced ${blocksCreated} time blocks from ${totalOccurrences} occurrences`,
      blocksCreated,
    };
  } catch (err: any) {
    const db2 = await getDb();
    if (db2) {
      const s = await db2.select().from(icalSyncSettings).limit(1);
      if (s.length) {
        await db2.update(icalSyncSettings).set({
          lastSyncedAt: new Date(),
          lastSyncStatus: "error",
          lastSyncMessage: err.message || "Unknown error",
        }).where(eq(icalSyncSettings.id, s[0].id));
      }
    }
    return { success: false, message: err.message || "Failed to sync calendar", blocksCreated: 0 };
  }
}
