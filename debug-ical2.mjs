import ical from 'node-ical';

const url = 'https://calendar.google.com/calendar/ical/ritennismario%40gmail.com/private-7529b1aa2fffb4b80f78b682908ac757/basic.ics';

try {
  const events = await ical.async.fromURL(url);
  const vevents = Object.values(events).filter(e => e.type === 'VEVENT');
  console.log('Total VEVENTs:', vevents.length);

  const now = new Date();
  const cutoff = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  console.log('Now:', now.toISOString());
  console.log('Cutoff (90 days):', cutoff.toISOString());

  // Non-recurring events in window
  const upcoming = vevents.filter(e => {
    if (!e.start || !e.end) return false;
    return !e.rrule && e.start <= cutoff && e.end >= now;
  });
  console.log('\nNon-recurring events in next 90 days:', upcoming.length);
  upcoming.forEach((e, i) => {
    console.log(`  ${i+1}. "${e.summary}" | ${e.start} → ${e.end} | datetype: ${e.datetype}`);
  });

  // Recurring events
  const recurring = vevents.filter(e => e.rrule);
  console.log('\nTotal recurring events:', recurring.length);

  // Try to expand recurring events using rrule
  let expandedCount = 0;
  for (const e of recurring) {
    try {
      const rruleStr = typeof e.rrule === 'string' ? e.rrule : e.rrule?.toString();
      // Check if rrule has an UNTIL or COUNT that puts it in the future
      if (rruleStr && (rruleStr.includes('2026') || rruleStr.includes('2027') || !rruleStr.includes('UNTIL'))) {
        console.log(`  Recurring: "${e.summary}" | start: ${e.start} | rrule: ${rruleStr?.substring(0, 80)}`);
        expandedCount++;
        if (expandedCount >= 10) { console.log('  ... (showing first 10)'); break; }
      }
    } catch(err) {
      // skip
    }
  }

  // Check what the 14 blocks that were created correspond to
  // Look at events around March 19
  const march19 = new Date('2026-03-19T00:00:00');
  const march20 = new Date('2026-03-20T00:00:00');
  const march19Events = vevents.filter(e => {
    if (!e.start) return false;
    return e.start >= march19 && e.start < march20;
  });
  console.log('\nEvents on March 19:', march19Events.length);
  march19Events.forEach(e => {
    console.log(`  "${e.summary}" | ${e.start} → ${e.end} | rrule: ${!!e.rrule}`);
  });

  // Check ALL events in March 2026
  const march1 = new Date('2026-03-01T00:00:00');
  const april1 = new Date('2026-04-01T00:00:00');
  const marchEvents = vevents.filter(e => {
    if (!e.start) return false;
    return e.start >= march1 && e.start < april1;
  });
  console.log('\nAll events in March 2026:', marchEvents.length);
  marchEvents.forEach(e => {
    console.log(`  "${e.summary}" | ${e.start} → ${e.end} | rrule: ${!!e.rrule} | datetype: ${e.datetype}`);
  });

} catch (err) {
  console.error('Error:', err.message);
}
