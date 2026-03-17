import ical from '/home/ubuntu/tennis-academy/node_modules/node-ical/index.js';
import { DateTime } from '/home/ubuntu/tennis-academy/node_modules/luxon/src/luxon.js';
import { readFileSync } from 'fs';

const envContent = readFileSync('/home/ubuntu/tennis-academy/.env', 'utf8');
const urlMatch = envContent.match(/ICAL_URL=(.+)/);
// Get from DB instead
import mysql from '/home/ubuntu/tennis-academy/node_modules/mysql2/promise/index.js';
const dbUrl = envContent.match(/DATABASE_URL=(.+)/)?.[1];
const conn = await mysql.createConnection(dbUrl);
const [rows] = await conn.query('SELECT ical_url FROM ical_sync_settings LIMIT 1');
await conn.end();

let icalUrl = rows[0]?.ical_url;
if (!icalUrl) { console.log('No iCal URL found'); process.exit(1); }
if (icalUrl.startsWith('webcal://')) icalUrl = 'https://' + icalUrl.slice(9);

console.log('Fetching iCal...');
const rawEvents = await ical.async.fromURL(icalUrl);

const COACH_TZ = 'America/New_York';
const now = new Date('2026-03-17T15:16:00.000Z'); // simulate 11:16 AM Eastern
const cutoff = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

let mar17Events = [];

for (const component of Object.values(rawEvents)) {
  if (!component || component.type !== 'VEVENT') continue;
  const event = component;
  const summary = event.summary || '(no title)';
  
  if (event.rrule) {
    const originalStart = event.start;
    const originalTz = originalStart.tz || COACH_TZ;
    const originalDt = DateTime.fromJSDate(originalStart, { zone: originalTz });
    
    const floatingDtstart = new Date(Date.UTC(
      originalDt.year, originalDt.month - 1, originalDt.day,
      originalDt.hour, originalDt.minute, originalDt.second
    ));
    
    const nowDt = DateTime.fromJSDate(now, { zone: originalTz });
    const cutoffDt = DateTime.fromJSDate(cutoff, { zone: originalTz });
    const floatingNow = new Date(Date.UTC(nowDt.year, nowDt.month - 1, nowDt.day, nowDt.hour, nowDt.minute, nowDt.second));
    const floatingCutoff = new Date(Date.UTC(cutoffDt.year, cutoffDt.month - 1, cutoffDt.day, cutoffDt.hour, cutoffDt.minute, cutoffDt.second));
    
    const rule = event.rrule;
    rule.options.dtstart = floatingDtstart;
    const occurrences = rule.between(floatingNow, floatingCutoff, true);
    
    for (const occ of occurrences) {
      const occDt = DateTime.fromJSDate(occ, { zone: 'UTC' }).setZone(originalTz).set({
        hour: originalDt.hour, minute: originalDt.minute, second: 0, millisecond: 0
      });
      const dateStr = occDt.toISODate();
      if (dateStr === '2026-03-17') {
        mar17Events.push({ title: summary, type: 'recurring', time: occDt.toFormat('HH:mm'), tz: originalTz });
      }
    }
  } else {
    // Single event
    const startDt = DateTime.fromJSDate(event.start, { zone: (event.start).tz || COACH_TZ });
    const dateStr = startDt.toISODate();
    if (dateStr === '2026-03-17') {
      mar17Events.push({ title: summary, type: 'single', time: startDt.toFormat('HH:mm'), tz: (event.start).tz || 'UTC' });
    }
  }
}

console.log('\nEvents found for March 17:');
if (mar17Events.length === 0) console.log('  NONE');
mar17Events.forEach(e => console.log(`  [${e.type}] ${e.title} at ${e.time} (${e.tz})`));
