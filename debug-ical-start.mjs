/**
 * Debug: check what node-ical returns for event.start on recurring events
 * and trace exactly what toTimeString() produces
 */
import ical from "node-ical";
import pkg from "rrule";
const { rrulestr } = pkg;
import { createConnection } from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const COACH_TIMEZONE = "America/New_York";

function toTimeString(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: COACH_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const h = parts.find(p => p.type === "hour")?.value ?? "00";
  const m = parts.find(p => p.type === "minute")?.value ?? "00";
  return `${h}:${m}:00`;
}

function toDateStringEastern(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: COACH_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const y = parts.find(p => p.type === "year")?.value ?? "2000";
  const mo = parts.find(p => p.type === "month")?.value ?? "01";
  const d = parts.find(p => p.type === "day")?.value ?? "01";
  return `${y}-${mo}-${d}`;
}

// Get ical URL from DB
const url = new URL(process.env.DATABASE_URL);
const conn = await createConnection({
  host: url.hostname, port: parseInt(url.port || "3306"),
  user: url.username, password: url.password,
  database: url.pathname.slice(1), ssl: { rejectUnauthorized: false },
});
const [settings] = await conn.execute("SELECT icalUrl FROM ical_sync_settings LIMIT 1");
await conn.end();

let icalUrl = settings[0].icalUrl;
if (icalUrl.startsWith("webcal://")) icalUrl = "https://" + icalUrl.slice(9);

console.log("Fetching calendar...");
const rawEvents = await ical.async.fromURL(icalUrl);

const now = new Date();
const cutoff = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

let count = 0;
for (const component of Object.values(rawEvents)) {
  if (!component || component.type !== "VEVENT") continue;
  if (!component.rrule) continue;
  
  const summary = component.summary || "(no title)";
  const eventStart = component.start;
  const eventEnd = component.end;
  
  if (!eventStart || !eventEnd) continue;
  
  // Check if this is a relevant event (105 clinic or Junior program)
  const lc = summary.toLowerCase();
  if (!lc.includes("105") && !lc.includes("junior")) continue;
  
  count++;
  console.log(`\n=== "${summary}" ===`);
  console.log(`  event.start UTC:     ${eventStart.toISOString()}`);
  console.log(`  event.start Eastern: ${toDateStringEastern(eventStart)} ${toTimeString(eventStart)}`);
  console.log(`  event.start tz:      ${eventStart.tz || "(none)"}`);
  console.log(`  event.datetype:      ${component.datetype || "(none)"}`);
  
  // Expand rrule
  const rruleObj = component.rrule;
  let rruleString = typeof rruleObj === "string" ? rruleObj : rruleObj.toString();
  console.log(`  rrule string:        ${rruleString}`);
  
  try {
    const rule = rrulestr(rruleString, { dtstart: eventStart });
    const occurrences = rule.between(now, cutoff, true);
    console.log(`  Occurrences in window: ${occurrences.length}`);
    
    if (occurrences.length > 0) {
      const occ = occurrences[0];
      const durationMs = eventEnd.getTime() - eventStart.getTime();
      const occEnd = new Date(occ.getTime() + durationMs);
      
      console.log(`  First occurrence UTC:  ${occ.toISOString()}`);
      console.log(`  First occ Eastern:     ${toDateStringEastern(occ)} ${toTimeString(occ)}`);
      console.log(`  toTimeString(occStart): ${toTimeString(occ)}`);
      console.log(`  toTimeString(occEnd):   ${toTimeString(occEnd)}`);
      console.log(`  → Would store: startTime=${toTimeString(occ)}, endTime=${toTimeString(occEnd)}`);
    }
  } catch(e) {
    console.log(`  rrule error: ${e.message}`);
  }
}

if (count === 0) {
  console.log("No 105 or Junior recurring events found!");
}
