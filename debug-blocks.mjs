import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

const conn = await createConnection(process.env.DATABASE_URL);

const [rows] = await conn.execute(
  `SELECT id, title, blockedDate, startTime, endTime 
   FROM blocked_times 
   WHERE title LIKE '[iCal]%' 
   AND blockedDate BETWEEN '2026-03-16' AND '2026-03-25'
   ORDER BY blockedDate, startTime`
);

console.log(`Found ${rows.length} iCal blocks for Mar 16-25:`);
rows.forEach(r => {
  const d = new Date(r.blockedDate);
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const dayName = days[d.getUTCDay()];
  console.log(`  ${dayName} ${r.blockedDate.toISOString().slice(0,10)} | ${r.startTime} - ${r.endTime} | ${r.title}`);
});

await conn.end();
