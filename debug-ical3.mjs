import ical from 'node-ical';
import pkg from 'rrule';
const { RRule, RRuleSet, rrulestr } = pkg;

const url = 'https://calendar.google.com/calendar/ical/ritennismario%40gmail.com/private-7529b1aa2fffb4b80f78b682908ac757/basic.ics';
const events = await ical.async.fromURL(url);
const vevents = Object.values(events).filter(e => e.type === 'VEVENT' && e.rrule);

const now = new Date();
const cutoff = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

console.log('Now:', now.toISOString());
console.log('Cutoff:', cutoff.toISOString());
console.log('Total recurring events:', vevents.length);

let expandedCount = 0;
let totalOccurrences = 0;

for (const e of vevents) {
  try {
    const rruleObj = e.rrule;
    if (!rruleObj) continue;
    
    // node-ical stores the rrule as a string in rrule property for some events
    let rule;
    if (typeof rruleObj === 'string') {
      rule = rrulestr(rruleObj, { dtstart: e.start });
    } else if (rruleObj._rrule) {
      // It's a node-ical RRule object - get the string representation
      const rruleString = rruleObj.toString();
      rule = rrulestr(rruleString, { dtstart: e.start });
    } else {
      continue;
    }
    
    const occurrences = rule.between(now, cutoff, true);
    if (occurrences.length > 0) {
      console.log(`\n"${e.summary}": ${occurrences.length} occurrences`);
      occurrences.slice(0, 3).forEach(d => console.log('  -', d.toISOString()));
      expandedCount++;
      totalOccurrences += occurrences.length;
    }
  } catch(err) {
    // skip silently
  }
}

console.log(`\n=== Summary ===`);
console.log(`Recurring events with future occurrences: ${expandedCount}`);
console.log(`Total future occurrences: ${totalOccurrences}`);
