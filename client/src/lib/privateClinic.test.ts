import { describe, expect, it } from "vitest";
import { PRIVATE_CLINIC, privateClinicSmsHref } from "./privateClinic";

describe("Private Clinic configuration", () => {
  it("keeps the approved price, schedule, and invitation-only setting", () => {
    expect(PRIVATE_CLINIC.price).toBe("$35");
    expect(PRIVATE_CLINIC.schedule).toBe("Tuesdays & Saturdays · 9:00–10:30 AM");
    expect(PRIVATE_CLINIC.availability).toBe("Invitation Only");
  });

  it("gives interested players a text link to Coach Mario", () => {
    expect(privateClinicSmsHref).toContain("sms:4019655873");
  });
});
