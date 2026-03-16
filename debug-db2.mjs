// Debug script to check blocked_times for March 17-19
// Uses the same DATABASE_URL that the server uses (from process.env)

import { createConnection } from 'mysql2/promise';

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('DATABASE_URL not found in environment');
  process.exit(1);
}

console.log('Connecting to database...');
const conn = await createConnection(dbUrl);

const [rows] = await conn.execute(
  `SELECT id, title, blockedDate, startTime, endTime, isAllDay 
   FROM blocked_times 
   WHERE title LIKE '[iCal]%'
   ORDER BY blockedDate, startTime
   LIMIT 100`
);

console.log(`Found ${rows.length} iCal blocks:`);
for (const row of rows) {
  const d = row.blockedDate instanceof Date ? row.blockedDate.toISOString().substring(0, 10) : String(row.blockedDate).substring(0, 10);
  console.log(`  ${d} ${row.startTime || 'ALL DAY'} - ${row.endTime || ''} | ${row.title}`);
}

await conn.end();
