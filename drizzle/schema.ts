import {
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
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
  slotDate: date("slotDate").notNull(),
  startTime: time("startTime").notNull(),
  endTime: time("endTime").notNull(),
  maxParticipants: int("maxParticipants").default(10).notNull(),
  currentParticipants: int("currentParticipants").default(0).notNull(),
  isAvailable: boolean("isAvailable").default(true).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
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
