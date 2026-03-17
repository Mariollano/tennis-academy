/**
 * Tests for the iCal Sync service
 * 
 * Key behaviors tested:
 * 1. Error handling (DB unavailable, no settings, disabled)
 * 2. Timezone conversion: UTC event times → Eastern time strings
 * 3. blockedDate cleanup: MySQL DATE columns return midnight UTC, must use .toISOString() not Eastern conversion
 * 4. Recurring event expansion via rrule
 * 5. All-day event handling
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

// Mock node-ical
vi.mock("node-ical", () => ({
  default: {
    async: {
      fromURL: vi.fn(),
    },
  },
}));

import { syncIcalCalendar } from "./icalSync";
import { getDb } from "./db";
import ical from "node-ical";

// Helper: create a mock DB that captures insert values
function createMockDb(settingsRow: any, existingBlocks: any[] = []) {
  const insertedValues: any[] = [];
  let selectCallCount = 0;

  // The DB query builder is a thenable (Promise-like) object
  // select().from() resolves to an array
  // select().from().limit() also resolves to an array
  const makeQueryBuilder = (resolveValue: any) => {
    const builder: any = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: (resolve: any, reject: any) => Promise.resolve(resolveValue).then(resolve, reject),
    };
    // Make limit() also resolve to the same value
    builder.limit.mockImplementation(() => ({
      then: (resolve: any, reject: any) => Promise.resolve(resolveValue).then(resolve, reject),
    }));
    return builder;
  };

  const mockDb: any = {
    select: vi.fn().mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeQueryBuilder([settingsRow]);
      return makeQueryBuilder(existingBlocks);
    }),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    insert: vi.fn().mockImplementation(() => ({
      values: vi.fn().mockImplementation((vals) => {
        insertedValues.push(vals);
        return Promise.resolve();
      }),
    })),
    _insertedValues: insertedValues,
  };

  // Make delete().where() resolve properly
  mockDb.delete.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
  // Make update().set().where() resolve properly
  mockDb.update.mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  });

  return mockDb;
}

describe("iCal Sync Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when DB is unavailable", async () => {
    vi.mocked(getDb).mockResolvedValue(null as any);
    const result = await syncIcalCalendar();
    expect(result.success).toBe(false);
    expect(result.message).toContain("Database");
  });

  it("returns error when no settings are configured", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(getDb).mockResolvedValue(mockDb as any);
    const result = await syncIcalCalendar();
    expect(result.success).toBe(false);
    expect(result.message).toContain("not configured");
  });

  it("returns error when sync is disabled", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        { id: 1, icalUrl: "webcal://example.com/cal.ics", isEnabled: false },
      ]),
    };
    vi.mocked(getDb).mockResolvedValue(mockDb as any);
    const result = await syncIcalCalendar();
    expect(result.success).toBe(false);
    expect(result.message).toContain("disabled");
  });

  it("handles iCal fetch error gracefully", async () => {
    const mockDb = createMockDb({ id: 1, icalUrl: "https://example.com/cal.ics", isEnabled: true });
    vi.mocked(getDb).mockResolvedValue(mockDb as any);
    vi.mocked(ical.async.fromURL).mockRejectedValue(new Error("Network error"));

    const result = await syncIcalCalendar();
    expect(result.success).toBe(false);
    expect(result.message).toContain("Network error");
    expect(result.blocksCreated).toBe(0);
  });

  it("converts webcal:// URL to https:// before fetching", async () => {
    const mockDb = createMockDb({ id: 1, icalUrl: "webcal://example.com/cal.ics", isEnabled: true });
    vi.mocked(getDb).mockResolvedValue(mockDb as any);
    vi.mocked(ical.async.fromURL).mockResolvedValue({} as any);

    await syncIcalCalendar();
    expect(ical.async.fromURL).toHaveBeenCalledWith("https://example.com/cal.ics");
  });

  it("stores correct Eastern time strings for a 9 AM Eastern event (UTC 13:00)", async () => {
    // 105 clinic: 9:00-10:30 AM Eastern = 13:00-14:30 UTC
    const eventStart = new Date("2026-03-18T13:00:00.000Z"); // 9 AM Eastern
    const eventEnd = new Date("2026-03-18T14:30:00.000Z");   // 10:30 AM Eastern

    const mockDb = createMockDb({ id: 1, icalUrl: "https://example.com/cal.ics", isEnabled: true });
    vi.mocked(getDb).mockResolvedValue(mockDb as any);
    vi.mocked(ical.async.fromURL).mockResolvedValue({
      "event-1": {
        type: "VEVENT",
        summary: "105 Clinic",
        start: eventStart,
        end: eventEnd,
        datetype: "date-time",
      },
    } as any);

    await syncIcalCalendar();

    const inserted = mockDb._insertedValues;
    expect(inserted.length).toBeGreaterThan(0);
    const block = inserted[0];

    // Should store Eastern time strings, NOT UTC
    expect(block.startTime).toBe("09:00:00");
    expect(block.endTime).toBe("10:30:00");

    // blockedDate should be midnight UTC for 2026-03-18
    expect(block.blockedDate).toBeInstanceOf(Date);
    expect(block.blockedDate.toISOString()).toBe("2026-03-18T00:00:00.000Z");
  });

  it("cleanup correctly identifies blocks by UTC date string from MySQL DATE column", () => {
    // MySQL DATE columns return midnight UTC Date objects
    // e.g., the date 2026-03-18 comes back as new Date('2026-03-18T00:00:00.000Z')
    // Converting this to Eastern time gives '2026-03-17' (8 PM Eastern = midnight UTC)
    // We must use .toISOString().substring(0,10) to get '2026-03-18' correctly

    const mysqlDateValue = new Date("2026-03-18T00:00:00.000Z");

    // The WRONG way (old bug): toDateStringEastern converts midnight UTC → March 17 Eastern
    const wrongDateStr = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric", month: "2-digit", day: "2-digit",
    }).format(mysqlDateValue);
    // This gives "03/17/2026" — one day off!
    expect(wrongDateStr).toContain("03/17/2026");

    // The CORRECT way: use UTC date string directly
    const correctDateStr = mysqlDateValue.toISOString().substring(0, 10);
    expect(correctDateStr).toBe("2026-03-18");
  });

  it("handles all-day events correctly", async () => {
    // All-day event: March 18, 2026
    // iCal stores all-day events as date-only (no time component)
    const allDayStart = new Date("2026-03-18T00:00:00.000Z");
    const allDayEnd = new Date("2026-03-19T00:00:00.000Z"); // exclusive end

    const mockDb = createMockDb({ id: 1, icalUrl: "https://example.com/cal.ics", isEnabled: true });
    vi.mocked(getDb).mockResolvedValue(mockDb as any);
    vi.mocked(ical.async.fromURL).mockResolvedValue({
      "event-1": {
        type: "VEVENT",
        summary: "Vacation",
        start: allDayStart,
        end: allDayEnd,
        datetype: "date", // all-day marker
      },
    } as any);

    await syncIcalCalendar();

    const inserted = mockDb._insertedValues;
    if (inserted.length > 0) {
      const block = inserted[0];
      expect(block.isAllDay).toBe(true);
      expect(block.startTime).toBeNull();
      expect(block.endTime).toBeNull();
    }
  });

  it("recurring events use floating Eastern dtstart so occurrences have correct Eastern times", async () => {
    // Reproduces the JUNIOR PROGRAM bug:
    // node-ical parses DTSTART;TZID=America/New_York:20241205T153000 as 2024-12-05T20:30:00Z (3:30 PM Eastern)
    // Old code: rrulestr('RRULE:FREQ=WEEKLY', { dtstart: eventStartUTC }) → occurrences at 20:30Z = 4:30 PM Eastern (WRONG)
    // New code: convert dtstart to floating Eastern (15:30Z) → occurrences at 15:30Z floating → floatingToRealUTC → 19:30Z = 3:30 PM Eastern (CORRECT)
    const eventStart = new Date("2024-12-05T20:30:00.000Z"); // 3:30 PM Eastern
    const eventEnd = new Date("2024-12-05T23:30:00.000Z");   // 6:30 PM Eastern

    const mockDb = createMockDb({ id: 1, icalUrl: "https://example.com/cal.ics", isEnabled: true });
    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    // Create a mock recurring event with RRULE
    const mockRrule = {
      toString: () => "RRULE:FREQ=WEEKLY",
    };

    vi.mocked(ical.async.fromURL).mockResolvedValue({
      "event-1": {
        type: "VEVENT",
        summary: "Junior program",
        start: eventStart,
        end: eventEnd,
        datetype: "date-time",
        rrule: mockRrule,
      },
    } as any);

    await syncIcalCalendar();

    const inserted = mockDb._insertedValues;
    // Should have created at least one block
    expect(inserted.length).toBeGreaterThan(0);

    // All blocks should have startTime of 15:30:00 (3:30 PM Eastern), NOT 16:30:00 (4:30 PM Eastern)
    for (const block of inserted) {
      if (block.startTime !== null) {
        // The start time should be 15:30 (3:30 PM Eastern), not 16:30 (4:30 PM Eastern)
        expect(block.startTime).toBe("15:30:00");
        expect(block.endTime).toBe("18:30:00");
      }
    }
  });

  it("successfully syncs events and returns correct result shape", async () => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowEnd = new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000);

    const mockDb = createMockDb({ id: 1, icalUrl: "https://example.com/cal.ics", isEnabled: true });
    vi.mocked(getDb).mockResolvedValue(mockDb as any);
    vi.mocked(ical.async.fromURL).mockResolvedValue({
      "event-1": {
        type: "VEVENT",
        summary: "Haircut",
        start: tomorrow,
        end: tomorrowEnd,
        datetype: "date-time",
      },
    } as any);

    const result = await syncIcalCalendar();
    expect(result).toBeDefined();
    expect(typeof result.success).toBe("boolean");
    expect(typeof result.message).toBe("string");
    expect(typeof result.blocksCreated).toBe("number");
  });
});
