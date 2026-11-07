import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MembershipTestDb } from "./aiMembershipTestDb";

const mock = vi.hoisted(() => ({
  db: null as any,
  account: vi.fn(), endpoints: vi.fn(), checkout: vi.fn(), session: vi.fn(), subscription: vi.fn(), cancel: vi.fn(),
  endpointCreate: vi.fn(), endpointRetrieve: vi.fn(), constructEvent: vi.fn(),
  verifyEmail: vi.fn(), sendEmail: vi.fn(), storagePut: vi.fn(), storageGet: vi.fn(),
  catalog: vi.fn(),
}));
vi.mock("./db", () => ({ getDb: async () => mock.db }));
vi.mock("stripe", () => ({ default: vi.fn(() => ({ accounts: { retrieve: mock.account }, webhookEndpoints: { list: mock.endpoints, create: mock.endpointCreate, retrieve: mock.endpointRetrieve }, webhooks: { constructEvent: mock.constructEvent }, checkout: { sessions: { create: mock.checkout, retrieve: mock.session } }, subscriptions: { retrieve: mock.subscription, update: mock.cancel } })) }));
vi.mock("./aiMembershipEmail", async original => ({ ...await original<any>(), verifyMembershipEmail: mock.verifyEmail, sendMemberEmail: mock.sendEmail }));
vi.mock("./storage", () => ({ storagePut: mock.storagePut, storageGet: mock.storageGet }));
vi.mock("./aiMembershipCatalog", () => ({ getOrCreateMembershipPrice: mock.catalog }));
import { AI_MEMBERSHIP, AI_GUIDES, isMembershipOrigin, normalizeMemberEmail, subscriptionGrantsAccess } from "../shared/aiMembership";
import { aiMembers, aiSubscriptions, aiCheckoutIntents, aiMemberSessions, aiLoginTokens, aiMembershipSettings, aiGuideAssets } from "../drizzle/schema";
import { encryptGuide, decryptGuide, validatePdf, newToken, hashToken, tokensMatch, createLoginToken, consumeLoginToken, createMemberSession, getSignedInMember, MEMBER_COOKIE, CLAIM_COOKIE, rateLimit, membershipClientAddress } from "./aiMembershipSecurity";
import { aiMembershipRouter } from "./routers/aiMembership";
import { fulfillMembershipCheckout, handleMembershipStripeEvent, hasMemberAccess } from "./aiMembershipFulfillment";
import { getMembershipReadiness, MEMBERSHIP_WEBHOOK_URL, MEMBERSHIP_EVENTS, storedMembershipWebhookSecret } from "./aiMembershipReadiness";
import { membershipEmailHtml } from "./aiMembershipEmail";
import { downloadMemberGuide, registerMembershipWebhook } from "./aiMembershipRoutes";

const origin = "https://tennispromario.com";
let db: MembershipTestDb;
let sub: any;
let session: any;
let requestCounter = 0;
function context(admin = false, cookies = "") {
  const ctx: any = {
    user: admin ? { id: 1, role: "admin" } : null,
    req: { headers: { origin, cookie: cookies, "x-forwarded-proto": "https" }, socket: { remoteAddress: `test-${++requestCounter}` }, secure: false },
    res: { cookie: vi.fn(), clearCookie: vi.fn(), setHeader: vi.fn() },
  };
  return ctx;
}
function caller(admin = false, cookies = "") {
  const ctx = context(admin, cookies);
  return { ctx, api: aiMembershipRouter.createCaller(ctx) };
}
function enableReady() {
  db.rows(aiMembershipSettings).push({ id: 1, checkoutEnabled: true, stripeWebhookEndpointId: "we_members", stripeWebhookAccountId: "acct_members", encryptedWebhookSecret: encryptGuide(Buffer.from("whsec_members_only")).toString("base64"), promptLibrary: null });
}
async function setupPurchase() {
  db.rows(aiCheckoutIntents).push({ id: "intent-1", claimHash: hashToken("a".repeat(64)), email: "prefill@example.com", origin, expiresAt: new Date(Date.now() + 3600_000) });
  return fulfillMembershipCheckout("cs_live_123");
}
async function sessionCookie(memberId: number) {
  const ctx = context();
  await createMemberSession(memberId, ctx.req, ctx.res);
  return `${MEMBER_COOKIE}=${ctx.res.cookie.mock.calls[0][1]}`;
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("AI_MEMBERSHIP_STRIPE_SECRET_KEY", "");
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_unit_test_not_real");
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_unit_test_not_real");
  vi.stubEnv("JWT_SECRET", "unit-test-persistent-encryption-secret");
  db = new MembershipTestDb(); mock.db = db;
  sub = { id: "sub_1", customer: "cus_1", metadata: { type: AI_MEMBERSHIP.type }, status: "active", livemode: true, cancel_at_period_end: false, latest_invoice: { status: "paid" }, items: { data: [{ quantity: 1, current_period_end: Math.floor(Date.now()/1000) + 30 * 86400, price: { currency: "usd", unit_amount: 2000, recurring: { interval: "month", interval_count: 1 } } }] } };
  session = { id: "cs_live_123", mode: "subscription", status: "complete", payment_status: "paid", livemode: true, metadata: { type: AI_MEMBERSHIP.type, intentId: "intent-1" }, customer: "cus_1", customer_email: "prefill@example.com", customer_details: { email: " PAID@example.com ", name: "Paying Coach" }, subscription: sub };
  mock.account.mockResolvedValue({ id: "acct_members", charges_enabled: true, details_submitted: true });
  mock.endpoints.mockResolvedValue({ data: [{ id: "we_members", url: MEMBERSHIP_WEBHOOK_URL, status: "enabled", livemode: true, enabled_events: MEMBERSHIP_EVENTS }] });
  mock.endpointCreate.mockResolvedValue({ id: "we_members", url: MEMBERSHIP_WEBHOOK_URL, status: "enabled", livemode: true, enabled_events: MEMBERSHIP_EVENTS, secret: "whsec_members_only" });
  mock.verifyEmail.mockResolvedValue({ ready: true, provider: "gmail" });
  mock.sendEmail.mockResolvedValue(undefined);
  mock.checkout.mockResolvedValue({ url: "https://checkout.stripe.com/secure-unit-test" });
  mock.session.mockImplementation(async () => session);
  mock.subscription.mockImplementation(async () => sub);
  mock.cancel.mockImplementation(async () => { sub.cancel_at_period_end = true; return sub; });
  mock.storagePut.mockResolvedValue({ key: "encrypted", url: "https://storage.example/encrypted" });
  mock.catalog.mockResolvedValue({ productId: "prod_members", priceId: "price_members_monthly", productName: AI_MEMBERSHIP.productName, amountCents: 2000, currency: "usd", interval: "month", livemode: true });
});
afterEach(() => vi.unstubAllEnvs());

describe("membership foundations", () => {
  it("fixes the product at exactly 2000 cents USD monthly with six slots", () => {
    expect(AI_MEMBERSHIP).toMatchObject({ productName: "AI for the Working Tennis Pro — Membership", amountCents: 2000, currency: "usd", interval: "month" });
    expect(AI_GUIDES).toHaveLength(6);
    expect(normalizeMemberEmail(" PAID@Example.com ")).toBe("paid@example.com");
  });
  it("blocks arbitrary origins and credential-bearing URLs", () => {
    expect(isMembershipOrigin(origin)).toBe(true);
    for (const bad of ["https://evil.example", "https://user@tennispromario.com", "https://tennispromario.com/path", "http://tennispromario.com", "https://tennispromario.com.evil.example"]) expect(isMembershipOrigin(bad)).toBe(false);
  });
  it("requires a live, active, unexpired paid period (not merely a success URL)", () => {
    const base = { status: "active", livemode: true, paidThrough: new Date(Date.now()+3600000) };
    expect(subscriptionGrantsAccess(base)).toBe(true);
    for (const status of ["past_due", "unpaid", "canceled", "trialing", "incomplete"]) expect(subscriptionGrantsAccess({ ...base, status })).toBe(false);
    expect(subscriptionGrantsAccess({ ...base, livemode: false })).toBe(false);
    expect(subscriptionGrantsAccess({ ...base, paidThrough: null })).toBe(false);
    expect(subscriptionGrantsAccess({ ...base, paidThrough: new Date(0) })).toBe(false);
  });
  it("stores only encrypted guide bytes, detects tampering, and rejects non-PDF uploads", () => {
    const pdf = Buffer.from("%PDF-1.4 confidential guide content");
    const encrypted = encryptGuide(pdf);
    expect(encrypted.includes(pdf)).toBe(false);
    expect(decryptGuide(encrypted)).toEqual(pdf);
    const damaged = Buffer.from(encrypted); damaged[damaged.length-1] ^= 1;
    expect(() => decryptGuide(damaged)).toThrow();
    expect(() => validatePdf(Buffer.from("not a pdf").toString("base64"), "fake.pdf")).toThrow();
    expect(validatePdf(pdf.toString("base64"), "real.pdf")).toEqual(pdf);
  });
  it("uses random, hashed tokens and single-use expiring sign-in links", async () => {
    const token = await createLoginToken(1);
    expect(token).toHaveLength(64);
    expect(db.rows(aiLoginTokens)[0].hash).not.toBe(token);
    expect(tokensMatch(token, hashToken(token))).toBe(true);
    expect(tokensMatch("b".repeat(64), hashToken(token))).toBe(false);
    expect(await consumeLoginToken(token)).toBe(1);
    expect(await consumeLoginToken(token)).toBe(null);
    const expired = await createLoginToken(2); db.rows(aiLoginTokens)[1].expiresAt = new Date(0);
    expect(await consumeLoginToken(expired)).toBe(null);
  });
  it("sets HttpOnly member cookies and expires database sessions", async () => {
    db.rows(aiMembers).push({ id: 1, email: "coach@example.com" });
    const ctx = context();
    await createMemberSession(1, ctx.req, ctx.res);
    expect(ctx.res.cookie.mock.calls[0][2]).toMatchObject({ httpOnly: true, secure: true, sameSite: "lax", path: "/" });
    ctx.req.headers.cookie = `${MEMBER_COOKIE}=${ctx.res.cookie.mock.calls[0][1]}`;
    expect((await getSignedInMember(ctx.req))?.email).toBe("coach@example.com");
    db.rows(aiMemberSessions)[0].expiresAt = new Date(0);
    expect(await getSignedInMember(ctx.req)).toBe(null);
  });
  it("limits repeated sign-in/checkout attempts", () => {
    const key = `limit-${newToken()}`;
    rateLimit(key, 1);
    expect(() => rateLimit(key, 1)).toThrow("Too many attempts");
  });
});

describe("safe membership enrollment", () => {
  it("does not create Checkout when email or live readiness fails", async () => {
    enableReady(); mock.verifyEmail.mockResolvedValue({ ready: false, provider: null });
    expect((await getMembershipReadiness()).ready).toBe(false);
    await expect(caller().api.billing.createCheckout({ email: "coach@example.com", origin })).rejects.toThrow("No payment was taken");
    expect(mock.checkout).not.toHaveBeenCalled();
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_only");
    mock.verifyEmail.mockResolvedValue({ ready: true, provider: "gmail" });
    await expect(caller().api.billing.createCheckout({ email: "coach@example.com", origin })).rejects.toThrow();
    expect(mock.checkout).not.toHaveBeenCalled();
  });
  it("requires the verified live webhook, correct events, and explicit admin opening", async () => {
    expect((await getMembershipReadiness()).blockers.join(" ")).toContain("dedicated membership webhook");
    enableReady();
    mock.endpoints.mockResolvedValue({ data: [{ url: "https://old-preview.example/api/stripe/webhook", status: "enabled", enabled_events: ["checkout.session.completed"] }] });
    await expect(caller().api.billing.createCheckout({ email: "coach@example.com", origin })).rejects.toThrow();
    expect(mock.checkout).not.toHaveBeenCalled();
  });
  it("creates monthly subscription Checkout with account email, metadata, and honest placeholders", async () => {
    enableReady();
    const { api, ctx } = caller();
    expect(await api.billing.createCheckout({ email: "Coach@Example.com", origin })).toHaveProperty("url");
    const request = mock.checkout.mock.calls[0][0];
    expect(request.mode).toBe("subscription");
    expect(request.customer_email).toBe("coach@example.com");
    expect(request.line_items[0]).toEqual({ quantity: 1, price: "price_members_monthly" });
    expect(mock.catalog).toHaveBeenCalled();
    expect(request.subscription_data.metadata.type).toBe(AI_MEMBERSHIP.type);
    expect(request.custom_text.submit.message).toContain("Coming soon");
    expect(ctx.res.cookie.mock.calls[0][0]).toBe(CLAIM_COOKIE);
  });
  it("rejects cross-site checkout requests", async () => {
    enableReady(); const { ctx } = caller(); ctx.req.headers.origin = "https://evil.example";
    await expect(aiMembershipRouter.createCaller(ctx).billing.createCheckout({ email: "coach@example.com", origin })).rejects.toThrow();
    expect(mock.checkout).not.toHaveBeenCalled();
  });
  it("creates the member from the email Stripe returned and sends onboarding once", async () => {
    await setupPurchase();
    expect(db.rows(aiMembers)).toHaveLength(1);
    expect(db.rows(aiMembers)[0].email).toBe("paid@example.com");
    expect(await hasMemberAccess(1)).toBe(true);
    expect(mock.sendEmail).toHaveBeenCalledWith("paid@example.com", origin, expect.stringContaining("/ai-members/sign-in#token="), true);
    await fulfillMembershipCheckout(session.id);
    expect(db.rows(aiMembers)).toHaveLength(1);
    expect(mock.sendEmail).toHaveBeenCalledTimes(1);
  });
  it("never grants accounts/access for incomplete or wrong-price payment", async () => {
    session.payment_status = "unpaid";
    await expect(setupPurchase()).rejects.toThrow();
    expect(db.rows(aiMembers)).toHaveLength(0);
    session.payment_status = "paid"; sub.items.data[0].price.unit_amount = 100;
    await expect(fulfillMembershipCheckout(session.id)).rejects.toThrow();
    expect(db.rows(aiMembers)).toHaveLength(0);
  });
  it("retains purchased access and retries email if welcome delivery temporarily fails", async () => {
    mock.sendEmail.mockRejectedValueOnce(new Error("provider unavailable"));
    const purchase = await setupPurchase();
    expect(purchase.welcomeSent).toBe(false);
    expect(await hasMemberAccess(1)).toBe(true);
    mock.sendEmail.mockResolvedValue(undefined);
    await handleMembershipStripeEvent({ type: "checkout.session.completed", data: { object: session } } as any);
    expect(db.rows(aiSubscriptions)[0].welcomeSentAt).toBeInstanceOf(Date);
  });
  it("does not sign in a stranger holding only a shared checkout success URL", async () => {
    await setupPurchase();
    await expect(caller().api.billing.finishCheckout({ sessionId: session.id })).rejects.toThrow("private sign-in link");
    const { api, ctx } = caller(false, `${CLAIM_COOKIE}=${"a".repeat(64)}`);
    expect(await api.billing.finishCheckout({ sessionId: session.id })).toMatchObject({ success: true });
    expect(ctx.res.cookie).not.toHaveBeenCalled();
    expect(await api.account.me()).toMatchObject({ member: null, hasAccess: false });
  });
  it("prevents repeat subscription charges to an already active member email", async () => {
    await setupPurchase(); enableReady();
    await expect(caller().api.billing.createCheckout({ email: "paid@example.com", origin })).rejects.toThrow("paying twice");
    expect(mock.checkout).not.toHaveBeenCalled();
  });
});

describe("gated member library and cancellation", () => {
  it("does not expose downloads or prompts to non-members", async () => {
    expect(await caller().api.account.me()).toMatchObject({ member: null, hasAccess: false });
    await expect(caller().api.library.library()).rejects.toThrow("Sign in");
    await expect(caller().api.library.adminLibrary()).rejects.toThrow();
    await expect(caller().api.library.uploadGuide({ slot: "guide-1", filename: "guide.pdf", base64: Buffer.from("%PDF-1.4").toString("base64") })).rejects.toThrow();
    expect(mock.storagePut).not.toHaveBeenCalled();
  });
  it("returns all six Coming soon slots to active members, without storage keys", async () => {
    await setupPurchase(); const cookie = await sessionCookie(1);
    const library = await caller(false, cookie).api.library.library();
    expect(library.guides).toHaveLength(6);
    expect(library.guides.every(guide => !guide.available)).toBe(true);
    expect(library.promptLibrary).toBeNull();
    expect(JSON.stringify(library)).not.toContain("encryptedStorageKey");
  });
  it("lets only admins upload encrypted PDFs and publish plain-text prompts", async () => {
    const pdf = Buffer.from("%PDF-1.4 member-only guide");
    await caller(true).api.library.uploadGuide({ slot: "guide-1", filename: "guide.pdf", base64: pdf.toString("base64") });
    expect(mock.storagePut.mock.calls[0][2]).toBe("application/octet-stream");
    expect(decryptGuide(mock.storagePut.mock.calls[0][1])).toEqual(pdf);
    await caller(true).api.library.savePrompts({ text: "A real member prompt" });
    await setupPurchase();
    const library = await caller(false, await sessionCookie(1)).api.library.library();
    expect(library.guides[0].available).toBe(true);
    expect(library.promptLibrary).toBe("A real member prompt");
  });
  it("rejects a direct unauthenticated PDF request before reading storage", async () => {
    const ctx = context(); const res: any = { setHeader: vi.fn(), status: vi.fn().mockReturnThis(), send: vi.fn() };
    await downloadMemberGuide({ ...ctx.req, params: { slot: "guide-1" } } as any, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mock.storageGet).not.toHaveBeenCalled();
  });
  it("streams decrypted PDFs to active members, never redirects them to public storage", async () => {
    await setupPurchase();
    const pdf = Buffer.from("%PDF-1.4 guide content");
    db.rows(aiGuideAssets).push({ slot: "guide-1", encryptedStorageKey: "private-key", filename: "guide.pdf" });
    mock.storageGet.mockResolvedValue({ url: "https://storage.example/encrypted" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => encryptGuide(pdf) }));
    const ctx = context(false, await sessionCookie(1));
    const res: any = { setHeader: vi.fn(), status: vi.fn().mockReturnThis(), send: vi.fn(), redirect: vi.fn() };
    await downloadMemberGuide({ ...ctx.req, params: { slot: "guide-1" } } as any, res);
    expect(res.send).toHaveBeenCalledWith(pdf);
    expect(res.redirect).not.toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", expect.stringContaining("no-store"));
    vi.unstubAllGlobals();
  });
  it("cancels only the signed-in member's future renewal and preserves the paid period", async () => {
    await setupPurchase();
    const cookie = await sessionCookie(1);
    await expect(caller().api.billing.cancelRenewal({ subscriptionId: "sub_1" })).rejects.toThrow();
    await expect(caller(false, cookie).api.billing.cancelRenewal({ subscriptionId: "sub_other" })).rejects.toThrow();
    expect(await caller(false, cookie).api.billing.cancelRenewal({ subscriptionId: "sub_1" })).toEqual({ success: true });
    expect(mock.cancel).toHaveBeenCalledWith("sub_1", { cancel_at_period_end: true }, expect.any(Object));
    expect(await hasMemberAccess(1)).toBe(true);
    sub.status = "canceled";
    await handleMembershipStripeEvent({ type: "customer.subscription.deleted", data: { object: sub } } as any);
    expect(await hasMemberAccess(1)).toBe(false);
    await expect(caller(false, cookie).api.library.library()).rejects.toThrow("active paid membership");
  });
  it("reconciles failed payments and renewals using current Stripe state", async () => {
    await setupPurchase(); sub.status = "past_due";
    await handleMembershipStripeEvent({ type: "invoice.payment_failed", data: { object: { parent: { subscription_details: { subscription: "sub_1" } } } } } as any);
    expect(await hasMemberAccess(1)).toBe(false);
    sub.status = "active";
    await handleMembershipStripeEvent({ type: "invoice.paid", data: { object: { parent: { subscription_details: { subscription: "sub_1" } } } } } as any);
    expect(await hasMemberAccess(1)).toBe(true);
  });
  it("requires admin and all readiness checks before enrollment can be opened", async () => {
    await expect(caller().api.library.setEnrollment({ enabled: true, acknowledgePlaceholders: true })).rejects.toThrow();
    await expect(caller(true).api.library.setEnrollment({ enabled: true, acknowledgePlaceholders: true })).rejects.toThrow("stays closed");
    enableReady();
    await expect(caller(true).api.library.setEnrollment({ enabled: true })).rejects.toThrow("unfinished guides");
    expect(await caller(true).api.library.setEnrollment({ enabled: true, acknowledgePlaceholders: true })).toEqual({ enabled: true });
  });
  it("welcomes members with sign-in, library, and getting-started links, not fake download links", () => {
    const html = membershipEmailHtml(origin, `${origin}/ai-members/sign-in#token=private`, true);
    expect(html).toContain("RI TENNIS ACADEMY");
    expect(html).toContain("Get started in three steps");
    expect(html).toContain('/ai-members/sign-in#token=private');
    expect(html).toContain(`href="${origin}/ai-members"`);
    expect(html).toContain("Coming soon");
  });
});


describe("membership security review regressions", () => {
  it("does not merge browser login rights into an existing email account after a payment", async () => {
    db.rows(aiMembers).push({ id: 99, email: "paid@example.com" });
    await setupPurchase();
    const { api, ctx } = caller(false, `${CLAIM_COOKIE}=${"a".repeat(64)}`);
    await api.billing.finishCheckout({ sessionId: session.id });
    expect(ctx.res.cookie).not.toHaveBeenCalled();
    expect(await api.account.me()).toMatchObject({ member: null });
    // Only the token delivered privately to the email owner can authenticate.
    const link = mock.sendEmail.mock.calls[0][2];
    const token = new URLSearchParams(new URL(link).hash.slice(1)).get("token")!;
    await api.account.signIn({ token });
    expect(ctx.res.cookie).toHaveBeenCalledWith(MEMBER_COOKIE, expect.any(String), expect.objectContaining({ httpOnly: true }));
  });
  it("clears access when Stripe changes the price, quantity, or membership metadata", async () => {
    await setupPurchase(); const cookie = await sessionCookie(1);
    sub.metadata = {};
    await expect(caller(false, cookie).api.library.library()).rejects.toThrow("active paid membership");
    expect(db.rows(aiSubscriptions)[0].paidThrough).toBeNull();
    expect(db.rows(aiSubscriptions)[0].status).toBe("invalid_product");
  });
  it("trusts only explicitly allowlisted proxy peers, never arbitrary forwarded addresses", () => {
    const ctx = context();
    ctx.req.socket.remoteAddress = "198.51.100.20";
    ctx.req.headers["x-forwarded-for"] = "203.0.113.99";
    expect(membershipClientAddress(ctx.req)).toBe("198.51.100.20");
    ctx.req.socket.remoteAddress = "127.0.0.1";
    ctx.req.headers["x-forwarded-for"] = "203.0.113.99, 198.51.100.21";
    expect(membershipClientAddress(ctx.req)).toBe("198.51.100.21");
  });
  it("supports the alternate academy domain but denies preview origins in production", () => {
    expect(isMembershipOrigin("https://ritennisacademy.com", false)).toBe(true);
    expect(isMembershipOrigin("https://3000-example.us1.manus.computer", false)).toBe(false);
  });
  it("creates a dedicated live endpoint and saves its returned secret encrypted, never replacing the tennis secret", async () => {
    const originalTennisSecret = process.env.STRIPE_WEBHOOK_SECRET;
    await expect(caller().api.library.connectWebhook()).rejects.toThrow();
    expect(await caller(true).api.library.connectWebhook()).toEqual({ connected: true });
    expect(mock.endpointCreate.mock.calls[0][0].url).toBe("https://tennispromario.com/api/ai-members/stripe-webhook");
    const settings = db.rows(aiMembershipSettings)[0];
    expect(settings.encryptedWebhookSecret).not.toContain("whsec_members_only");
    expect(storedMembershipWebhookSecret(settings)).toBe("whsec_members_only");
    expect(process.env.STRIPE_WEBHOOK_SECRET).toBe(originalTennisSecret);
    expect((await getMembershipReadiness()).ready).toBe(true);
    expect((await getMembershipReadiness()).enabled).toBe(false);
  });
  it("rejects a test-mode endpoint even when the API key string is live", async () => {
    enableReady();
    mock.endpoints.mockResolvedValue({ data: [{ id: "we_members", url: MEMBERSHIP_WEBHOOK_URL, status: "enabled", livemode: false, enabled_events: MEMBERSHIP_EVENTS }] });
    expect((await getMembershipReadiness()).ready).toBe(false);
    expect(mock.checkout).not.toHaveBeenCalled();
  });
  it("validates signatures at the separate membership route, without registering or modifying the tennis webhook", async () => {
    enableReady();
    const app: any = { post: vi.fn() };
    registerMembershipWebhook(app);
    expect(app.post).toHaveBeenCalledTimes(1);
    expect(app.post.mock.calls[0][0]).toBe("/api/ai-members/stripe-webhook");
    const handler = app.post.mock.calls[0][2];
    const req = { body: Buffer.from("{}"), headers: { "stripe-signature": "test-signature" } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn(), send: vi.fn() };
    mock.constructEvent.mockReturnValue({ id: "evt_live", livemode: true, type: "payment_intent.succeeded", data: { object: {} } });
    await handler(req, res);
    expect(mock.constructEvent).toHaveBeenCalledWith(req.body, "test-signature", "whsec_members_only");
    expect(res.json).toHaveBeenCalledWith({ received: true });
    mock.constructEvent.mockImplementation(() => { throw new Error("bad signature"); });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});


describe("live product connection and launch safety", () => {
  it("uses the separate live membership key while preserving platform-managed tennis credentials", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_tennis_not_real");
    vi.stubEnv("AI_MEMBERSHIP_STRIPE_SECRET_KEY", "sk_live_membership_not_real");
    enableReady();
    expect((await getMembershipReadiness()).ready).toBe(true);
    expect(process.env.STRIPE_SECRET_KEY).toBe("sk_test_tennis_not_real");
  });
  it("requires the permanent catalog price before opening enrollment or checkout", async () => {
    enableReady(); mock.catalog.mockRejectedValue(new Error("Missing catalog"));
    expect((await getMembershipReadiness()).ready).toBe(false);
    await expect(caller().api.billing.createCheckout({ email: "coach@example.com", origin })).rejects.toThrow();
    expect(mock.checkout).not.toHaveBeenCalled();
    expect(db.rows(aiCheckoutIntents)).toHaveLength(0);
  });
  it("connects products only for admins and does not open enrollment", async () => {
    await expect(caller().api.library.connectProduct()).rejects.toThrow();
    expect(await caller(true).api.library.connectProduct()).toHaveProperty("priceId", "price_members_monthly");
    expect(db.rows(aiMembershipSettings)).toHaveLength(0);
  });
  it("keeps checkout blocked when Stripe is connected but the welcome sender fails", async () => {
    enableReady(); mock.verifyEmail.mockResolvedValue({ ready: false, provider: null });
    await expect(caller().api.billing.createCheckout({ email: "coach@example.com", origin })).rejects.toThrow();
    expect(mock.checkout).not.toHaveBeenCalled();
  });
});
