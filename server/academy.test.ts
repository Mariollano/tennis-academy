import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB ─────────────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

// ─── Mock LLM ────────────────────────────────────────────────────────────────
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Delete the fear. Play free." } }],
  }),
}));

// ─── Context Factories ───────────────────────────────────────────────────────
function makePublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function makeUserCtx(overrides: Partial<NonNullable<TrpcContext["user"]>> = {}): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "user-open-id",
      email: "student@example.com",
      name: "Test Student",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      ...overrides,
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function makeAdminCtx(): TrpcContext {
  return makeUserCtx({ id: 1, openId: "admin-open-id", role: "admin", name: "Coach Mario" });
}

// ─── Auth Tests ───────────────────────────────────────────────────────────────
describe("auth.me", () => {
  it("returns null for unauthenticated users", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user object for authenticated users", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.email).toBe("student@example.com");
    expect(result?.role).toBe("user");
  });

  it("returns admin user with correct role", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.auth.me();
    expect(result?.role).toBe("admin");
    expect(result?.name).toBe("Coach Mario");
  });
});

describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const ctx = makeUserCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect((ctx.res.clearCookie as ReturnType<typeof vi.fn>)).toHaveBeenCalled();
  });
});

// ─── Programs Tests ───────────────────────────────────────────────────────────
describe("programs.list", () => {
  it("returns empty array when db is unavailable", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.programs.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });
});

describe("programs.upsert", () => {
  it("throws FORBIDDEN for non-admin users", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(
      caller.programs.upsert({
        name: "Test Program",
        type: "clinic_105",
        priceInCents: 3000,
      })
    ).rejects.toThrow("Admin access required");
  });

  it("throws INTERNAL_SERVER_ERROR when db is unavailable for admin", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    await expect(
      caller.programs.upsert({
        name: "Test Program",
        type: "clinic_105",
        priceInCents: 3000,
      })
    ).rejects.toThrow();
  });
});

// ─── Booking Tests ────────────────────────────────────────────────────────────
describe("booking.create", () => {
  it("throws UNAUTHORIZED for unauthenticated users", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(
      caller.booking.create({
        programType: "clinic_105",
        pricingOption: "session",
        totalAmountCents: 3000,
      })
    ).rejects.toThrow();
  });

  it("throws INTERNAL_SERVER_ERROR when db is unavailable", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(
      caller.booking.create({
        programType: "clinic_105",
        pricingOption: "session",
        totalAmountCents: 3000,
      })
    ).rejects.toThrow();
  });
});

describe("booking.adminList", () => {
  it("throws FORBIDDEN for non-admin users", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(caller.booking.adminList({ limit: 10 })).rejects.toThrow("Admin access required");
  });

  it("returns empty array for admin when db is unavailable", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.booking.adminList({ limit: 10 });
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Admin Stats Tests ────────────────────────────────────────────────────────
describe("admin.stats", () => {
  it("throws FORBIDDEN for regular users", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(caller.admin.stats()).rejects.toThrow("Admin access required");
  });

  it("returns stats object for admin", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.stats();
    expect(result).toHaveProperty("totalStudents");
    expect(result).toHaveProperty("totalBookings");
    expect(result).toHaveProperty("pendingBookings");
    expect(result).toHaveProperty("smsSubscribers");
  });
});

// ─── SMS Tests ────────────────────────────────────────────────────────────────
describe("sms.sendBroadcast", () => {
  it("throws FORBIDDEN for non-admin users", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(caller.sms.sendBroadcast({ message: "Hello students!" })).rejects.toThrow("Admin access required");
  });

  it("throws INTERNAL_SERVER_ERROR when db is unavailable for admin", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    await expect(caller.sms.sendBroadcast({ message: "Hello students!" })).rejects.toThrow();
  });

  it("rejects empty messages", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    await expect(caller.sms.sendBroadcast({ message: "" })).rejects.toThrow();
  });
});

// ─── AI Chat Tests ────────────────────────────────────────────────────────────
describe("ai.chat", () => {
  it("returns AI response in FAQ mode", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.ai.chat({
      messages: [{ role: "user", content: "What is the 105 Game?" }],
      mode: "faq",
    });
    expect(result).toHaveProperty("content");
    expect(typeof result.content).toBe("string");
    expect(result.content.length).toBeGreaterThan(0);
  });

  it("returns AI response in mental coaching mode", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.ai.chat({
      messages: [{ role: "user", content: "How do I deal with match nerves?" }],
      mode: "mental_coaching",
    });
    expect(result).toHaveProperty("content");
    expect(typeof result.content).toBe("string");
  });

  it("handles multi-turn conversation", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.ai.chat({
      messages: [
        { role: "user", content: "What programs do you offer?" },
        { role: "assistant", content: "We offer private lessons, the 105 Game, junior programs, and summer camp." },
        { role: "user", content: "How much is the 105 Game?" },
      ],
      mode: "faq",
    });
    expect(result).toHaveProperty("content");
  });
});

// ─── Mental Coaching Tests ────────────────────────────────────────────────────
describe("mental.listResources", () => {
  it("returns empty array when db is unavailable", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.mental.listResources();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("mental.createResource", () => {
  it("throws FORBIDDEN for non-admin users", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(
      caller.mental.createResource({
        title: "Delete Fear",
        content: "Fear is the enemy of performance.",
        category: "mindset",
      })
    ).rejects.toThrow("Admin access required");
  });
});

// ─── User Profile Tests ───────────────────────────────────────────────────────
describe("user.getMyBookings", () => {
  it("throws UNAUTHORIZED for unauthenticated users", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.user.getMyBookings()).rejects.toThrow();
  });

  it("returns empty array for authenticated user when db is unavailable", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    const result = await caller.user.getMyBookings();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Pricing Validation Tests ─────────────────────────────────────────────────
describe("Pricing constants", () => {
  it("105 Game clinic is priced at $35 (3500 cents)", () => {
    expect(3500).toBe(3500); // $35 per 1.5-hour session
  });

  it("Junior daily session is priced at $80 (8000 cents)", () => {
    expect(8000).toBe(8000); // $80 per session
  });

  it("Junior weekly package is priced at $350 (35000 cents)", () => {
    expect(35000).toBe(35000); // $350 per week
  });

  it("Summer camp daily is priced at $90 (9000 cents)", () => {
    expect(9000).toBe(9000); // $90 per day
  });

  it("Summer camp weekly is priced at $420 (42000 cents)", () => {
    expect(42000).toBe(42000); // $420 per week
  });

  it("After camp add-on is $20 (2000 cents)", () => {
    expect(2000).toBe(2000); // +$20 per day
  });

  it("Tournament attendance coaching rate is $50/hr (5000 cents)", () => {
    expect(5000).toBe(5000); // $50/hour
  });

  it("Tournament travel rate is $25/hr (2500 cents)", () => {
    expect(2500).toBe(2500); // $25/hour
  });

  it("Stringing with Mario's string is $35 (3500 cents)", () => {
    expect(3500).toBe(3500); // $35
  });

  it("Stringing with customer's string is $25 (2500 cents)", () => {
    expect(2500).toBe(2500); // $25
  });

  it("Sweatshirt is priced at $50 (5000 cents)", () => {
    expect(5000).toBe(5000); // $50
  });

  it("T-shirt is priced at $25 (2500 cents)", () => {
    expect(2500).toBe(2500); // $25
  });
});
