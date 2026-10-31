import { describe, expect, it } from "vitest";
import { getFirstBookableSlotDate, slotDateToCalendarDate } from "./bookingCalendar";

describe("booking calendar date helpers", () => {
  it("keeps a stored UTC date on the intended local calendar day", () => {
    const date = slotDateToCalendarDate("2026-11-01T00:00:00.000Z");

    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(10);
    expect(date?.getDate()).toBe(1);
  });

  it("selects the earliest bookable date instead of a full date", () => {
    const date = getFirstBookableSlotDate([
      { slotDate: "2026-11-01T00:00:00.000Z", isFull: true },
      { slotDate: "2026-11-02T00:00:00.000Z", isFull: false },
    ]);

    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(10);
    expect(date?.getDate()).toBe(2);
  });

  it("returns nothing when every listed date is full", () => {
    expect(getFirstBookableSlotDate([
      { slotDate: "2026-11-01T00:00:00.000Z", isFull: true },
    ])).toBeUndefined();
  });
});
