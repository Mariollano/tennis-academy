/**
 * Full sync simulation - mimics exactly what syncIcalCalendar() does
 * Run with: npx tsx debug-full-sync.ts
 */
import ical, { VEvent } from "node-ical";
import pkg from "rrule";
const { rrulestr } = (pkg as any);

const COACH_TIMEZONE = "America/New_York";
const SYNC_DAYS_AHEAD = 90;
const ICAL_BLOCK_PREFIX = "[iCal]";

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

const URL = 'https://calendar.google.com/calendar/ical/ritennismario%40gmail.com/private-7529b1aa2fffb4b80f78b682908ac757/basic.ics';

console.log('Fetching calendar...');
const rawEvents = await ical.async.fromURL(URL);

const now = new Date();
const cutoff = new Date(now.getTime() + SYNC_DAYS_AHEAD * 24 * 60 * 60 * 1000);
const windowStart = toDateString(now);
const windowEnd = toDateString(cutoff);

console.log(`Window: ${windowStart} to ${windowEnd}`);
console.log();

// Focus on March 18 events
const TARGET_DATE = '2026-03-18';
const results: Array<{title: string, date: string, start: string, end: string}> = [];

for (const component of Object.values(rawEvents)) {
  if (!component || component.type !== "VEVENT") continue;
  const event = component as VEvent;
  const summary = (event.summary as string) || "Personal Appointment";
  const isAllDay = (event as any).datetype === "date";

  if (event.rrule) {
    try {
      const rruleObj = event.rrule as any;
      let rule: any;
      if (typeof rruleObj === "string") {
        rule = rrulestr(rruleObj, { dtstart: event.start as Date });
      } else if (rruleObj.toString) {
        rule = rrulestr(rruleObj.toString(), { dtstart: event.start as Date });
      } else continue;

      const occurrences: Date[] = rule.between(now, cutoff, true);
      const originalStart = event.start as Date;
      const originalEnd = event.end as Date;
      const durationMs = originalEnd && originalStart
        ? originalEnd.getTime() - originalStart.getTime()
        : 60 * 60 * 1000;

      for (const occStart of occurrences) {
        const occEnd = new Date(occStart.getTime() + durationMs);
        
        // Simulate insertBlocksForOccurrence
        const adjustedEnd = isAllDay ? new Date(occEnd.getTime() - 1) : occEnd;
        const current = new Date(occStart);
        current.setHours(0, 0, 0, 0);
        
        while (current <= adjustedEnd) {
          const dateStr = toDateString(current);
          
          if (dateStr === TARGET_DATE) {
            let dayStart: string | null = null;
            let dayEnd: string | null = null;
            
            if (!isAllDay) {
              const nextDay = new Date(current);
              nextDay.setDate(nextDay.getDate() + 1);
              
              const dayStartDt = current.getTime() > occStart.getTime() ? new Date(current) : occStart;
              const dayEndDt = occEnd < nextDay ? occEnd : nextDay;
              
              dayStart = toTimeString(dayStartDt);
              dayEnd = toTimeString(dayEndDt);
            }
            
            results.push({
              title: `${ICAL_BLOCK_PREFIX} ${summary}`,
              date: dateStr,
              start: dayStart || 'ALL DAY',
              end: dayEnd || '',
            });
            
            console.log(`MATCH: "${summary}" on ${dateStr}`);
            console.log(`  occStart UTC: ${occStart.toISOString()}`);
            console.log(`  occStart local: ${occStart.toString()}`);
            console.log(`  current after setHours: ${current.toISOString()}`);
            console.log(`  dayStart: ${dayStart}`);
            console.log(`  dayEnd: ${dayEnd}`);
            console.log();
          }
          
          current.setDate(current.getDate() + 1);
        }
      }
    } catch (e) {
      // skip
    }
    continue;
  }

  // Single events
  const start = event.start as Date;
  const end = event.end as Date;
  if (!start || !end) continue;
  if (start > cutoff || end < now) continue;

  const adjustedEnd = isAllDay ? new Date(end.getTime() - 1) : end;
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);

  while (current <= adjustedEnd) {
    const dateStr = toDateString(current);
    if (dateStr === TARGET_DATE) {
      let dayStart: string | null = null;
      let dayEnd: string | null = null;
      
      if (!isAllDay) {
        const nextDay = new Date(current);
        nextDay.setDate(nextDay.getDate() + 1);
        const dayStartDt = current.getTime() > start.getTime() ? new Date(current) : start;
        const dayEndDt = end < nextDay ? end : nextDay;
        dayStart = toTimeString(dayStartDt);
        dayEnd = toTimeString(dayEndDt);
      }
      
      results.push({
        title: `${ICAL_BLOCK_PREFIX} ${summary}`,
        date: dateStr,
        start: dayStart || 'ALL DAY',
        end: dayEnd || '',
      });
      
      console.log(`MATCH (single): "${summary}" on ${dateStr}`);
      console.log(`  start UTC: ${start.toISOString()}`);
      console.log(`  dayStart: ${dayStart}`);
      console.log(`  dayEnd: ${dayEnd}`);
      console.log();
    }
    current.setDate(current.getDate() + 1);
  }
}

console.log(`\n=== Summary: ${results.length} blocks for ${TARGET_DATE} ===`);
for (const r of results) {
  console.log(`  ${r.start} - ${r.end} | ${r.title}`);
}
