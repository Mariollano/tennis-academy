import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock the DB so tests don't need a live database ─────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

vi.mock("./sms", () => ({
  sendSms: vi.fn().mockResolvedValue({ success: true }),
  isTwilioConfigured: vi.fn().mockReturnValue(false),
}));

vi.mock("./email", () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
  isEmailConfigured: vi.fn().mockReturnValue(false),
}));

import { getDb } from "./db";

// ─── Helper: build a minimal mock DB ─────────────────────────────────────────
function buildMockDb(overrides: Record<string, any> = {}) {
  const selectResult: any[] = overrides.selectResult ?? [];
  const mockSelect = vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue(selectResult),
      }),
    }),
  });
  const mockUpdate = vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue({}),
    }),
  });
  const mockInsert = vi.fn().mockReturnValue({
    values: vi.fn().mockResolvedValue([{ insertId: 42 }]),
  });

  return { select: mockSelect, update: mockUpdate, insert: mockInsert };
}

describe("Referral code generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate a referral code for a user without one", async () => {
    const mockDb = buildMockDb({ selectResult: [{ referralCode: null }] });
    (getDb as any).mockResolvedValue(mockDb);

    const { ensureReferralCode } = await import("./referral");
    const code = await ensureReferralCode(1, "Mario");

    expect(code).toBeTruthy();
    expect(typeof code).toBe("string");
    expect(code.length).toBeGreaterThan(4);
    // Code should start with letters from the name
    expect(code).toMatch(/^[A-Z]+/);
    console.log(`[Referral Test] Generated code: ${code}`);
  });

  it("should return existing referral code if user already has one", async () => {
    const mockDb = buildMockDb({ selectResult: [{ referralCode: "MARIO7X3K" }] });
    (getDb as any).mockResolvedValue(mockDb);

    const { ensureReferralCode } = await import("./referral");
    const code = await ensureReferralCode(1, "Mario");

    expect(code).toBe("MARIO7X3K");
    // Should NOT call update since code already exists
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("should generate a code for a user with no name", async () => {
    const mockDb = buildMockDb({ selectResult: [{ referralCode: null }] });
    (getDb as any).mockResolvedValue(mockDb);

    const { ensureReferralCode } = await import("./referral");
    const code = await ensureReferralCode(5, null);

    expect(code).toBeTruthy();
    expect(code.length).toBeGreaterThan(4);
  });
});

describe("Referral reward logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules(); // reset module cache so mock state is fresh
  });

  it("should not reward if user has no referredBy code", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ referredBy: null, name: "Alice" }]),
          }),
        }),
      }),
      update: vi.fn(),
      insert: vi.fn(),
    };
    (getDb as any).mockResolvedValue(mockDb);

    const { maybeRewardReferrer } = await import("./referral");
    await maybeRewardReferrer(99);

    // No promo code should be created
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("should not reward if referral code doesn't match any user", async () => {
    let callCount = 0;
    const mockDb = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockImplementation(() => {
              callCount++;
              if (callCount === 1) return Promise.resolve([{ referredBy: "BADCODE", name: "Alice" }]);
              return Promise.resolve([]); // no referrer found
            }),
          }),
        }),
      })),
      update: vi.fn(),
      insert: vi.fn(),
    };
    (getDb as any).mockResolvedValue(mockDb);

    const { maybeRewardReferrer } = await import("./referral");
    await maybeRewardReferrer(99);

    expect(mockDb.insert).not.toHaveBeenCalled();
  });
});
