/**
 * Seed Junior Program schedule_slots for Mon–Fri, 3:30–6:30 PM
 * Run: node seed-junior-slots.mjs
 */
import { createConnection } from "mysql2/promise";
import * as dotenv from "dotenv";
import { readFileSync } from "fs";

// Load .env
try {
  const env = readFileSync(".env", "utf8");
  env.split("\n").forEach(line => {
    const [k, ...v] = line.split("=");
    if (k && v.length) process.env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
  });
} catch {}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not found in environment");
  process.exit(1);
}

// Parse mysql://user:pass@host:port/dbname
const url = new URL(DATABASE_URL);
const conn = await createConnection({
  host: url.hostname,
  port: parseInt(url.port || "3306"),
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false },
});

// Find junior_daily program
const [programs] = await conn.execute(
  "SELECT id, name, type FROM programs WHERE type IN ('junior_daily', 'junior_weekly') ORDER BY id"
);
console.log("Junior programs found:", programs);

if (!programs.length) {
  console.error("No junior programs found in DB!");
  await conn.end();
  process.exit(1);
}

// Use junior_daily for the daily slots
const juniorDailyProgram = programs.find(p => p.type === "junior_daily") || programs[0];
console.log(`Using program: id=${juniorDailyProgram.id} name="${juniorDailyProgram.name}"`);

// Generate Mon–Fri slots from today to 3 months out
const today = new Date();
today.setHours(0, 0, 0, 0);
const end = new Date(today);
end.setMonth(end.getMonth() + 3);

const slots = [];
const cur = new Date(today);
while (cur <= end) {
  const dow = cur.getDay(); // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri
  if (dow >= 1 && dow <= 5) {
    const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const dateStr = cur.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const slotDate = cur.toISOString().slice(0, 10); // YYYY-MM-DD
    slots.push({
      programId: juniorDailyProgram.id,
      title: `Junior Program – ${dayNames[dow]} ${dateStr}`,
      slotDate,
      startTime: "15:30:00",
      endTime: "18:30:00",
      maxParticipants: 20,
      isAvailable: 1,
      currentParticipants: 0,
    });
  }
  cur.setDate(cur.getDate() + 1);
}

console.log(`Generating ${slots.length} Junior Program slots (${today.toISOString().slice(0,10)} to ${end.toISOString().slice(0,10)})...`);

// Check for existing slots to avoid duplicates
const [existing] = await conn.execute(
  "SELECT slotDate FROM schedule_slots WHERE programId = ? AND slotDate >= ? AND slotDate <= ?",
  [juniorDailyProgram.id, today.toISOString().slice(0,10), end.toISOString().slice(0,10)]
);
const existingDates = new Set(existing.map(r => r.slotDate.toISOString().slice(0,10)));
console.log(`Found ${existingDates.size} existing slots, skipping those...`);

const toInsert = slots.filter(s => !existingDates.has(s.slotDate));
console.log(`Inserting ${toInsert.length} new slots...`);

let inserted = 0;
for (const slot of toInsert) {
  await conn.execute(
    "INSERT INTO schedule_slots (programId, title, slotDate, startTime, endTime, maxParticipants, isAvailable, currentParticipants, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
    [slot.programId, slot.title, slot.slotDate, slot.startTime, slot.endTime, slot.maxParticipants, slot.isAvailable, slot.currentParticipants]
  );
  inserted++;
}

console.log(`✅ Done! Inserted ${inserted} Junior Program slots.`);
await conn.end();
