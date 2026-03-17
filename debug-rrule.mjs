import ical from '/home/ubuntu/tennis-academy/node_modules/node-ical/node-ical.js';
import { DateTime } from '/home/ubuntu/tennis-academy/node_modules/luxon/src/luxon.js';
import pkg from '/home/ubuntu/tennis-academy/node_modules/rrule/dist/esm/index.js';
const { rrulestr } = pkg;

const ICAL_URL = 'https://calendar.google.com/calendar/ical/ritennismario%40gmail.com/private-7529b1aa2fffb4b80f78b682908ac757/basic.ics';
const COACH_TZ = 'America/New_York';

const events = await ical.async.fromURL(ICAL_URL);

const targets = ['Audrey', 'Carol', 'Junior program', 'JUNIOR PROGRAM'];

for (const e of Object.values(events)) {
  if (e.type !== 'VEVENT') continue;
  const summary = e.summary || '';
  if (!targets.some(t => summary.includes(t))) continue;
  if (!e.rrule) continue;

  const origDt = DateTime.fromJSDate(e.start, { zone: e.start.tz || COACH_TZ });
  const floatingDtstart = new Date(Date.UTC(
    origDt.year, origDt.month - 1, origDt.day,
    origDt.hour, origDt.minute, origDt.second
  ));

  const rruleStr = e.rrule.toString().replace(/^DTSTART[^\n]*\n?/m, '').trim();
  const rule = rrulestr(rruleStr, { dtstart: floatingDtstart });

  // Floating window: March 17-25, 2026 in Eastern
  const nowDt = DateTime.fromISO('2026-03-17T10:00:00', { zone: COACH_TZ });
  const endDt = DateTime.fromISO('2026-03-25T23:59:59', { zone: COACH_TZ });
  const floatingNow = new Date(Date.UTC(nowDt.year, nowDt.month-1, nowDt.day, nowDt.hour, nowDt.minute));
  const floatingEnd = new Date(Date.UTC(endDt.year, endDt.month-1, endDt.day, endDt.hour, endDt.minute));

  const occs = rule.between(floatingNow, floatingEnd, true);

  console.log(`\n=== ${summary} ===`);
  console.log(`  original start: ${e.start.toISOString()} tz=${e.start.tz}`);
  console.log(`  origDt Eastern: ${origDt.toISO()} (${origDt.weekdayLong})`);
  console.log(`  floatingDtstart: ${floatingDtstart.toISOString()} (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][floatingDtstart.getUTCDay()]})`);
  console.log(`  rrule: ${rruleStr}`);
  console.log(`  occurrences (floating):`);
  for (const occ of occs) {
    const day = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][occ.getUTCDay()];
    // Apply Luxon fix
    const floatingDt = DateTime.fromJSDate(occ, { zone: 'UTC' });
    const realDt = floatingDt.setZone(e.start.tz || COACH_TZ).set({
      hour: origDt.hour, minute: origDt.minute, second: 0, millisecond: 0
    });
    console.log(`    floating=${occ.toISOString()} (${day}) → real=${realDt.toJSDate().toISOString()} Eastern=${realDt.toISO()} (${realDt.weekdayLong})`);
  }
}
