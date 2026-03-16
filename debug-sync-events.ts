/**
 * Debug script: fetch the iCal and log ALL events found, showing why each is included or skipped
 */
import ical, { VEvent } from "node-ical";
import pkg from "rrule";
const { rrulestr } = pkg;
import { getDb } from "./server/db";
import { icalSyncSettings } from "./drizzle/schema";

const SYNC_DAYS_AHEAD = 90;
const COACH_TIMEZONE = "America/New_York";

function toDateStringEastern(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: COACH_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const y = parts.find(p => p.type === "year")?.value ?? "2000";
  const mo = parts.find(p => p.type === "month")?.value ?? "01";
  const d = parts.find(p => p.type === "day")?.value ?? "01";
  return `${y}-${mo}-${d}`;
}

const db = await getDb();
const settings = await db!.select().from(icalSyncSettings).limit(1);
if (!settings.length || !settings[0].isEnabled) { console.log("Sync not configured"); process.exit(1); }

let icalUrl = settings[0].icalUrl;
if (icalUrl.startsWith("webcal://")) icalUrl = "https://" + icalUrl.slice(9);
if (icalUrl.startsWith("webcals://")) icalUrl = "https://" + icalUrl.slice(10);

console.log("Fetching:", icalUrl.substring(0, 80) + "...");
const rawEvents = await ical.async.fromURL(icalUrl);

const now = new Date();
const cutoff = new Date(now.getTime() + SYNC_DAYS_AHEAD * 24 * 60 * 60 * 1000);
const windowStart = toDateStringEastern(now);
const windowEnd = toDateStringEastern(cutoff);

console.log(`\nWindow: ${windowStart} → ${windowEnd}\n`);

let eventCount = 0;
let skippedNoDate = 0;
let skippedOutOfWindow = 0;
let recurring = 0;
let single = 0;

for (const component of Object.values(rawEvents)) {
  if (!component || component.type !== "VEVENT") continue;
  eventCount++;
  const event = component as VEvent;
  const summary = (event.summary as string) || "(no title)";
  const color = (event as any).color || (event as any)["X-APPLE-CALENDAR-COLOR"] || (event as any).categories || "none";
  const start = event.start as Date;
  const end = event.end as Date;

  if (!start || !end) {
    skippedNoDate++;
    console.log(`  SKIP (no date): "${summary}"`);
    continue;
  }

  const startStr = toDateStringEastern(start);
  const endStr = toDateStringEastern(end);

  if (event.rrule) {
    recurring++;
    try {
      const rruleObj = event.rrule as any;
      const rruleString = typeof rruleObj === "string" ? rruleObj : rruleObj.toString();
      const rule = rrulestr(rruleString, { dtstart: start });
      const occurrences: Date[] = rule.between(now, cutoff, true);
      console.log(`  RECURRING (${occurrences.length} occurrences in window): "${summary}" | color=${JSON.stringify(color)}`);
    } catch (e: any) {
      console.log(`  RECURRING (rrule error: ${e.message}): "${summary}"`);
    }
    continue;
  }

  // Single event
  if (start > cutoff || end < now) {
    skippedOutOfWindow++;
    console.log(`  SKIP (out of window ${startStr}→${endStr}): "${summary}"`);
    continue;
  }

  single++;
  console.log(`  SINGLE (${startStr}→${endStr}): "${summary}" | color=${JSON.stringify(color)}`);
}

console.log(`\nSummary: ${eventCount} VEVENTs total`);
console.log(`  Recurring: ${recurring}`);
console.log(`  Single (in window): ${single}`);
console.log(`  Skipped (no date): ${skippedNoDate}`);
console.log(`  Skipped (out of window): ${skippedOutOfWindow}`);
