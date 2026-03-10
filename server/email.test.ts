import { describe, it, expect } from "vitest";
import { isEmailConfigured, sendBookingConfirmation, sendBookingConfirmed, sendBookingCancelled, sendBookingReminder } from "./email";
import { Resend } from "resend";

const TEST_BOOKING = {
  toEmail: process.env.EMAIL_USER || "test@example.com",
  toName: "Coach Mario (Test)",
  programLabel: "Private Lesson",
  sessionDate: "Saturday, March 8, 2026",
  sessionTime: "9:00 AM – 10:00 AM",
  bookingId: 9999,
};

describe("Email configuration", () => {
  it("should have email configured (Resend or Gmail)", () => {
    expect(isEmailConfigured()).toBe(true);
  });

  it("should validate Resend API key if configured", async () => {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      console.warn("[Email Test] RESEND_API_KEY not set — skipping Resend validation");
      return;
    }
    const resend = new Resend(resendKey);
    // List domains — a valid key returns a 200 with data array
    const domains = await resend.domains.list();
    expect(domains.error).toBeNull();
    expect(Array.isArray(domains.data?.data)).toBe(true);
    console.log(`[Email Test] Resend key valid. Domains: ${domains.data?.data?.map((d: any) => d.name).join(", ")}`);
  }, 15000);
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
