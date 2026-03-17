import ical from 'node-ical';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute('SELECT icalUrl FROM ical_sync_settings LIMIT 1');
await conn.end();

let url = rows[0].icalUrl;
if (url.startsWith('webcal://')) url = 'https://' + url.slice(9);

console.log('Fetching:', url.substring(0, 60) + '...');
const events = await ical.async.fromURL(url);

const COACH_TZ = 'America/New_York';

function toEasternDate(d) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: COACH_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).format(d);
}

// Helper: get Eastern offset in ms
function getEasternOffsetMs(date) {
  const fmt = (tz) => new Intl.DateTimeFormat('en-US', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(date);
  const parseFormatted = (s) => {
    const [datePart, timePart] = s.split(', ');
    const [mo, d, y] = datePart.split('/');
    return new Date(`${y}-${mo}-${d}T${timePart}Z`).getTime();
  };
  return parseFormatted(fmt(COACH_TZ)) - parseFormatted(fmt('UTC'));
}

import rrulePkg from 'rrule';
const { rrulestr } = rrulePkg;

async function checkRecurring(summary, ev) {
  if (!ev.rrule) return;
  const originalStart = ev.start;
  const easternOffset = getEasternOffsetMs(originalStart);
  const floatingDtstart = new Date(originalStart.getTime() + easternOffset);
  console.log('  floatingDtstart:', floatingDtstart.toISOString(), '(UTC components = Eastern wall-clock)');
  
  const rruleString = ev.rrule.toString?.() || ev.rrule;
  const rruleOnly = rruleString.replace(/^DTSTART[^\n]*\n?/m, '').trim();
  const rule = rrulestr(rruleOnly || rruleString, { dtstart: floatingDtstart });
  
  // Get March 2026 occurrences
  const from = new Date('2026-03-17T00:00:00Z');
  const to = new Date('2026-03-28T00:00:00Z');
  const fromFloating = new Date(from.getTime() + getEasternOffsetMs(from));
  const toFloating = new Date(to.getTime() + getEasternOffsetMs(to));
  const occs = rule.between(fromFloating, toFloating, true);
  
  console.log('  Occurrences (floating):', occs.map(d => d.toISOString()));
  for (const floatingOcc of occs) {
    const realUTC = new Date(floatingOcc.getTime() - getEasternOffsetMs(floatingOcc));
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: COACH_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(realUTC);
    const y = parts.find(p=>p.type==='year')?.value;
    const mo = parts.find(p=>p.type==='month')?.value;
    const d = parts.find(p=>p.type==='day')?.value;
    const h = parts.find(p=>p.type==='hour')?.value;
    const m = parts.find(p=>p.type==='minute')?.value;
    console.log(`  realUTC: ${realUTC.toISOString()} → Eastern: ${y}-${mo}-${d} ${h}:${m}`);
  }
}

// Find Audrey and Katie and Carol events
for (const [key, ev] of Object.entries(events)) {
  if (!ev || ev.type !== 'VEVENT') continue;
  const summary = ev.summary || '';
  
  if (summary.includes('Carol') || summary.includes('carol')) {
    console.log('\n=== CAROL EVENT ===');
    console.log('Summary:', summary);
    console.log('datetype:', ev.datetype);
    console.log('start (raw UTC):', ev.start?.toISOString?.());
    console.log('end (raw UTC):', ev.end?.toISOString?.());
    console.log('start Eastern:', ev.start ? toEasternDate(ev.start) : 'N/A');
    console.log('rrule:', ev.rrule ? (ev.rrule.toString?.() || 'yes') : 'none');
    if (ev.rrule) await checkRecurring(summary, ev);
  }
  
  if (summary.includes('Audrey') || summary.includes('audrey')) {
    console.log('\n=== AUDREY EVENT ===');
    console.log('Summary:', summary);
    console.log('datetype:', ev.datetype);
    console.log('start (raw UTC):', ev.start?.toISOString?.());
    console.log('end (raw UTC):', ev.end?.toISOString?.());
    console.log('start Eastern:', ev.start ? toEasternDate(ev.start) : 'N/A');
    console.log('end Eastern:', ev.end ? toEasternDate(ev.end) : 'N/A');
    console.log('rrule:', ev.rrule ? (ev.rrule.toString?.() || JSON.stringify(ev.rrule)) : 'none');
    if (ev.rrule) await checkRecurring(summary, ev);
    
    // Check what toDateStringEastern gives
    if (ev.start) {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: COACH_TZ,
        year: 'numeric', month: '2-digit', day: '2-digit',
      }).formatToParts(ev.start);
      const y = parts.find(p => p.type === 'year')?.value;
      const mo = parts.find(p => p.type === 'month')?.value;
      const d = parts.find(p => p.type === 'day')?.value;
      console.log('toDateStringEastern result:', `${y}-${mo}-${d}`);
    }
  }
}
