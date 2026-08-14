import { describe, expect, it } from "vitest";
import { shouldShowScheduledSlot } from "./availability";

describe("shouldShowScheduledSlot", () => {
  it("keeps a booked clinic visible when an iCal block overlaps it", () => {
    expect(shouldShowScheduledSlot(1, true)).toBe(true);
  });

  it("hides an unbooked session when an iCal block overlaps it", () => {
    expect(shouldShowScheduledSlot(0, true)).toBe(false);
  });

  it("shows an unblocked session even when it has no bookings", () => {
    expect(shouldShowScheduledSlot(0, false)).toBe(true);
  });
});
