import ical from 'node-ical';

const url = 'https://calendar.google.com/calendar/ical/riddle54321%40gmail.com/private-94abe0aa7793111320ec21ee411e8620/basic.ics';

try {
  const events = await ical.async.fromURL(url);
  const vevents = Object.values(events).filter(e => e.type === 'VEVENT');
  console.log('Total VEVENTs:', vevents.length);

  // Show first 3 events
  vevents.slice(0, 3).forEach((e, i) => {
    console.log(`Event ${i+1}: "${e.summary}" | start: ${e.start} | datetype: ${e.datetype} | rrule: ${!!e.rrule}`);
  });

  // Check events in next 90 days
  const now = new Date();
  const cutoff = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  console.log('\nNow:', now.toISOString());
  console.log('Cutoff (90 days):', cutoff.toISOString());

  const upcoming = vevents.filter(e => {
    const start = e.start;
    const end = e.end;
    if (!start || !end) return false;
    return start <= cutoff && end >= now;
  });
  console.log('\nEvents in next 90 days (non-recurring):', upcoming.length);
  upcoming.slice(0, 10).forEach((e, i) => {
    console.log(`  Upcoming ${i+1}: "${e.summary}" | start: ${e.start} | end: ${e.end} | datetype: ${e.datetype}`);
  });

  // Check recurring events
  const recurring = vevents.filter(e => e.rrule);
  console.log('\nRecurring events total:', recurring.length);
  recurring.slice(0, 3).forEach((e, i) => {
    console.log(`  Recurring ${i+1}: "${e.summary}" | rrule: ${e.rrule}`);
  });

} catch (err) {
  console.error('Error:', err.message);
}
