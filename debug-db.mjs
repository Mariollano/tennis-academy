// Debug script to check blocked_times for March 17-19
import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Read DATABASE_URL from environment
const envContent = readFileSync('/proc/1/environ', 'utf8').split('\0');
const dbUrl = envContent.find(e => e.startsWith('DATABASE_URL='))?.slice('DATABASE_URL='.length);

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
   LIMIT 50`
);

console.log(`Found ${rows.length} iCal blocks:`);
for (const row of rows) {
  const d = row.blockedDate instanceof Date ? row.blockedDate.toISOString().substring(0, 10) : row.blockedDate;
  console.log(`  ${d} ${row.startTime || 'ALL DAY'} - ${row.endTime || ''} | ${row.title}`);
}

await conn.end();
