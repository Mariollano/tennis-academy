/**
 * Seed script: generate 105 Clinic sessions for March and April 2026
 * Days: Sunday(0), Monday(1), Wednesday(3), Friday(5)
 * Weekday cap: 12 spots | Sunday cap: 24 spots
 * Time: 9:00 AM – 10:30 AM
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

// Generate dates from March 1 to April 30, 2026
const CLINIC_DAYS = new Set([0, 1, 3, 5]); // Sun, Mon, Wed, Fri
const WEEKDAY_CAP = 12;
const SUNDAY_CAP = 24;
const START_TIME = "09:00:00";
const END_TIME = "10:30:00";

const start = new Date("2026-03-01");
const end = new Date("2026-04-30");

const toInsert = [];
const cur = new Date(start);
while (cur <= end) {
  const dow = cur.getDay();
  if (CLINIC_DAYS.has(dow)) {
    const isSunday = dow === 0;
    const cap = isSunday ? SUNDAY_CAP : WEEKDAY_CAP;
    const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const dateStr = cur.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const slotDate = cur.toISOString().slice(0, 10);
    toInsert.push([programId, `105 Clinic – ${dayNames[dow]} ${dateStr}`, slotDate, START_TIME, END_TIME, cap]);
  }
  cur.setDate(cur.getDate() + 1);
}

console.log(`Preparing to insert ${toInsert.length} sessions...`);

// Check which dates already exist to avoid duplicates
const [existing] = await connection.execute(
  "SELECT slotDate FROM schedule_slots WHERE programId = ?",
  [programId]
);
const existingDates = new Set(existing.map(r => {
  const d = r.slotDate;
  if (typeof d === "string") return d.slice(0, 10);
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}));
console.log(`Found ${existingDates.size} existing sessions, skipping duplicates...`);

const newSessions = toInsert.filter(([, , date]) => !existingDates.has(date));
console.log(`Inserting ${newSessions.length} new sessions...`);

if (newSessions.length > 0) {
  await connection.query(
    `INSERT INTO schedule_slots (programId, title, slotDate, startTime, endTime, maxParticipants, currentParticipants, isAvailable)
     VALUES ?`,
    [newSessions.map(([pid, title, date, start, end, cap]) => [pid, title, date, start, end, cap, 0, 1])]
  );
}

const [final] = await connection.execute(
  "SELECT COUNT(*) as cnt FROM schedule_slots WHERE programId = ?",
  [programId]
);
console.log(`Done! Total 105 Clinic sessions in DB: ${final[0].cnt}`);
await connection.end();
