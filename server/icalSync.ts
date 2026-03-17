/**
 * iCal Sync Service
 *
 * Fetches Google/Apple Calendar (.ics) events and creates blocked_times entries.
 *
 * TIMEZONE DESIGN (server runs in UTC):
 * ─────────────────────────────────────
 * The server process runs in UTC (Etc/Unknown). All timezone conversions use
 * Intl.DateTimeFormat with timeZone: "America/New_York" — never server local time.
 *
 * node-ical parses DTSTART;TZID=America/New_York:... into a real UTC Date.
 * e.g. DTSTART:20241205T153000 Eastern → new Date("2024-12-05T20:30:00.000Z")
 *
 * The rrule library generates "floating" occurrences: the UTC components of the
 * returned Date equal the Eastern wall-clock time of the original DTSTART.
 * e.g. occurrence for 3:30 PM Eastern → Date("2026-03-19T15:30:00.000Z") [floating]
 *
 * To convert a floating occurrence back to real UTC:
 *   realUTC = floating - easternOffsetMs(floating)
 * where easternOffsetMs is computed by comparing UTC and Eastern formatted strings.
 *
 * This approach is server-timezone-independent (works in UTC or any other TZ).
 *
 * STORAGE:
 * ─────────────────────────────────────
 * blockedDate: MySQL DATE column → stored as midnight UTC Date object
 *   e.g. 2026-03-18 → new Date("2026-03-18T00:00:00.000Z")
 *   When reading back: use .toISOString().substring(0,10) NOT toDateStringEastern()
 *
 * startTime / endTime: "HH:MM:SS" strings in Eastern timezone
 *   e.g. "09:00:00" = 9 AM Eastern
 */
import ical, { VEvent } from "node-ical";
import pkg from "rrule";
const { rrulestr } = pkg;
import { getDb } from "./db";
import { icalSyncSettings, blockedTimes } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const SYNC_DAYS_AHEAD = 90;
const ICAL_BLOCK_PREFIX = "[iCal]";
const COACH_TIMEZONE = "America/New_York";

// ── Timezone helpers ──────────────────────────────────────────────────────────

/** Format a Date as "HH:MM:SS" in Eastern timezone. Works regardless of server TZ. */
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

/** Format a Date as "YYYY-MM-DD" in Eastern timezone. */
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
 * Get the Eastern timezone offset in milliseconds for a given Date.
 * Returns a negative number (e.g. -14400000 for EDT = UTC-4, -18000000 for EST = UTC-5).
 *
 * Method: format the same instant in UTC and Eastern, parse both as UTC strings,
 * subtract to get the offset. This is server-TZ-independent.
 */
function getEasternOffsetMs(date: Date): number {
  const fmt = (tz: string) =>
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    }).format(date);

  // Format as "MM/DD/YYYY, HH:MM:SS" then parse
  const parseFormatted = (s: string): number => {
    // "03/19/2026, 15:30:00" → parse as UTC
    const [datePart, timePart] = s.split(", ");
    const [mo, d, y] = datePart.split("/");
    return new Date(`${y}-${mo}-${d}T${timePart}Z`).getTime();
  };

  const utcMs = parseFormatted(fmt("UTC"));
  const etMs = parseFormatted(fmt(COACH_TIMEZONE));
  return etMs - utcMs; // e.g. -14400000 for UTC-4
}

/**
 * Convert a "floating" rrule occurrence Date to a real UTC Date.
 *
 * rrule generates occurrences where the UTC components equal the Eastern wall-clock time.
 * e.g. floating = 2026-03-19T15:30:00.000Z means "3:30 PM Eastern on March 19"
 *
 * To get real UTC: realUTC = floating - easternOffset
 * e.g. 15:30Z - (-4h) = 19:30Z = 3:30 PM Eastern ✓
 */
function floatingToRealUTC(floating: Date): Date {
  const offset = getEasternOffsetMs(floating);
  return new Date(floating.getTime() - offset);
}

/** Create a Date at midnight UTC for a YYYY-MM-DD string (for MySQL DATE columns). */
function dateStringToMidnightUTC(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00.000Z");
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
        // Clamp to day boundaries (midnight Eastern = start of day)
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

    // Delete existing iCal blocks in the window
    // IMPORTANT: blockedDate is stored as midnight UTC, so use .toISOString().substring(0,10)
    // NOT toDateStringEastern() which would shift midnight UTC back one day in Eastern
    const existingBlocks = await db.select().from(blockedTimes);
    const icalBlockIds = existingBlocks
      .filter((b) => {
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

    let blocksCreated = 0;
    let totalOccurrences = 0;

    // Floating window boundaries for rrule.between()
    // rrule compares against floating dates, so we need floating boundaries too
    const easternOffsetNow = getEasternOffsetMs(now);
    const easternOffsetCutoff = getEasternOffsetMs(cutoff);
    const floatingNow = new Date(now.getTime() + easternOffsetNow);
    const floatingCutoff = new Date(cutoff.getTime() + easternOffsetCutoff);

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

          // Build floating dtstart: UTC components = Eastern wall-clock of originalStart
          const easternOffset = getEasternOffsetMs(originalStart);
          const floatingDtstart = new Date(originalStart.getTime() + easternOffset);

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
            // Convert floating occurrence to real UTC
            const occStart = floatingToRealUTC(floatingOcc);
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
      if (start > cutoff || end < now) continue;

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
