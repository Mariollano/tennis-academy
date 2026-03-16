/**
 * Test timezone behavior in tsx/TypeScript environment
 * Run with: npx tsx debug-tz-tsx.ts
 */

const COACH_TIMEZONE = "America/New_York";

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

// 105 clinic on Wed March 18: 9:00 AM Eastern = 13:00 UTC
const testDate = new Date('2026-03-18T13:00:00.000Z');

console.log('Test date (UTC):', testDate.toISOString());
console.log('Test date (local):', testDate.toString());
console.log('toTimeString result:', toTimeString(testDate));
console.log('Expected: 09:00:00');
console.log('');

// Also test the Intl.DateTimeFormat directly
const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: COACH_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
console.log('Intl.DateTimeFormat format result:', formatter.format(testDate));

const parts = formatter.formatToParts(testDate);
console.log('formatToParts:', JSON.stringify(parts));

// Check what timezone the process thinks it's in
console.log('');
console.log('process.env.TZ:', process.env.TZ);
console.log('Server local time:', new Date().toString());
console.log('Server UTC time:', new Date().toISOString());
