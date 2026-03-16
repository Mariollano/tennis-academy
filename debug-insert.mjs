/**
 * Simulates exactly what insertBlocksForOccurrence does for the 105 clinic on Wed March 18
 * to find out what date/time values get stored in the database.
 */

const COACH_TIMEZONE = "America/New_York";

function toTimeString(date) {
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

function toDateString(date) {
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

// 105 clinic on Wed March 18: 9:00 AM - 10:30 AM Eastern = 13:00 - 14:30 UTC
const startDate = new Date('2026-03-18T13:00:00.000Z');
const endDate = new Date('2026-03-18T14:30:00.000Z');
const isAllDay = false;

console.log('=== Simulating insertBlocksForOccurrence ===');
console.log(`startDate: ${startDate.toISOString()} (UTC)`);
console.log(`endDate:   ${endDate.toISOString()} (UTC)`);
console.log(`startDate local: ${startDate.toString()}`);
console.log(`endDate local:   ${endDate.toString()}`);
console.log();

const now = new Date('2026-03-16T00:00:00Z');
const cutoff = new Date('2026-06-14T00:00:00Z');
const windowStart = toDateString(now);
const windowEnd = toDateString(cutoff);

console.log(`windowStart: ${windowStart}`);
console.log(`windowEnd: ${windowEnd}`);
console.log();

// Simulate the loop
const current = new Date(startDate);
current.setHours(0, 0, 0, 0);  // ← This is the key line!

console.log(`After setHours(0,0,0,0): ${current.toISOString()} (UTC)`);
console.log(`After setHours(0,0,0,0) local: ${current.toString()}`);
console.log(`toDateString(current): ${toDateString(current)}`);
console.log();

// The while loop body
const dateStr = toDateString(current);
console.log(`dateStr: ${dateStr}`);
console.log(`In window? ${dateStr >= windowStart && dateStr <= windowEnd}`);
console.log();

if (!isAllDay) {
  const nextDay = new Date(current);
  nextDay.setDate(nextDay.getDate() + 1);
  
  const dayStartDt = current.getTime() > startDate.getTime() ? new Date(current) : startDate;
  const dayEndDt = endDate < nextDay ? endDate : nextDay;
  
  console.log(`current.getTime(): ${current.getTime()}`);
  console.log(`startDate.getTime(): ${startDate.getTime()}`);
  console.log(`current > startDate? ${current.getTime() > startDate.getTime()}`);
  console.log(`dayStartDt: ${dayStartDt.toISOString()} (UTC)`);
  console.log(`dayEndDt: ${dayEndDt.toISOString()} (UTC)`);
  console.log();
  
  const dayStart = toTimeString(dayStartDt);
  const dayEnd = toTimeString(dayEndDt);
  
  console.log(`dayStart (stored): ${dayStart}`);
  console.log(`dayEnd (stored): ${dayEnd}`);
  console.log();
  
  const blockDate = new Date(current);
  console.log(`blockDate stored: ${blockDate.toISOString()} (UTC)`);
  console.log(`blockDate local: ${blockDate.toString()}`);
  console.log(`toDateString(blockDate): ${toDateString(blockDate)}`);
}

console.log();
console.log('=== KEY ISSUE ANALYSIS ===');
console.log(`current after setHours(0,0,0,0): ${current.toISOString()}`);
console.log(`This is midnight LOCAL time = ${current.getHours()}:00 local`);
console.log(`In UTC this is: ${current.getUTCHours()}:00 UTC`);
console.log();
console.log('When MySQL stores this as a DATE column:');
console.log(`  If stored as UTC date: ${current.toISOString().substring(0, 10)}`);
console.log(`  If stored as local date: ${current.toLocaleDateString('en-CA')}`);
console.log();
console.log('When the booking page queries for March 18:');
console.log('  It likely queries WHERE blockedDate = "2026-03-18"');
console.log(`  The stored value is: ${current.toISOString().substring(0, 10)}`);
