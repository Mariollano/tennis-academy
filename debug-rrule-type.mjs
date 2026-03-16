/**
 * Debug: check what node-ical returns for event.rrule type and toString()
 */
import ical from "node-ical";
import { createConnection } from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const conn = await createConnection({
  host: new URL(process.env.DATABASE_URL).hostname,
  port: parseInt(new URL(process.env.DATABASE_URL).port || "3306"),
  user: new URL(process.env.DATABASE_URL).username,
  password: new URL(process.env.DATABASE_URL).password,
  database: new URL(process.env.DATABASE_URL).pathname.slice(1),
  ssl: { rejectUnauthorized: false },
});
const [settings] = await conn.execute("SELECT icalUrl FROM ical_sync_settings LIMIT 1");
await conn.end();

let icalUrl = settings[0].icalUrl;
if (icalUrl.startsWith("webcal://")) icalUrl = "https://" + icalUrl.slice(9);

console.log("Fetching calendar...");
const rawEvents = await ical.async.fromURL(icalUrl);

let found = 0;
for (const component of Object.values(rawEvents)) {
  if (!component || component.type !== "VEVENT") continue;
  if (!component.rrule) continue;
  const summary = String(component.summary || "");
  if (!summary.toLowerCase().includes("105")) continue;
  
  found++;
  const rruleObj = component.rrule;
  console.log("\n=== 105 clinic rrule ===");
  console.log("typeof rruleObj:", typeof rruleObj);
  console.log("constructor:", rruleObj?.constructor?.name);
  console.log("toString():", rruleObj.toString());
  console.log("event.start:", component.start?.toISOString());
  
  if (found >= 1) break;
}

if (found === 0) {
  console.log("No 105 recurring events found!");
}
