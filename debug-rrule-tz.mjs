import ical from 'node-ical';
import pkg from 'rrule';
const { rrulestr } = pkg;

const URL = 'https://calendar.google.com/calendar/ical/ritennismario%40gmail.com/private-7529b1aa2fffb4b80f78b682908ac757/basic.ics';

console.log('Fetching calendar...');
const events = await ical.async.fromURL(URL);

const now = new Date('2026-03-16T00:00:00Z');
const cutoff = new Date('2026-03-23T23:59:59Z');

// Timezone helper
function toEasternTime(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(date);
  const get = (type) => parts.find(p => p.type === type)?.value ?? '??';
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')} ET`;
}

let count = 0;
for (const component of Object.values(events)) {
  if (!component || component.type !== 'VEVENT') continue;
  const summary = component.summary || '(no title)';
  
  if (component.rrule) {
    try {
      const rruleObj = component.rrule;
      let rule;
      if (typeof rruleObj === 'string') {
        rule = rrulestr(rruleObj, { dtstart: component.start });
      } else {
        rule = rrulestr(rruleObj.toString(), { dtstart: component.start });
      }
      
      const occurrences = rule.between(now, cutoff, true);
      for (const occ of occurrences) {
        count++;
        console.log(`"${summary}"`);
        console.log(`  Raw UTC:    ${occ.toISOString()}`);
        console.log(`  Eastern:    ${toEasternTime(occ)}`);
        console.log(`  UTC hours:  ${occ.getUTCHours()}:${String(occ.getUTCMinutes()).padStart(2,'0')}`);
        console.log(`  Local hrs:  ${occ.getHours()}:${String(occ.getMinutes()).padStart(2,'0')} (server local)`);
        console.log();
      }
    } catch(e) {
      // skip
    }
  }
}
console.log(`Total: ${count} occurrences`);
