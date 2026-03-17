import ical from 'node-ical';
import pkg from 'rrule';
const { rrulestr } = pkg;

const ICAL_URL = "https://calendar.google.com/calendar/ical/ritennismario%40gmail.com/private-7529b1aa2fffb4b80f78b682908ac757/basic.ics";
const COACH_TZ = "America/New_York";

function toTimeString(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: COACH_TZ, hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(date);
  const h = parts.find(p => p.type === 'hour')?.value ?? '00';
  const m = parts.find(p => p.type === 'minute')?.value ?? '00';
  return `${h}:${m}:00`;
}

function toDateStringEastern(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: COACH_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const y = parts.find(p => p.type === 'year')?.value;
  const mo = parts.find(p => p.type === 'month')?.value;
  const d = parts.find(p => p.type === 'day')?.value;
  return `${y}-${mo}-${d}`;
}

const events = await ical.fromURL(ICAL_URL);
const now = new Date();
const cutoff = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

for (const [, event] of Object.entries(events)) {
  if (event.type !== 'VEVENT') continue;
  const title = (event.summary || '').toLowerCase();
  if (!title.includes('junior')) continue;
  if (!event.rrule) continue;
  
  const rruleStr = event.rrule.toString();
  const occurrences = rrulestr(rruleStr, { dtstart: event.start }).between(now, cutoff, true);
  
  console.log(`\nEvent: "${event.summary}" | start: ${event.start?.toISOString()}`);
  console.log(`  rrule: ${rruleStr.split('\n')[0]}`);
  console.log(`  Total occurrences in window: ${occurrences.length}`);
  occurrences.slice(0, 5).forEach(d => {
    console.log(`  ${d.toISOString()} -> Eastern date: ${toDateStringEastern(d)}, time: ${toTimeString(d)}`);
  });
}
