import {
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  mediumtext,
  timestamp,
  varchar,
  date,
  time,
} from "drizzle-orm/mysql-core";

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  smsOptIn: boolean("smsOptIn").default(false).notNull(),
  smsOptInAt: timestamp("smsOptInAt"),
  newsletterOptIn: boolean("newsletterOptIn").default(false).notNull(),
  newsletterOptInAt: timestamp("newsletterOptInAt"),
  referralCode: varchar("referralCode", { length: 20 }).unique(), // auto-generated unique code per user
  referredBy: varchar("referredBy", { length: 20 }),              // referral code used at signup
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Programs ─────────────────────────────────────────────────────────────────
export const programs = mysqlTable("programs", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  type: mysqlEnum("type", [
    "private_lesson",
    "clinic_105",
    "junior_daily",
    "junior_weekly",
    "summer_camp_daily",
    "summer_camp_weekly",
    "after_camp",
    "mental_coaching",
    "tournament_attendance",
    "stringing",
    "merchandise",
  ]).notNull(),
  description: text("description"),
  priceInCents: int("priceInCents").notNull(),
  durationMinutes: int("durationMinutes"),
  startTime: time("startTime"),
  endTime: time("endTime"),
  season: mysqlEnum("season", ["fall", "spring", "summer", "year_round"]).default("year_round"),
  isActive: boolean("isActive").default(true).notNull(),
  maxParticipants: int("maxParticipants"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Program = typeof programs.$inferSelect;
export type InsertProgram = typeof programs.$inferInsert;

// ─── Schedule Slots ───────────────────────────────────────────────────────────
export const scheduleSlots = mysqlTable("schedule_slots", {
  id: int("id").autoincrement().primaryKey(),
  programId: int("programId").notNull(),
  // Human-readable label, e.g. "105 Clinic – Monday Jan 6"
  title: varchar("title", { length: 300 }),
  slotDate: date("slotDate").notNull(),
  startTime: time("startTime").notNull(),
  endTime: time("endTime").notNull(),
  // Admin-set capacity for this specific slot (overrides program default)
  maxParticipants: int("maxParticipants").default(12).notNull(),
  // Derived from confirmed/pending bookings; updated on each booking change
  currentParticipants: int("currentParticipants").default(0).notNull(),
  isAvailable: boolean("isAvailable").default(true).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScheduleSlot = typeof scheduleSlots.$inferSelect;
export type InsertScheduleSlot = typeof scheduleSlots.$inferInsert;

// ─── Bookings ─────────────────────────────────────────────────────────────────
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  programId: int("programId").notNull(),
  scheduleSlotId: int("scheduleSlotId"),
  status: mysqlEnum("status", ["pending", "confirmed", "cancelled", "completed"]).default("pending").notNull(),
  bookingDate: timestamp("bookingDate").defaultNow().notNull(),
  sessionDate: date("sessionDate"),
  sessionStartTime: time("sessionStartTime"),
  sessionEndTime: time("sessionEndTime"),
  // For summer camp weekly: track the week start date
  weekStartDate: date("weekStartDate"),
  // For tournament: number of students sharing the cost
  sharedStudentCount: int("sharedStudentCount").default(1),
  // For stringing: who provides the string
  stringProvidedBy: mysqlEnum("stringProvidedBy", ["academy", "customer"]),
  // For merchandise
  merchandiseSize: varchar("merchandiseSize", { length: 10 }),
  quantity: int("quantity").default(1),
  notes: text("notes"),
  coachNotes: text("coachNotes"), // Admin-only coaching notes per booking
  totalAmountCents: int("totalAmountCents").notNull(),
  paidAt: timestamp("paidAt"),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

// ─── Payments ─────────────────────────────────────────────────────────────────
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  userId: int("userId").notNull(),
  amountCents: int("amountCents").notNull(),
  currency: varchar("currency", { length: 3 }).default("usd").notNull(),
  status: mysqlEnum("status", ["pending", "succeeded", "failed", "refunded"]).default("pending").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  stripeChargeId: varchar("stripeChargeId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// ─── SMS Broadcasts ───────────────────────────────────────────────────────────
export const smsBroadcasts = mysqlTable("sms_broadcasts", {
  id: int("id").autoincrement().primaryKey(),
  sentBy: int("sentBy").notNull(), // admin user id
  message: text("message").notNull(),
  recipientCount: int("recipientCount").default(0).notNull(),
  status: mysqlEnum("status", ["draft", "sent", "failed"]).default("draft").notNull(),
  scheduledAt: timestamp("scheduledAt"),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SmsBroadcast = typeof smsBroadcasts.$inferSelect;
export type InsertSmsBroadcast = typeof smsBroadcasts.$inferInsert;

// ─── Mental Coaching Resources ────────────────────────────────────────────────
export const mentalCoachingResources = mysqlTable("mental_coaching_resources", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  content: text("content").notNull(),
  category: mysqlEnum("category", ["mindset", "focus", "pressure", "confidence", "routine", "general"]).default("general"),
  isPublished: boolean("isPublished").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MentalCoachingResource = typeof mentalCoachingResources.$inferSelect;

// ─── Merchandise ──────────────────────────────────────────────────────────────
export const merchandise = mysqlTable("merchandise", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  type: mysqlEnum("type", ["sweatshirt", "tshirt", "other"]).notNull(),
  priceInCents: int("priceInCents").notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  availableSizes: text("availableSizes"), // JSON array: ["S","M","L","XL"]
  stockCount: int("stockCount").default(0),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Merchandise = typeof merchandise.$inferSelect;

// ─── Tournament Bookings ──────────────────────────────────────────────────────
export const tournamentBookings = mysqlTable("tournament_bookings", {
  id: int("id").autoincrement().primaryKey(),
  tournamentName: varchar("tournamentName", { length: 300 }).notNull(),
  tournamentDate: date("tournamentDate").notNull(),
  location: text("location"),
  estimatedHours: decimal("estimatedHours", { precision: 4, scale: 1 }).notNull(),
  travelHours: decimal("travelHours", { precision: 4, scale: 1 }).default("0"),
  estimatedExpenses: int("estimatedExpensesCents").default(0),
  status: mysqlEnum("status", ["pending", "confirmed", "cancelled"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TournamentBooking = typeof tournamentBookings.$inferSelect;

// ─── Tournament Participants ───────────────────────────────────────────────────
export const tournamentParticipants = mysqlTable("tournament_participants", {
  id: int("id").autoincrement().primaryKey(),
  tournamentBookingId: int("tournamentBookingId").notNull(),
  userId: int("userId").notNull(),
  bookingId: int("bookingId"),
  shareAmountCents: int("shareAmountCents"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TournamentParticipant = typeof tournamentParticipants.$inferSelect;

// ─── Blocked Times ───────────────────────────────────────────────────────────
// Mario can block out any date/time range to prevent student bookings
export const blockedTimes = mysqlTable("blocked_times", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(), // e.g. "Vacation", "Personal", "Court maintenance"
  blockedDate: date("blockedDate").notNull(),
  startTime: time("startTime"),   // null = all day
  endTime: time("endTime"),       // null = all day
  isAllDay: boolean("isAllDay").default(false).notNull(),
  // Which program types are blocked (null = all programs)
  affectsPrivateLessons: boolean("affectsPrivateLessons").default(true).notNull(),
  affects105Clinic: boolean("affects105Clinic").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BlockedTime = typeof blockedTimes.$inferSelect;
export type InsertBlockedTime = typeof blockedTimes.$inferInsert;

// ─── Session Waitlist ─────────────────────────────────────────────────────────
// When a session slot is full, students can join the waitlist
export const sessionWaitlist = mysqlTable("session_waitlist", {
  id: int("id").autoincrement().primaryKey(),
  scheduleSlotId: int("scheduleSlotId").notNull(),
  userId: int("userId").notNull(),
  programId: int("programId").notNull(),
  status: mysqlEnum("status", ["waiting", "notified", "converted", "removed"]).default("waiting").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  notifiedAt: timestamp("notifiedAt"),
});
export type SessionWaitlist = typeof sessionWaitlist.$inferSelect;
export type InsertSessionWaitlist = typeof sessionWaitlist.$inferInsert;

// ─── Promo Codes ──────────────────────────────────────────────────────────────
export const promoCodes = mysqlTable("promo_codes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  discountType: mysqlEnum("discountType", ["percent", "fixed", "free"]).notNull(),
  discountValue: int("discountValue").notNull().default(0), // percent (0-100) or cents for fixed
  maxUses: int("maxUses"), // null = unlimited
  usedCount: int("usedCount").notNull().default(0),
  expiresAt: timestamp("expiresAt"),
  isActive: boolean("isActive").notNull().default(true),
  appliesTo: text("appliesTo"), // JSON array of program types, null = all
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy"), // admin user id
});
export type PromoCode = typeof promoCodes.$inferSelect;
export type InsertPromoCode = typeof promoCodes.$inferInsert;

// ─── Newsletter ───────────────────────────────────────────────────────────────
// Newsletters can be published as HTML pages with shareable URLs.
// Admin uploads HTML content; each newsletter gets a unique slug for public access.
export const newsletters = mysqlTable("newsletters", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(), // URL-friendly identifier e.g. "spring-2026"
  subject: varchar("subject", { length: 500 }).notNull(),   // display title
  season: varchar("season", { length: 100 }),               // e.g. "Spring 2026"
  htmlContent: mediumtext("htmlContent"),                   // full HTML of the newsletter (up to 16MB)
  // Legacy text-based fields (kept for backward compat)
  headline: varchar("headline", { length: 500 }),
  body: text("body"),
  tennisTip: text("tennisTip"),
  mentalTip: text("mentalTip"),
  winnerSpotlight: text("winnerSpotlight"),
  includeSchedule: boolean("includeSchedule").notNull().default(false),
  status: mysqlEnum("status", ["draft", "published", "sent"]).notNull().default("draft"),
  publishedAt: timestamp("publishedAt"),
  sentAt: timestamp("sentAt"),
  recipientCount: int("recipientCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Newsletter = typeof newsletters.$inferSelect;
export type InsertNewsletter = typeof newsletters.$inferInsert;

// ─── Gift Cards ──────────────────────────────────────────────────────────────
export const giftCards = mysqlTable("gift_cards", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  purchasedByUserId: int("purchasedByUserId").notNull(),
  recipientName: varchar("recipientName", { length: 200 }).notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }),
  recipientMessage: text("recipientMessage"),
  programType: varchar("programType", { length: 100 }).notNull(), // e.g. 'private_lesson'
  programLabel: varchar("programLabel", { length: 200 }).notNull(), // e.g. '1 Private Lesson'
  amountInCents: int("amountInCents").notNull(),
  status: mysqlEnum("status", ["active", "redeemed", "expired"]).notNull().default("active"),
  redeemedByUserId: int("redeemedByUserId"),
  redeemedAt: timestamp("redeemedAt"),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 200 }),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type GiftCard = typeof giftCards.$inferSelect;
export type InsertGiftCard = typeof giftCards.$inferInsert;

// ─── Scheduled Reminders ──────────────────────────────────────────────────────
// When admin clicks "Remind", a reminder is queued to fire 2 hours before lesson
export const scheduledReminders = mysqlTable("scheduled_reminders", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  userId: int("userId").notNull(),
  sendAt: timestamp("sendAt").notNull(), // UTC time to fire the reminder
  status: mysqlEnum("status", ["pending", "sent", "failed", "cancelled"]).notNull().default("pending"),
  emailSent: boolean("emailSent").notNull().default(false),
  smsSent: boolean("smsSent").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  sentAt: timestamp("sentAt"),
  error: text("error"),
});
export type ScheduledReminder = typeof scheduledReminders.$inferSelect;
export type InsertScheduledReminder = typeof scheduledReminders.$inferInsert;

// ─── Referrals ────────────────────────────────────────────────────────────────
// Each user gets a unique referral code. When a referred friend books their
// first session, the referrer automatically receives a discount promo code.
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(),       // user who shared the link
  referredUserId: int("referredUserId").notNull(), // new user who signed up via referral
  referralCode: varchar("referralCode", { length: 20 }).notNull(), // code that was used
  rewardPromoCodeId: int("rewardPromoCodeId"),   // promo code given to referrer as reward
  status: mysqlEnum("status", ["pending", "rewarded"]).notNull().default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  rewardedAt: timestamp("rewardedAt"),
});
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

// ─── Announcements ────────────────────────────────────────────────────────────
// Admin posts announcements (rain cancellations, schedule changes, etc.)
// All registered students are notified via in-app, email, and/or SMS.
export const announcements = mysqlTable("announcements", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body").notNull(),
  type: mysqlEnum("type", ["info", "cancellation", "rain_cancellation", "schedule_change", "urgent", "event"]).notNull().default("info"),
  sendEmail: boolean("sendEmail").notNull().default(true),
  sendSms: boolean("sendSms").notNull().default(false),
  // Targeting: null = all students, otherwise a specific program type
  targetProgram: varchar("targetProgram", { length: 100 }),
  createdBy: int("createdBy").notNull(), // admin user id
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  // Delivery stats (updated after broadcast)
  emailsSent: int("emailsSent").notNull().default(0),
  smsSent: int("smsSent").notNull().default(0),
});
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

// Tracks which users have read each announcement (for unread badge)
export const announcementReads = mysqlTable("announcement_reads", {
  id: int("id").autoincrement().primaryKey(),
  announcementId: int("announcementId").notNull(),
  userId: int("userId").notNull(),
  readAt: timestamp("readAt").defaultNow().notNull(),
});
export type AnnouncementRead = typeof announcementReads.$inferSelect;
