import { describe, expect, it } from "vitest";
import {
  CLINIC_105_WEEKDAY_CAP,
  isMorningClinicWindow,
} from "../shared/clinic105Schedule";

describe("105 clinic schedule rules", () => {
  it("uses a four-player cap for weekday morning clinics", () => {
    expect(CLINIC_105_WEEKDAY_CAP).toBe(4);
  });

  it("allows morning sessions and rejects noon or evening sessions", () => {
    expect(isMorningClinicWindow("09:00:00", "10:30:00")).toBe(true);
    expect(isMorningClinicWindow("11:00", "11:59")).toBe(true);
    expect(isMorningClinicWindow("11:30", "12:00")).toBe(false);
    expect(isMorningClinicWindow("18:30:00", "20:00:00")).toBe(false);
  });
});
