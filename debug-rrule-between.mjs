import ical from 'node-ical';
import pkg from 'rrule';
const { rrulestr } = pkg;

const ICAL_URL = "https://calendar.google.com/calendar/ical/ritennismario%40gmail.com/private-7529b1aa2fffb4b80f78b682908ac757/basic.ics";

const now = new Date(); // current time
const cutoff = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

console.log('Sync window: now =', now.toISOString(), 'cutoff =', cutoff.toISOString());

const events = await ical.fromURL(ICAL_URL);

// Check specific events
const targetTitles = ['105', 'JUNIOR PROGRAM', 'Audrey and Katie', 'Shaun and Alex', 'Carol'];

for (const [, event] of Object.entries(events)) {
  if (event.type !== 'VEVENT') continue;
  const title = event.summary || 'Untitled';
  if (!targetTitles.some(t => title.includes(t))) continue;
  if (!event.rrule) continue;

  const rruleString = event.rrule.toString();
  const occurrences = rrulestr(rruleString, { dtstart: event.start }).between(now, cutoff, true);
  
  // Filter to March 27
  const mar27 = occurrences.filter(d => {
    const eastern = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(d);
    return eastern.includes('03/27/2026');
  });

  console.log(`"${title}": total occurrences in window = ${occurrences.length}, on Mar 27 = ${mar27.length}`);
  if (mar27.length > 0) {
    mar27.forEach(d => console.log(`  -> ${d.toISOString()}`));
  }
  // Show first 3 occurrences
  console.log(`  First 3: ${occurrences.slice(0, 3).map(d => d.toISOString()).join(', ')}`);
}
