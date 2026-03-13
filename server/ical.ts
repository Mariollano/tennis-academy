import { Request, Response } from "express";
import { getDb } from "./db";
import { bookings, users, programs } from "../drizzle/schema";
import { eq, ne } from "drizzle-orm";
import crypto from "crypto";

/**
 * Generate a stable private token for the iCal feed URL.
 * Derived from JWT_SECRET so it never changes unless the secret changes.
 */
export function getCalendarToken(): string {
  const secret = process.env.JWT_SECRET ?? "default-secret";
  return crypto.createHmac("sha256", secret).update("ical-feed-v1").digest("hex").slice(0, 32);
}

function escapeIcal(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function formatIcalDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
}

function parseTimeToMinutes(timeStr: string): number {
  // timeStr format: "HH:MM:SS" or "HH:MM"
  const parts = timeStr.split(":");
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

export async function handleIcalFeed(req: Request, res: Response) {
  const { token } = req.params;
  const expectedToken = getCalendarToken();

  if (token !== expectedToken) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const db = await getDb();
    if (!db) return res.status(500).send("Database unavailable");

    // Fetch all non-cancelled bookings with user and program info
    const rows = await db
      .select({
        booking: bookings,
        user: users,
        program: programs,
      })
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .leftJoin(programs, eq(bookings.programId, programs.id))
      .where(ne(bookings.status, "cancelled"))
      .orderBy(bookings.sessionDate);

    const now = new Date();
    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//RI Tennis Academy//TennisPro//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:RI Tennis Academy - Bookings",
      "X-WR-TIMEZONE:America/New_York",
      `DTSTAMP:${formatIcalDate(now)}`,
    ];

    for (const { booking, user, program } of rows) {
      if (!booking.sessionDate) continue;

      // Parse the session date (stored as YYYY-MM-DD string from MySQL date type)
      const dateStr = typeof booking.sessionDate === "string"
        ? booking.sessionDate
        : (booking.sessionDate as Date).toISOString().slice(0, 10);

      const [year, month, day] = dateStr.split("-").map(Number);

      let dtStart: string;
      let dtEnd: string;

      if (booking.sessionStartTime) {
        // Has specific time — create datetime event
        const startMins = parseTimeToMinutes(booking.sessionStartTime);
        const startHour = Math.floor(startMins / 60);
        const startMin = startMins % 60;

        let endHour = startHour + 1;
        let endMin = startMin;

        if (booking.sessionEndTime) {
          const endMins = parseTimeToMinutes(booking.sessionEndTime);
          endHour = Math.floor(endMins / 60);
          endMin = endMins % 60;
        }

        // Build as UTC — sessions are in EST (UTC-5), so add 5 hours
        const startUtc = new Date(Date.UTC(year, month - 1, day, startHour + 5, startMin, 0));
        const endUtc = new Date(Date.UTC(year, month - 1, day, endHour + 5, endMin, 0));
        dtStart = `DTSTART:${formatIcalDate(startUtc)}`;
        dtEnd = `DTEND:${formatIcalDate(endUtc)}`;
      } else {
        // All-day event
        const pad = (n: number) => String(n).padStart(2, "0");
        const dateOnly = `${year}${pad(month)}${pad(day)}`;
        dtStart = `DTSTART;VALUE=DATE:${dateOnly}`;
        // End date is next day for all-day events
        const nextDay = new Date(Date.UTC(year, month - 1, day + 1));
        const np = (n: number) => String(n).padStart(2, "0");
        dtEnd = `DTEND;VALUE=DATE:${nextDay.getUTCFullYear()}${np(nextDay.getUTCMonth() + 1)}${np(nextDay.getUTCDate())}`;
      }

      const studentName = user?.name || "Guest";
      const studentEmail = user?.email || "";
      const programName = program?.name || "Session";
      const paymentStatus = booking.paidAt || booking.paymentMethod === "card"
        ? "PAID"
        : booking.paymentMethod === "cash"
        ? "CASH DUE"
        : booking.paymentMethod === "check"
        ? "CHECK DUE"
        : "PENDING";

      const amountDollars = ((booking.totalAmountCents || 0) / 100).toFixed(2);
      const summary = `${programName} — ${studentName}`;
      const description = [
        `Student: ${studentName}`,
        studentEmail ? `Email: ${studentEmail}` : "",
        user?.phone ? `Phone: ${user.phone}` : "",
        `Program: ${programName}`,
        `Amount: $${amountDollars}`,
        `Payment: ${paymentStatus}`,
        booking.notes ? `Notes: ${booking.notes}` : "",
        `Status: ${booking.status}`,
      ]
        .filter(Boolean)
        .join("\\n");

      const uid = `booking-${booking.id}@tennispromario.com`;
      const dtstamp = formatIcalDate(booking.createdAt ? new Date(booking.createdAt) : now);

      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${dtstamp}`);
      lines.push(dtStart);
      lines.push(dtEnd);
      lines.push(`SUMMARY:${escapeIcal(summary)}`);
      lines.push(`DESCRIPTION:${escapeIcal(description)}`);
      if (studentEmail) lines.push(`ATTENDEE;CN=${escapeIcal(studentName)}:mailto:${studentEmail}`);
      lines.push(`STATUS:${booking.status === "confirmed" ? "CONFIRMED" : "TENTATIVE"}`);
      lines.push("END:VEVENT");
    }

    lines.push("END:VCALENDAR");

    const icsContent = lines.join("\r\n");

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", "inline; filename=ri-tennis-academy.ics");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.send(icsContent);
  } catch (err) {
    console.error("[iCal] Error generating feed:", err);
    res.status(500).send("Error generating calendar feed");
  }
}
