import ical from 'node-ical';
import pkg from 'rrule';
const { rrulestr } = pkg;

const ICAL_URL = 'https://calendar.google.com/calendar/ical/ritennismario%40gmail.com/private-7529b1aa2fffb4b80f78b682908ac757/basic.ics';

const COACH_TIMEZONE = 'America/New_York';

function toTimeString(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: COACH_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const h = parts.find(p => p.type === 'hour')?.value ?? '00';
  const m = parts.find(p => p.type === 'minute')?.value ?? '00';
  return `${h}:${m}:00`;
}

function toDateStringEastern(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: COACH_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const y = parts.find(p => p.type === 'year')?.value ?? '2000';
  const mo = parts.find(p => p.type === 'month')?.value ?? '01';
  const d = parts.find(p => p.type === 'day')?.value ?? '01';
  return `${y}-${mo}-${d}`;
}

console.log('Fetching calendar from Mario\'s Google Calendar...');
const rawEvents = await ical.async.fromURL(ICAL_URL);

const now = new Date();
const cutoff = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

let found = 0;
for (const component of Object.values(rawEvents)) {
  if (!component || component.type !== 'VEVENT') continue;
  const summary = component.summary || '';
  if (!summary.toUpperCase().includes('JUNIOR')) continue;
  
  found++;
  console.log('\n=== JUNIOR EVENT ===');
  console.log('Summary:', summary);
  console.log('Start (raw):', component.start);
  console.log('Start ISO:', component.start?.toISOString?.());
  console.log('End (raw):', component.end);
  console.log('End ISO:', component.end?.toISOString?.());
  console.log('datetype:', component.datetype);
  console.log('Has rrule:', !!component.rrule);
  
  if (component.rrule) {
    const rruleObj = component.rrule;
    let rule;
    if (typeof rruleObj === 'string') {
      rule = rrulestr(rruleObj, { dtstart: component.start });
    } else if (rruleObj.toString) {
      const rruleString = rruleObj.toString();
      console.log('rrule string:', rruleString);
      rule = rrulestr(rruleString, { dtstart: component.start });
    }
    
    if (rule) {
      const occurrences = rule.between(now, new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), true);
      console.log(`\nNext ${occurrences.length} occurrences (next 14 days):`);
      for (const occ of occurrences.slice(0, 5)) {
        const durationMs = component.end.getTime() - component.start.getTime();
        const occEnd = new Date(occ.getTime() + durationMs);
        console.log(`  Start UTC: ${occ.toISOString()} → Eastern date: ${toDateStringEastern(occ)}, time: ${toTimeString(occ)}`);
        console.log(`  End UTC:   ${occEnd.toISOString()} → Eastern date: ${toDateStringEastern(occEnd)}, time: ${toTimeString(occEnd)}`);
      }
    }
  }
  
  if (found >= 3) break;
}

if (found === 0) {
  console.log('No JUNIOR events found. Checking all recurring events...');
  let count = 0;
  for (const component of Object.values(rawEvents)) {
    if (!component || component.type !== 'VEVENT' || !component.rrule) continue;
    count++;
    if (count <= 5) {
      const summary = component.summary || '';
      console.log(`\nRecurring: "${summary}"`);
      console.log('  Start ISO:', component.start?.toISOString?.());
      console.log('  End ISO:', component.end?.toISOString?.());
      const rruleObj = component.rrule;
      if (rruleObj?.toString) console.log('  rrule:', rruleObj.toString().substring(0, 100));
      
      // Test occurrence expansion
      try {
        let rule;
        if (typeof rruleObj === 'string') {
          rule = rrulestr(rruleObj, { dtstart: component.start });
        } else if (rruleObj.toString) {
          rule = rrulestr(rruleObj.toString(), { dtstart: component.start });
        }
        if (rule) {
          const occs = rule.between(now, new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), true);
          if (occs.length > 0) {
            const occ = occs[0];
            const durationMs = component.end.getTime() - component.start.getTime();
            const occEnd = new Date(occ.getTime() + durationMs);
            console.log(`  First occ UTC: ${occ.toISOString()} → Eastern: ${toDateStringEastern(occ)} ${toTimeString(occ)}`);
            console.log(`  First occ end UTC: ${occEnd.toISOString()} → Eastern: ${toDateStringEastern(occEnd)} ${toTimeString(occEnd)}`);
          }
        }
      } catch(e) {
        console.log('  rrule error:', e.message);
      }
    }
  }
  console.log(`\nTotal recurring events: ${count}`);
}
