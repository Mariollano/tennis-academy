import { describe, it, expect } from "vitest";
import { isEmailConfigured, sendBookingConfirmation, sendBookingConfirmed, sendBookingCancelled, sendBookingReminder } from "./email";

const TEST_BOOKING = {
  toEmail: process.env.EMAIL_USER || "test@example.com",
  toName: "Coach Mario (Test)",
  programLabel: "Private Lesson",
  sessionDate: "Saturday, March 8, 2026",
  sessionTime: "9:00 AM – 10:00 AM",
  bookingId: 9999,
};

describe("Email configuration", () => {
  it("should have EMAIL_USER and EMAIL_APP_PASSWORD configured", () => {
    expect(isEmailConfigured()).toBe(true);
  });
});

describe("Email templates", () => {
  it("should send a booking pending confirmation email successfully", async () => {
    if (!isEmailConfigured()) {
      console.warn("[Email Test] Skipping — email not configured");
      return;
    }
    const result = await sendBookingConfirmation(TEST_BOOKING);
    if (!result.success) console.error("[Email Test] Error:", result.error);
    expect(result.success).toBe(true);
  }, 20000);

  it("should send a booking confirmed email successfully", async () => {
    if (!isEmailConfigured()) {
      console.warn("[Email Test] Skipping — email not configured");
      return;
    }
    const result = await sendBookingConfirmed(TEST_BOOKING);
    if (!result.success) console.error("[Email Test] Error:", result.error);
    expect(result.success).toBe(true);
  }, 20000);

  it("should send a booking cancelled email successfully", async () => {
    if (!isEmailConfigured()) {
      console.warn("[Email Test] Skipping — email not configured");
      return;
    }
    const result = await sendBookingCancelled(TEST_BOOKING);
    if (!result.success) console.error("[Email Test] Error:", result.error);
    expect(result.success).toBe(true);
  }, 20000);

  it("should send a booking reminder email successfully", async () => {
    if (!isEmailConfigured()) {
      console.warn("[Email Test] Skipping — email not configured");
      return;
    }
    const result = await sendBookingReminder(TEST_BOOKING);
    if (!result.success) console.error("[Email Test] Error:", result.error);
    expect(result.success).toBe(true);
  }, 20000);
});
