import { describe, expect, it } from "vitest";
import { toLocalDateKey } from "./calendarDate";

describe("toLocalDateKey", () => {
  it("uses the device calendar day instead of the UTC day", () => {
    const easternEvening = new Date(2026, 7, 14, 21, 30, 0);
    expect(toLocalDateKey(easternEvening)).toBe("2026-08-14");
  });

  it("pads month and day values", () => {
    expect(toLocalDateKey(new Date(2026, 0, 5, 9, 0, 0))).toBe("2026-01-05");
  });
});
