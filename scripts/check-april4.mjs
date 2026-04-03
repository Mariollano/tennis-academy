import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

console.log('=== BLOCKED TIMES for April 4, 2026 (Saturday) ===');
const [blocks] = await conn.execute(
  `SELECT * FROM blocked_times WHERE DATE(start_datetime) = '2026-04-04' ORDER BY start_datetime`
);
if (blocks.length === 0) {
  console.log('  (none)');
} else {
  blocks.forEach(b => console.log(`  `, JSON.stringify(b)));
}

console.log('\n=== BOOKINGS for April 4, 2026 (Saturday) ===');
const [bookings] = await conn.execute(
  `SELECT * FROM bookings WHERE DATE(booking_date) = '2026-04-04' ORDER BY booking_date`
);
if (bookings.length === 0) {
  console.log('  (none)');
} else {
  bookings.forEach(b => console.log(`  `, JSON.stringify(b)));
}

console.log('\n=== BLOCKED TIMES for April 3-5 (Fri/Sat/Sun) ===');
const [nearby] = await conn.execute(
  `SELECT * FROM blocked_times WHERE DATE(start_datetime) BETWEEN '2026-04-03' AND '2026-04-05' ORDER BY start_datetime`
);
if (nearby.length === 0) {
  console.log('  (none)');
} else {
  nearby.forEach(b => console.log(`  `, JSON.stringify(b)));
}

console.log('\n=== ICAL SYNC SETTINGS ===');
const [icalSettings] = await conn.execute(`SELECT * FROM ical_sync_settings`);
icalSettings.forEach(s => console.log(`  `, JSON.stringify(s)));

console.log('\n=== SCHEDULE SLOTS for April 4 ===');
const [slots] = await conn.execute(
  `SELECT * FROM schedule_slots WHERE DATE(slot_date) = '2026-04-04' ORDER BY slot_date`
);
if (slots.length === 0) {
  console.log('  (none)');
} else {
  slots.forEach(s => console.log(`  `, JSON.stringify(s)));
}

await conn.end();
