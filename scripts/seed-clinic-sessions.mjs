/**
 * Seed script: generate 105 Clinic sessions for April through September 2026
 * Days: Sunday(0), Monday(1), Wednesday(3), Friday(5)
 * Weekday cap: 12 spots | Sunday cap: 24 spots
 * Time: 9:00 AM – 10:30 AM
 *
 * NOTE: Uses UTC date arithmetic to avoid timezone day-shift bugs.
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);

// Get the clinic_105 program id
const [programs] = await connection.execute("SELECT id, name, type FROM programs WHERE type = 'clinic_105' LIMIT 1");
if (!programs.length) {
  console.error("No clinic_105 program found in database");
  process.exit(1);
}
const programId = programs[0].id;
console.log(`Found 105 Clinic program: id=${programId}, name="${programs[0].name}"`);

// Delete all existing sessions for this program first
const [del] = await connection.execute("DELETE FROM schedule_slots WHERE programId = ?", [programId]);
console.log(`Deleted ${del.affectedRows} existing sessions`);

// Generate dates from April 1 to September 30, 2026
// Use UTC day-of-week to avoid timezone shifts
const CLINIC_DAYS = new Set([0, 1, 3, 5]); // Sun=0, Mon=1, Wed=3, Fri=5
const WEEKDAY_CAP = 12;
const SUNDAY_CAP = 24;
const START_TIME = "09:00:00";
const END_TIME = "10:30:00";

// Build dates using UTC to avoid local timezone day-shift
const startYear = 2026, startMonth = 3, startDay = 1; // April 1 (month is 0-indexed)
const endYear = 2026, endMonth = 8, endDay = 30;       // September 30

const toInsert = [];

// Iterate day by day using UTC timestamps
let cur = Date.UTC(startYear, startMonth, startDay); // April 1, 2026 UTC
const endTs = Date.UTC(endYear, endMonth, endDay);

while (cur <= endTs) {
  const d = new Date(cur);
  const dow = d.getUTCDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat

  if (CLINIC_DAYS.has(dow)) {
    const isSunday = dow === 0;
    const cap = isSunday ? SUNDAY_CAP : WEEKDAY_CAP;
    const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    // Format date as YYYY-MM-DD in UTC
    const slotDate = d.toISOString().slice(0, 10);
    const month = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
    const day = d.getUTCDate();
    const year = d.getUTCFullYear();
    const dateStr = `${month} ${day}, ${year}`;
    toInsert.push([programId, `105 Clinic – ${dayNames[dow]} ${dateStr}`, slotDate, START_TIME, END_TIME, cap]);
  }

  cur += 24 * 60 * 60 * 1000; // advance one day in ms
}

console.log(`Preparing to insert ${toInsert.length} sessions...`);

if (toInsert.length > 0) {
  await connection.query(
    `INSERT INTO schedule_slots (programId, title, slotDate, startTime, endTime, maxParticipants, currentParticipants, isAvailable)
     VALUES ?`,
    [toInsert.map(([pid, title, date, start, end, cap]) => [pid, title, date, start, end, cap, 0, 1])]
  );
}

const [final] = await connection.execute(
  "SELECT COUNT(*) as cnt FROM schedule_slots WHERE programId = ?",
  [programId]
);
console.log(`Done! Total 105 Clinic sessions in DB: ${final[0].cnt}`);

// Verify first 10 sessions
const [sample] = await connection.execute(
  "SELECT slotDate FROM schedule_slots WHERE programId = ? ORDER BY slotDate LIMIT 10",
  [programId]
);
const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
sample.forEach(r => {
  const d = new Date(r.slotDate);
  const dow = d.getUTCDay();
  console.log(`  ${r.slotDate.toString().slice(0,10)} → ${dayNames[dow]}`);
});

await connection.end();
