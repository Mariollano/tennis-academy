import ical from 'node-ical';
import pkg from 'rrule';
const { rrulestr } = pkg;

const ICAL_URL = "https://calendar.google.com/calendar/ical/ritennismario%40gmail.com/private-7529b1aa2fffb4b80f78b682908ac757/basic.ics";

const windowStart = new Date('2026-03-27T00:00:00.000Z');
const windowEnd   = new Date('2026-03-28T00:00:00.000Z');

function toEastern(d) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  }).format(d);
}

const events = await ical.fromURL(ICAL_URL);
let found = 0;

for (const [, event] of Object.entries(events)) {
  if (event.type !== 'VEVENT') continue;
  const title = event.summary || 'Untitled';

  if (event.rrule) {
    const rruleString = event.rrule.toString();
    const occurrences = rrulestr(rruleString, { dtstart: event.start }).between(
      new Date('2026-03-26T12:00:00.000Z'), // noon UTC March 26 = 8 AM Eastern March 26
      new Date('2026-03-28T12:00:00.000Z'), // noon UTC March 28
      true
    );
    for (const occ of occurrences) {
      // Check if this occurrence falls on March 27 Eastern
      const easternDate = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric', month: '2-digit', day: '2-digit'
      }).format(occ);
      if (easternDate.includes('03/27/2026')) {
        const duration = event.end ? (event.end - event.start) : 0;
        const endOcc = new Date(occ.getTime() + duration);
        console.log(`RECURRING: "${title}" | UTC: ${occ.toISOString()} | Eastern: ${toEastern(occ)} - ${toEastern(endOcc)}`);
        found++;
      }
    }
  } else {
    const start = event.start;
    if (!start) continue;
    const easternDate = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(start);
    if (easternDate.includes('03/27/2026')) {
      console.log(`SINGLE: "${title}" | UTC: ${start.toISOString()} | Eastern: ${toEastern(start)}`);
      found++;
    }
  }
}

console.log(`\nTotal events on March 27 Eastern: ${found}`);
