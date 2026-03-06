import { describe, it, expect } from "vitest";
import { isEmailConfigured, sendBookingConfirmation } from "./email";

describe("Email configuration", () => {
  it("should have EMAIL_USER and EMAIL_APP_PASSWORD configured", () => {
    expect(isEmailConfigured()).toBe(true);
  });

  it("should send a booking confirmation email successfully", async () => {
    // Only run if credentials are present
    if (!isEmailConfigured()) {
      console.warn("[Email Test] Skipping — email not configured");
      return;
    }

    const emailUser = process.env.EMAIL_USER!;

    const result = await sendBookingConfirmation({
      toEmail: emailUser, // send to self as a test
      toName: "Coach Mario (Test)",
      programLabel: "Private Lesson",
      sessionDate: "Saturday, March 8, 2026",
      sessionTime: "9:00 AM – 10:00 AM",
      bookingId: 9999,
    });

    if (!result.success) {
      console.error("[Email Test] Error:", result.error);
    }
    expect(result.success).toBe(true);
  }, 20000); // 20s timeout for SMTP
});
