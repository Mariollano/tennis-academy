import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Count total evening slots
const [total] = await conn.execute(
  "SELECT COUNT(*) as cnt FROM schedule_slots WHERE programId = 1 AND startTime = '18:30:00'"
);
console.log("Total 6:30 PM evening slots before fix:", total[0].cnt);

// Delete duplicates — keep only the row with the lowest id for each (slotDate, startTime)
const [del] = await conn.execute(`
  DELETE ss FROM schedule_slots ss
  INNER JOIN (
    SELECT MIN(id) as keep_id, slotDate, startTime
    FROM schedule_slots
    WHERE programId = 1 AND startTime = '18:30:00'
    GROUP BY slotDate, startTime
  ) keeper ON ss.slotDate = keeper.slotDate AND ss.startTime = keeper.startTime
  WHERE ss.programId = 1 AND ss.startTime = '18:30:00' AND ss.id != keeper.keep_id
`);
console.log("Deleted duplicate rows:", del.affectedRows);

const [after] = await conn.execute(
  "SELECT COUNT(*) as cnt FROM schedule_slots WHERE programId = 1 AND startTime = '18:30:00'"
);
console.log("Total 6:30 PM evening slots after fix:", after[0].cnt);

// Show first 5 to verify
const [sample] = await conn.execute(
  "SELECT id, slotDate, startTime, endTime FROM schedule_slots WHERE programId = 1 AND startTime = '18:30:00' ORDER BY slotDate LIMIT 5"
);
const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
console.log("First 5 evening sessions:");
sample.forEach(r => {
  const d = new Date(r.slotDate);
  console.log(`  ${r.slotDate.toString().slice(0,10)} (${days[d.getUTCDay()]}) ${r.startTime}–${r.endTime}`);
});

await conn.end();
