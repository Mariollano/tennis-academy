/**
 * Seed script: add 105 Clinic EVENING sessions for today through December 31, 2026
 * Days: Monday(1), Wednesday(3), Friday(5)
 * Cap: 12 spots (same as morning weekday sessions)
 * Time: 6:30 PM – 8:00 PM
 *
 * This script ADDS sessions — it does NOT delete existing morning sessions.
 * Uses UTC date arithmetic to avoid timezone day-shift bugs.
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

// Evening session config
const EVENING_DAYS = new Set([1, 3, 5]); // Mon=1, Wed=3, Fri=5
const EVENING_CAP = 12;
const START_TIME = "18:30:00";
const END_TIME = "20:00:00";

// Start from today, go through December 31, 2026
const now = new Date();
const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
const endTs = Date.UTC(2026, 11, 31); // December 31, 2026

const toInsert = [];
const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

let cur = todayUTC;
while (cur <= endTs) {
  const d = new Date(cur);
  const dow = d.getUTCDay();

  if (EVENING_DAYS.has(dow)) {
    const slotDate = d.toISOString().slice(0, 10);
    const month = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
    const day = d.getUTCDate();
    const year = d.getUTCFullYear();
    const dateStr = `${month} ${day}, ${year}`;
    toInsert.push([programId, `105 Clinic Evening – ${dayNames[dow]} ${dateStr}`, slotDate, START_TIME, END_TIME, EVENING_CAP]);
  }

  cur += 24 * 60 * 60 * 1000;
}

console.log(`Preparing to insert ${toInsert.length} evening sessions...`);

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
console.log(`Done! Total 105 Clinic sessions in DB (all time slots): ${final[0].cnt}`);

// Verify first 10 evening sessions
const [sample] = await connection.execute(
  "SELECT slotDate, startTime, endTime FROM schedule_slots WHERE programId = ? AND startTime = '18:30:00' ORDER BY slotDate LIMIT 10",
  [programId]
);
const dayNamesShort = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
console.log("First 10 evening sessions:");
sample.forEach(r => {
  const d = new Date(r.slotDate);
  const dow = d.getUTCDay();
  console.log(`  ${r.slotDate.toString().slice(0,10)} → ${dayNamesShort[dow]}  ${r.startTime}–${r.endTime}`);
});

await connection.end();
