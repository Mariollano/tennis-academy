/**
 * Announcements broadcast system
 * Mario can post announcements (rain cancellations, schedule changes, etc.)
 * All registered students are notified via in-app, email, and/or SMS.
 */
import { getDb } from "./db";
import { announcements, announcementReads, users } from "../drizzle/schema";
import { eq, and, isNull, not, inArray, sql } from "drizzle-orm";
import { sendEmail } from "./email";
import { sendSms } from "./sms";

export type AnnouncementType = "info" | "cancellation" | "rain_cancellation" | "schedule_change" | "urgent" | "event";

const TYPE_LABELS: Record<AnnouncementType, string> = {
  info: "📢 Info",
  cancellation: "🚫 Cancellation",
  rain_cancellation: "🌧️ Rain Cancellation",
  schedule_change: "📅 Schedule Change",
  urgent: "🚨 Urgent",
  event: "🎾 Event",
};

const TYPE_COLORS: Record<AnnouncementType, string> = {
  info: "#2563eb",
  cancellation: "#dc2626",
  rain_cancellation: "#0369a1",
  schedule_change: "#d97706",
  urgent: "#dc2626",
  event: "#16a34a",
};

/**
 * Post a new announcement and broadcast it to all students.
 * Returns the created announcement id and delivery stats.
 */
export async function postAnnouncement(params: {
  title: string;
  body: string;
  type: AnnouncementType;
  sendEmail: boolean;
  sendSms: boolean;
  targetProgram?: string | null;
  createdBy: number;
}): Promise<{ id: number; emailsSent: number; smsSent: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Insert the announcement
  const [result] = await db.insert(announcements).values({
    title: params.title,
    body: params.body,
    type: params.type,
    sendEmail: params.sendEmail,
    sendSms: params.sendSms,
    targetProgram: params.targetProgram || null,
    createdBy: params.createdBy,
    emailsSent: 0,
    smsSent: 0,
  });

  const announcementId = (result as any).insertId as number;

  // Fetch all active students to notify
  const allStudents = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      smsOptIn: users.smsOptIn,
    })
    .from(users)
    .where(eq(users.role, "user"));

  let emailsSent = 0;
  let smsSent = 0;

  const typeLabel = TYPE_LABELS[params.type];
  const typeColor = TYPE_COLORS[params.type];

  // Broadcast email
  if (params.sendEmail) {
    for (const student of allStudents) {
      if (!student.email) continue;
      try {
        await sendEmail({
          to: student.email,
          toName: student.name || "Student",
          subject: `${typeLabel}: ${params.title} | RI Tennis Academy`,
          text: `${typeLabel}: ${params.title}\n\n${params.body}\n\n— Coach Mario Llano & RI Tennis Academy`,
          html: buildAnnouncementEmailHtml({
            studentName: student.name || "Student",
            title: params.title,
            body: params.body,
            type: params.type,
            typeLabel,
            typeColor,
          }),
        });
        emailsSent++;
      } catch (err) {
        console.warn(`[Announcement] Failed to email ${student.email}:`, err);
      }
    }
  }

  // Broadcast SMS
  if (params.sendSms) {
    for (const student of allStudents) {
      if (!student.phone || !student.smsOptIn) continue;
      try {
        const smsBody = `RI Tennis Academy — ${typeLabel}: ${params.title}\n\n${params.body}\n\nReply STOP to unsubscribe.`;
        await sendSms(student.phone, smsBody);
        smsSent++;
      } catch (err) {
        console.warn(`[Announcement] Failed to SMS ${student.phone}:`, err);
      }
    }
  }

  // Update delivery stats
  await db
    .update(announcements)
    .set({ emailsSent, smsSent })
    .where(eq(announcements.id, announcementId));

  console.log(`[Announcement] #${announcementId} "${params.title}" — ${emailsSent} emails, ${smsSent} SMS sent`);

  return { id: announcementId, emailsSent, smsSent };
}

/**
 * Get all announcements (newest first), with read status for a given user.
 */
export async function getAnnouncements(userId?: number) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select()
    .from(announcements)
    .orderBy(sql`${announcements.createdAt} DESC`)
    .limit(50);

  if (!userId) return rows.map((a) => ({ ...a, isRead: false }));

  // Get read announcement IDs for this user
  const reads = await db
    .select({ announcementId: announcementReads.announcementId })
    .from(announcementReads)
    .where(eq(announcementReads.userId, userId));

  const readIds = new Set(reads.map((r) => r.announcementId));

  return rows.map((a) => ({ ...a, isRead: readIds.has(a.id) }));
}

/**
 * Mark an announcement as read for a user.
 */
export async function markAnnouncementRead(announcementId: number, userId: number) {
  const db = await getDb();
  if (!db) return;

  // Check if already read
  const existing = await db
    .select({ id: announcementReads.id })
    .from(announcementReads)
    .where(
      and(
        eq(announcementReads.announcementId, announcementId),
        eq(announcementReads.userId, userId)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    await db.insert(announcementReads).values({ announcementId, userId });
  }
}

/**
 * Get unread announcement count for a user.
 */
export async function getUnreadCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const total = await db
    .select({ count: sql<number>`count(*)` })
    .from(announcements);

  const read = await db
    .select({ count: sql<number>`count(*)` })
    .from(announcementReads)
    .where(eq(announcementReads.userId, userId));

  const totalCount = Number(total[0]?.count ?? 0);
  const readCount = Number(read[0]?.count ?? 0);
  return Math.max(0, totalCount - readCount);
}

/**
 * Delete an announcement (admin only).
 */
export async function deleteAnnouncement(id: number) {
  const db = await getDb();
  if (!db) return;
  // Delete reads first
  await db.delete(announcementReads).where(eq(announcementReads.announcementId, id));
  await db.delete(announcements).where(eq(announcements.id, id));
}

// ─── Email template ───────────────────────────────────────────────────────────

function buildAnnouncementEmailHtml(params: {
  studentName: string;
  title: string;
  body: string;
  type: AnnouncementType;
  typeLabel: string;
  typeColor: string;
}): string {
  const bodyHtml = params.body.replace(/\n/g, "<br>");
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:${params.typeColor};padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0;color:rgba(255,255,255,0.85);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">RI Tennis Academy</p>
                  <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:700;line-height:1.3;">${params.title}</h1>
                </td>
                <td align="right" style="vertical-align:top;">
                  <span style="background:rgba(255,255,255,0.2);color:#fff;font-size:12px;font-weight:600;padding:4px 10px;border-radius:20px;white-space:nowrap;">${params.typeLabel}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hi ${params.studentName},</p>
            <p style="margin:0 0 24px;color:#374151;font-size:16px;line-height:1.6;">${bodyHtml}</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
            <p style="margin:0;color:#6b7280;font-size:13px;">
              — Coach Mario Llano &amp; RI Tennis Academy<br>
              <a href="https://tennispromario.com" style="color:#2563eb;text-decoration:none;">tennispromario.com</a>
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
              You're receiving this because you're enrolled at RI Tennis Academy.<br>
              To manage your notifications, visit your <a href="https://tennispromario.com/profile" style="color:#6b7280;">profile settings</a>.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
