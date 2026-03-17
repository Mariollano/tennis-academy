import ical, { VEvent } from "node-ical";
import { DateTime } from "luxon";
import { getDb } from "./server/db";
import { icalSyncSettings } from "./drizzle/schema";

const COACH_TZ = "America/New_York";

async function main() {
  const db = await getDb();
  if (!db) { console.log("No DB"); return; }

  const settings = await db.select().from(icalSyncSettings).limit(1);
  if (!settings.length) { console.log("No iCal settings"); return; }

  let icalUrl = settings[0].icalUrl;
  if (icalUrl.startsWith("webcal://")) icalUrl = "https://" + icalUrl.slice(9);

  console.log("Fetching iCal...");
  const rawEvents = await ical.async.fromURL(icalUrl);

  // Simulate sync running at 11:16 AM Eastern on March 17
  const now = new Date("2026-03-17T15:16:00.000Z");
  const cutoff = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const mar17Events: Array<{title: string, type: string, time: string, tz: string, excluded?: string}> = [];

  for (const component of Object.values(rawEvents)) {
    if (!component || component.type !== "VEVENT") continue;
    const event = component as VEvent;
    const summary = (event.summary as string) || "(no title)";

    if (event.rrule) {
      const originalStart = event.start as Date;
      const originalTz: string = (originalStart as any).tz || COACH_TZ;
      const originalDt = DateTime.fromJSDate(originalStart, { zone: originalTz });

      const floatingDtstart = new Date(Date.UTC(
        originalDt.year, originalDt.month - 1, originalDt.day,
        originalDt.hour, originalDt.minute, originalDt.second
      ));

      const nowDt = DateTime.fromJSDate(now, { zone: originalTz });
      const cutoffDt = DateTime.fromJSDate(cutoff, { zone: originalTz });
      const floatingNow = new Date(Date.UTC(nowDt.year, nowDt.month - 1, nowDt.day, nowDt.hour, nowDt.minute, nowDt.second));
      const floatingCutoff = new Date(Date.UTC(cutoffDt.year, cutoffDt.month - 1, cutoffDt.day, cutoffDt.hour, cutoffDt.minute, cutoffDt.second));

      const rule = event.rrule as any;
      rule.options.dtstart = floatingDtstart;
      const occurrences = rule.between(floatingNow, floatingCutoff, true);

      for (const occ of occurrences) {
        const occDt = DateTime.fromJSDate(occ, { zone: "UTC" })
          .setZone(originalTz)
          .set({ hour: originalDt.hour, minute: originalDt.minute, second: 0, millisecond: 0 });
        const dateStr = occDt.toISODate();
        if (dateStr === "2026-03-17") {
          mar17Events.push({ title: summary, type: "recurring", time: occDt.toFormat("HH:mm"), tz: originalTz });
        }
      }

      // Also check with floatingNow = start of day (to see what we're missing)
      const floatingStartOfDay = new Date(Date.UTC(nowDt.year, nowDt.month - 1, nowDt.day, 0, 0, 0));
      const occurrencesFullDay = rule.between(floatingStartOfDay, floatingCutoff, true);
      for (const occ of occurrencesFullDay) {
        const occDt = DateTime.fromJSDate(occ, { zone: "UTC" })
          .setZone(originalTz)
          .set({ hour: originalDt.hour, minute: originalDt.minute, second: 0, millisecond: 0 });
        const dateStr = occDt.toISODate();
        if (dateStr === "2026-03-17") {
          const alreadyFound = mar17Events.some(e => e.title === summary && e.time === occDt.toFormat("HH:mm"));
          if (!alreadyFound) {
            mar17Events.push({ title: summary, type: "recurring-MISSED", time: occDt.toFormat("HH:mm"), tz: originalTz, excluded: "excluded by floatingNow time filter" });
          }
        }
      }
    } else {
      // Single event
      const startDt = DateTime.fromJSDate(event.start as Date, { zone: (event.start as any).tz || COACH_TZ });
      const dateStr = startDt.toISODate();
      if (dateStr === "2026-03-17") {
        mar17Events.push({ title: summary, type: "single", time: startDt.toFormat("HH:mm"), tz: (event.start as any).tz || "UTC" });
      }
    }
  }

  console.log("\nEvents found for March 17:");
  if (mar17Events.length === 0) console.log("  NONE");
  mar17Events.forEach(e => console.log(`  [${e.type}] ${e.title} at ${e.time} (${e.tz}) ${e.excluded || ""}`));
}

main().catch(console.error);
