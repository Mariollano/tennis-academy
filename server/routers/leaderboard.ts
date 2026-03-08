/**
 * Leaderboard Router
 * Shows the most active players this month and all-time.
 * Creates friendly competition and social proof for new users.
 */
import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { bookings, users } from "../../drizzle/schema";
import { eq, desc, and, gte, sql, count } from "drizzle-orm";

// Badge tiers based on total confirmed sessions
function getBadge(sessions: number): { label: string; color: string; emoji: string } {
  if (sessions >= 50) return { label: "Grand Slam Champion", color: "#f59e0b", emoji: "🏆" };
  if (sessions >= 25) return { label: "Pro Circuit", color: "#6366f1", emoji: "⭐" };
  if (sessions >= 10) return { label: "Tournament Player", color: "#10b981", emoji: "🎾" };
  if (sessions >= 5) return { label: "Rising Star", color: "#3b82f6", emoji: "🌟" };
  return { label: "Beginner", color: "#6b7280", emoji: "🎯" };
}

export const leaderboardRouter = router({
  // ── Monthly leaderboard (most sessions this month) ───────────────────────
  monthly: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const rows = await db
      .select({
        userId: bookings.userId,
        name: users.name,
        sessionCount: count(bookings.id),
      })
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .where(
        and(
          eq(bookings.status, "confirmed"),
          gte(bookings.createdAt, startOfMonth)
        )
      )
      .groupBy(bookings.userId, users.name)
      .orderBy(desc(count(bookings.id)))
      .limit(10);

    return rows.map((r, i) => ({
      rank: i + 1,
      userId: r.userId,
      name: r.name ? r.name.split(" ")[0] + " " + (r.name.split(" ")[1]?.[0] || "") + "." : "Anonymous",
      sessionCount: Number(r.sessionCount),
      badge: getBadge(Number(r.sessionCount)),
    }));
  }),

  // ── All-time leaderboard ─────────────────────────────────────────────────
  allTime: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const rows = await db
      .select({
        userId: bookings.userId,
        name: users.name,
        sessionCount: count(bookings.id),
      })
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .where(eq(bookings.status, "confirmed"))
      .groupBy(bookings.userId, users.name)
      .orderBy(desc(count(bookings.id)))
      .limit(20);

    return rows.map((r, i) => ({
      rank: i + 1,
      userId: r.userId,
      name: r.name ? r.name.split(" ")[0] + " " + (r.name.split(" ")[1]?.[0] || "") + "." : "Anonymous",
      sessionCount: Number(r.sessionCount),
      badge: getBadge(Number(r.sessionCount)),
    }));
  }),

  // ── My rank ──────────────────────────────────────────────────────────────
  myRank: publicProcedure
    .input(z.object({ userId: z.number().optional() }))
    .query(async ({ input }) => {
      if (!input.userId) return null;
      const db = await getDb();
      if (!db) return null;

      // Get my total sessions
      const myRows = await db
        .select({ sessionCount: count(bookings.id) })
        .from(bookings)
        .where(and(eq(bookings.userId, input.userId), eq(bookings.status, "confirmed")));
      const myCount = Number(myRows[0]?.sessionCount ?? 0);

      // Count how many users have more sessions than me
      const aboveMe = await db
        .select({ cnt: sql<number>`count(distinct ${bookings.userId})` })
        .from(bookings)
        .where(eq(bookings.status, "confirmed"))
        .groupBy(bookings.userId)
        .having(sql`count(${bookings.id}) > ${myCount}`);

      const rank = aboveMe.length + 1;
      return { rank, sessionCount: myCount, badge: getBadge(myCount) };
    }),

  // ── Stats summary (for homepage) ─────────────────────────────────────────
  stats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { totalSessions: 0, totalStudents: 0, thisMonthSessions: 0 };

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [totalRows, monthRows, studentRows] = await Promise.all([
      db.select({ cnt: count(bookings.id) }).from(bookings).where(eq(bookings.status, "confirmed")),
      db.select({ cnt: count(bookings.id) }).from(bookings).where(and(eq(bookings.status, "confirmed"), gte(bookings.createdAt, startOfMonth))),
      db.select({ cnt: sql<number>`count(distinct ${bookings.userId})` }).from(bookings).where(eq(bookings.status, "confirmed")),
    ]);

    return {
      totalSessions: Number(totalRows[0]?.cnt ?? 0),
      totalStudents: Number(studentRows[0]?.cnt ?? 0),
      thisMonthSessions: Number(monthRows[0]?.cnt ?? 0),
    };
  }),
});
