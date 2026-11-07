import type Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AI_MEMBERSHIP } from "../shared/aiMembership";

const mock = vi.hoisted(() => ({
  membershipStripe: vi.fn(),
  membershipStripeKey: vi.fn(),
}));
// Never import readiness's DB/email dependency graph or construct a real client.
vi.mock("./aiMembershipReadiness", () => ({
  membershipStripe: mock.membershipStripe,
  membershipStripeKey: mock.membershipStripeKey,
}));
vi.mock("stripe", () => ({
  default: vi.fn(() => {
    throw new Error(
      "Real Stripe construction is forbidden in catalog unit tests"
    );
  }),
}));
import {
  getOrCreateMembershipPrice,
  MEMBERSHIP_CATALOG_PRODUCT_ID,
  MEMBERSHIP_PRICE_LOOKUP_KEY,
} from "./aiMembershipCatalog";

function product(overrides: Record<string, unknown> = {}): Stripe.Product {
  return {
    id: MEMBERSHIP_CATALOG_PRODUCT_ID,
    object: "product",
    active: true,
    livemode: true,
    name: AI_MEMBERSHIP.productName,
    type: "service",
    shippable: false,
    metadata: { type: AI_MEMBERSHIP.type },
    ...overrides,
  } as unknown as Stripe.Product;
}
function price(overrides: Record<string, unknown> = {}): Stripe.Price {
  return {
    id: "price_membership",
    object: "price",
    active: true,
    livemode: true,
    lookup_key: MEMBERSHIP_PRICE_LOOKUP_KEY,
    metadata: { type: AI_MEMBERSHIP.type },
    type: "recurring",
    billing_scheme: "per_unit",
    currency: AI_MEMBERSHIP.currency,
    unit_amount: AI_MEMBERSHIP.amountCents,
    unit_amount_decimal: "2000",
    recurring: {
      interval: "month",
      interval_count: 1,
      usage_type: "licensed",
      meter: null,
      trial_period_days: null,
    },
    transform_quantity: null,
    custom_unit_amount: null,
    tiers_mode: null,
    currency_options: {
      usd: {
        unit_amount: 2000,
        unit_amount_decimal: "2000",
        custom_unit_amount: null,
      },
    },
    product: product(),
    ...overrides,
  } as unknown as Stripe.Price;
}
const page = <T>(data: T[] = [], has_more = false) => ({ data, has_more });
const client = {
  _authenticator: {
    _apiKey: "sk_live_completely_mocked_not_a_real_key" as unknown,
  },
  products: {
    list: vi.fn(),
    create: vi.fn(),
    retrieve: vi.fn(),
    update: vi.fn(),
    del: vi.fn(),
  },
  prices: { list: vi.fn(), create: vi.fn(), update: vi.fn() },
  accounts: { retrieve: vi.fn(), update: vi.fn() },
  checkout: { sessions: { create: vi.fn() } },
  subscriptions: { update: vi.fn() },
  webhookEndpoints: { create: vi.fn(), update: vi.fn() },
};
const stripe = client as unknown as Stripe;
const liveRequest = { apiKey: "sk_live_completely_mocked_not_a_real_key" };

function noWrites() {
  expect(client.products.create).not.toHaveBeenCalled();
  expect(client.prices.create).not.toHaveBeenCalled();
  expect(client.products.update).not.toHaveBeenCalled();
  expect(client.prices.update).not.toHaveBeenCalled();
}
function noOtherMutations() {
  expect(client.products.update).not.toHaveBeenCalled();
  expect(client.products.del).not.toHaveBeenCalled();
  expect(client.prices.update).not.toHaveBeenCalled();
  expect(client.accounts.update).not.toHaveBeenCalled();
  expect(client.checkout.sessions.create).not.toHaveBeenCalled();
  expect(client.subscriptions.update).not.toHaveBeenCalled();
  expect(client.webhookEndpoints.create).not.toHaveBeenCalled();
  expect(client.webhookEndpoints.update).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.resetAllMocks();
  client._authenticator._apiKey = liveRequest.apiKey;
  mock.membershipStripeKey.mockReturnValue(liveRequest.apiKey);
  client.products.list.mockResolvedValue(page());
  client.products.create.mockResolvedValue(product());
  client.products.retrieve.mockResolvedValue(product());
  client.prices.list.mockResolvedValue(page());
  client.prices.create.mockResolvedValue(price());
  mock.membershipStripe.mockReturnValue(stripe);
});

describe("live-only catalog boundary", () => {
  it.each([
    undefined,
    null,
    "",
    "sk_test_mock",
    "rk_test_mock",
    "pk_live_mock",
    "rk_live_mock",
    "sk_live_",
    {},
    "unverifiable",
  ])("rejects credential %j before all API calls", async key => {
    mock.membershipStripeKey.mockReturnValue(key);
    await expect(getOrCreateMembershipPrice(stripe)).rejects.toThrow(
      "live Stripe secret key"
    );
    expect(client.prices.list).not.toHaveBeenCalled();
    expect(client.products.list).not.toHaveBeenCalled();
    noWrites();
  });
  it("does not bypass the live-key check merely because NODE_ENV is test", async () => {
    mock.membershipStripeKey.mockReturnValue("sk_test_mock");
    await expect(getOrCreateMembershipPrice(stripe)).rejects.toThrow(
      "live Stripe secret key"
    );
    noWrites();
  });
  it("permits an explicit injected test-only mock without editing the environment", async () => {
    const envBefore = { ...process.env };
    client._authenticator._apiKey = undefined;
    client.prices.list.mockResolvedValue(page([price()]));
    expect(
      (await getOrCreateMembershipPrice(stripe, { testOnly: true })).livemode
    ).toBe(true);
    expect(client.prices.list.mock.calls[0][1]).toEqual({});
    expect(process.env).toEqual(envBefore);
  });
  it("pins the membership live secret rather than an injected client's tennis/test key", async () => {
    client._authenticator._apiKey = "sk_test_tennis_catalog_mock";
    mock.membershipStripeKey.mockReturnValue("sk_live_membership_only_mock");
    client.prices.list.mockResolvedValue(
      page([price({ product: MEMBERSHIP_CATALOG_PRODUCT_ID })])
    );
    await getOrCreateMembershipPrice(stripe);
    expect(client.prices.list.mock.calls[0][1]).toEqual({
      apiKey: "sk_live_membership_only_mock",
    });
    expect(client.products.retrieve.mock.calls[0][2]).toEqual({
      apiKey: "sk_live_membership_only_mock",
    });
    noWrites();
  });
  it("refuses testOnly without injection before obtaining any real client", async () => {
    await expect(
      getOrCreateMembershipPrice(undefined, { testOnly: true })
    ).rejects.toThrow("injected, fully mocked Stripe");
    expect(mock.membershipStripe).not.toHaveBeenCalled();
    noWrites();
  });
  it("uses membershipStripe when no client is injected and still pins its live key", async () => {
    client.prices.list.mockResolvedValue(
      page([price({ product: MEMBERSHIP_CATALOG_PRODUCT_ID })])
    );
    const result = await getOrCreateMembershipPrice();
    expect(mock.membershipStripe).toHaveBeenCalledTimes(1);
    expect(result.priceId).toBe("price_membership");
    expect(client.products.retrieve).toHaveBeenCalledWith(
      MEMBERSHIP_CATALOG_PRODUCT_ID,
      {},
      liveRequest
    );
  });
  it("propagates missing Stripe configuration without API calls", async () => {
    mock.membershipStripe.mockImplementation(() => {
      throw new Error("Stripe is not configured");
    });
    await expect(getOrCreateMembershipPrice()).rejects.toThrow(
      "Stripe is not configured"
    );
    expect(client.prices.list).not.toHaveBeenCalled();
    noWrites();
  });
  it("testOnly never accepts a test-mode price", async () => {
    client._authenticator._apiKey = "sk_test_mock";
    client.prices.list.mockResolvedValue(page([price({ livemode: false })]));
    await expect(
      getOrCreateMembershipPrice(stripe, { testOnly: true })
    ).rejects.toThrow("catalog conflict");
    noWrites();
  });
});

describe("lookup reuse and fail-closed price validation", () => {
  it("reuses an exact expanded live price without creating or updating anything", async () => {
    client.prices.list.mockResolvedValue(page([price()]));
    const result = await getOrCreateMembershipPrice(stripe);
    expect(result).toEqual({
      productId: MEMBERSHIP_CATALOG_PRODUCT_ID,
      priceId: "price_membership",
      productName: AI_MEMBERSHIP.productName,
      lookupKey: MEMBERSHIP_PRICE_LOOKUP_KEY,
      amountCents: 2000,
      currency: "usd",
      interval: "month",
      intervalCount: 1,
      quantity: 1,
      livemode: true,
      cancelAnytime: true,
      metadata: { type: AI_MEMBERSHIP.type },
    });
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
    expect(client.prices.list).toHaveBeenCalledTimes(1);
    expect(client.prices.list).toHaveBeenCalledWith(
      {
        lookup_keys: [MEMBERSHIP_PRICE_LOOKUP_KEY],
        limit: 2,
        expand: ["data.product", "data.currency_options"],
      },
      liveRequest
    );
    expect(client.products.list).not.toHaveBeenCalled();
    expect(client.products.retrieve).not.toHaveBeenCalled();
    expect(mock.membershipStripe).not.toHaveBeenCalled();
    noWrites();
    noOtherMutations();
  });
  it("retrieves a non-expanded price product before reuse", async () => {
    client.prices.list.mockResolvedValue(
      page([price({ product: "prod_existing_membership" })])
    );
    client.products.retrieve.mockResolvedValue(
      product({ id: "prod_existing_membership" })
    );
    expect((await getOrCreateMembershipPrice(stripe)).productId).toBe(
      "prod_existing_membership"
    );
    expect(client.products.retrieve).toHaveBeenCalledWith(
      "prod_existing_membership",
      {},
      liveRequest
    );
    noWrites();
  });
  it("rejects a retrieved product with an unrelated ID", async () => {
    client.prices.list.mockResolvedValue(
      page([price({ product: "prod_expected" })])
    );
    await expect(getOrCreateMembershipPrice(stripe)).rejects.toThrow(
      "ID does not match"
    );
    noWrites();
  });
  it.each([
    ["inactive", { active: false }],
    ["missing active", { active: undefined }],
    ["test mode", { livemode: false }],
    ["missing mode", { livemode: undefined }],
    ["wrong object", { object: "plan" }],
    ["empty ID", { id: "" }],
    ["wrong lookup key", { lookup_key: "tennis_camp" }],
    ["missing lookup key", { lookup_key: null }],
    ["wrong metadata", { metadata: { type: "tennis_lesson" } }],
    ["missing metadata", { metadata: {} }],
    ["wrong amount", { unit_amount: 1999 }],
    ["null amount", { unit_amount: null }],
    ["string amount", { unit_amount: "2000" }],
    ["wrong decimal", { unit_amount_decimal: "2000.01" }],
    ["nondecimal amount", { unit_amount_decimal: "2e3" }],
    ["wrong currency", { currency: "eur" }],
    ["uppercase currency", { currency: "USD" }],
    ["one-time price", { type: "one_time" }],
    ["tiered scheme", { billing_scheme: "tiered" }],
    ["nonrecurring price", { recurring: null }],
    [
      "yearly",
      {
        recurring: {
          interval: "year",
          interval_count: 1,
          usage_type: "licensed",
        },
      },
    ],
    [
      "multiple months",
      {
        recurring: {
          interval: "month",
          interval_count: 2,
          usage_type: "licensed",
        },
      },
    ],
    [
      "missing month count",
      { recurring: { interval: "month", usage_type: "licensed" } },
    ],
    [
      "metered",
      {
        recurring: {
          interval: "month",
          interval_count: 1,
          usage_type: "metered",
        },
      },
    ],
    [
      "missing usage mode",
      { recurring: { interval: "month", interval_count: 1 } },
    ],
    [
      "meter attached",
      {
        recurring: {
          interval: "month",
          interval_count: 1,
          usage_type: "licensed",
          meter: "mtr_1",
        },
      },
    ],
    [
      "trial days",
      {
        recurring: {
          interval: "month",
          interval_count: 1,
          usage_type: "licensed",
          trial_period_days: 7,
        },
      },
    ],
    [
      "quantity transform",
      { transform_quantity: { divide_by: 5, round: "up" } },
    ],
    ["customer-selected amount", { custom_unit_amount: { minimum: 100 } }],
    ["tier mode", { tiers_mode: "volume" }],
    ["tiers", { tiers: [{ unit_amount: 2000 }] }],
    [
      "alternate currency",
      { currency_options: { eur: { unit_amount: 2000 } } },
    ],
    [
      "alternate USD amount",
      { currency_options: { usd: { unit_amount: 2100 } } },
    ],
    [
      "USD decimal mismatch",
      {
        currency_options: {
          usd: { unit_amount: 2000, unit_amount_decimal: "2001" },
        },
      },
    ],
    [
      "adjustable USD amount",
      {
        currency_options: {
          usd: { unit_amount: 2000, custom_unit_amount: { minimum: 10 } },
        },
      },
    ],
    [
      "USD tiers",
      {
        currency_options: {
          usd: { unit_amount: 2000, tiers: [{ unit_amount: 1000 }] },
        },
      },
    ],
  ])(
    "fails closed on %s without silently replacing",
    async (_name, overrides) => {
      client.prices.list.mockResolvedValue(
        page([price(overrides as Record<string, unknown>)])
      );
      await expect(getOrCreateMembershipPrice(stripe)).rejects.toThrow(
        "catalog conflict"
      );
      expect(client.products.list).not.toHaveBeenCalled();
      noWrites();
    }
  );
  it.each(["2000", "2000.0", "2000.000000000000", null, undefined])(
    "accepts exact optional decimal %j",
    async decimal => {
      client.prices.list.mockResolvedValue(
        page([price({ unit_amount_decimal: decimal })])
      );
      expect((await getOrCreateMembershipPrice(stripe)).amountCents).toBe(2000);
      noWrites();
    }
  );
  it("accepts an exact fixed price without optional currency options", async () => {
    client.prices.list.mockResolvedValue(
      page([price({ currency_options: undefined })])
    );
    expect((await getOrCreateMembershipPrice(stripe)).currency).toBe("usd");
  });
  it.each([
    page([price(), price({ id: "price_duplicate" })]),
    page([price()], true),
  ])("rejects ambiguous lookup result", async listed => {
    client.prices.list.mockResolvedValue(listed);
    await expect(getOrCreateMembershipPrice(stripe)).rejects.toThrow(
      "multiple prices"
    );
    noWrites();
  });
  it("propagates list failure without provisioning a replacement", async () => {
    client.prices.list.mockRejectedValue(new Error("authentication failed"));
    await expect(getOrCreateMembershipPrice(stripe)).rejects.toThrow(
      "authentication failed"
    );
    noWrites();
  });
});

describe("product identity guards", () => {
  const invalidProducts: [string, Record<string, unknown>][] = [
    ["inactive", { active: false }],
    ["missing active", { active: undefined }],
    ["test mode", { livemode: false }],
    ["missing mode", { livemode: undefined }],
    ["empty name", { name: "" }],
    ["wrong name", { name: "Tennis Lessons" }],
    ["whitespace name", { name: ` ${AI_MEMBERSHIP.productName} ` }],
    ["empty ID", { id: "" }],
    ["wrong metadata", { metadata: { type: "tennis_camp" } }],
    ["missing metadata", { metadata: {} }],
    ["deleted", { deleted: true }],
    ["wrong object", { object: "customer" }],
    ["physical product", { type: "good" }],
    ["shipped product", { shippable: true }],
  ];
  it.each(invalidProducts)(
    "rejects %s product on the lookup path",
    async (_name, overrides) => {
      client.prices.list.mockResolvedValue(
        page([price({ product: product(overrides) })])
      );
      await expect(getOrCreateMembershipPrice(stripe)).rejects.toThrow(
        "catalog conflict"
      );
      noWrites();
    }
  );
  it.each(invalidProducts)(
    "rejects %s product during fallback instead of changing it",
    async (_name, overrides) => {
      client.products.list.mockResolvedValue(page([product(overrides)]));
      await expect(getOrCreateMembershipPrice(stripe)).rejects.toThrow(
        "catalog conflict"
      );
      noWrites();
    }
  );
  it("rejects a missing product reference", async () => {
    client.prices.list.mockResolvedValue(page([price({ product: null })]));
    await expect(getOrCreateMembershipPrice(stripe)).rejects.toThrow(
      "no product"
    );
    noWrites();
  });
  it("rejects a deleted retrieved product", async () => {
    client.prices.list.mockResolvedValue(
      page([price({ product: "prod_deleted" })])
    );
    client.products.retrieve.mockResolvedValue({
      id: "prod_deleted",
      object: "product",
      deleted: true,
    });
    await expect(getOrCreateMembershipPrice(stripe)).rejects.toThrow(
      "catalog conflict"
    );
    noWrites();
  });
  it("does not adopt a same-name tennis product lacking AI type metadata", async () => {
    client.products.list.mockResolvedValue(
      page([
        product({ id: "prod_tennis", metadata: { type: "tennis_payment" } }),
      ])
    );
    await expect(getOrCreateMembershipPrice(stripe)).rejects.toThrow(
      "catalog conflict"
    );
    noWrites();
  });
});

describe("dedicated, idempotent provisioning", () => {
  it("creates only the exact dedicated AI product and fixed recurring price with stable keys", async () => {
    const envBefore = { ...process.env };
    const result = await getOrCreateMembershipPrice(stripe);
    expect(result.amountCents).toBe(2000);
    expect(client.products.create).toHaveBeenCalledTimes(1);
    expect(client.products.create).toHaveBeenCalledWith(
      {
        id: MEMBERSHIP_CATALOG_PRODUCT_ID,
        name: AI_MEMBERSHIP.productName,
        active: true,
        type: "service",
        shippable: false,
        unit_label: "membership",
        description:
          "$20.00 USD/month. Cancel anytime. AI membership only; separate from tennis lessons, camps, bookings and donations.",
        statement_descriptor: "AI TENNIS PRO",
        marketing_features: [{ name: "Cancel anytime" }],
        metadata: {
          type: AI_MEMBERSHIP.type,
          catalog_lookup_key: MEMBERSHIP_PRICE_LOOKUP_KEY,
          amount_cents: "2000",
          currency: "usd",
          interval: "month",
          cancel_anytime: "true",
          scope: "ai_membership_only",
        },
      },
      {
        ...liveRequest,
        idempotencyKey: `${MEMBERSHIP_PRICE_LOOKUP_KEY}:product`,
      }
    );
    expect(client.prices.create).toHaveBeenCalledTimes(1);
    expect(client.prices.create).toHaveBeenCalledWith(
      {
        product: MEMBERSHIP_CATALOG_PRODUCT_ID,
        active: true,
        currency: "usd",
        unit_amount: 2000,
        recurring: {
          interval: "month",
          interval_count: 1,
          usage_type: "licensed",
        },
        billing_scheme: "per_unit",
        lookup_key: MEMBERSHIP_PRICE_LOOKUP_KEY,
        transfer_lookup_key: false,
        nickname: "$20.00 USD / month — AI membership only",
        metadata: { type: AI_MEMBERSHIP.type },
        expand: ["product", "currency_options"],
      },
      {
        ...liveRequest,
        idempotencyKey: `${MEMBERSHIP_PRICE_LOOKUP_KEY}:price:${MEMBERSHIP_CATALOG_PRODUCT_ID}`,
      }
    );
    expect(client.products.list).toHaveBeenCalledWith(
      { limit: 100 },
      liveRequest
    );
    expect(client.prices.list).toHaveBeenCalledTimes(2);
    expect(process.env).toEqual(envBefore);
    noOtherMutations();
  });
  it("reuses an exact pre-existing AI product while ignoring tennis catalog products", async () => {
    const existing = product({ id: "prod_ai_existing" });
    const tennis = product({
      id: "prod_tennis",
      name: "Tennis Camp",
      metadata: { type: "tennis_camp" },
    });
    client.products.list.mockResolvedValue(page([tennis, existing]));
    client.prices.create.mockResolvedValue(price({ product: existing }));
    expect((await getOrCreateMembershipPrice(stripe)).productId).toBe(
      existing.id
    );
    expect(client.products.create).not.toHaveBeenCalled();
    expect(client.prices.create.mock.calls[0][0].product).toBe(existing.id);
    noOtherMutations();
  });
  it("finds an existing matching product on a later page", async () => {
    const tennis = product({
      id: "prod_tennis",
      name: "Tennis Lessons",
      metadata: { type: "tennis_lesson" },
    });
    client.products.list
      .mockResolvedValueOnce(page([tennis], true))
      .mockResolvedValueOnce(page([product()]));
    await getOrCreateMembershipPrice(stripe);
    expect(client.products.list).toHaveBeenNthCalledWith(
      2,
      { limit: 100, starting_after: "prod_tennis" },
      liveRequest
    );
    expect(client.products.create).not.toHaveBeenCalled();
  });
  it("rejects duplicate matching products across pages", async () => {
    client.products.list
      .mockResolvedValueOnce(page([product()], true))
      .mockResolvedValueOnce(page([product({ id: "prod_duplicate" })]));
    await expect(getOrCreateMembershipPrice(stripe)).rejects.toThrow(
      "multiple membership products"
    );
    noWrites();
  });
  it("rejects a name-only collision instead of creating a second same-name product", async () => {
    client.products.list.mockResolvedValue(
      page([product({ id: "prod_manual", metadata: {} })])
    );
    await expect(getOrCreateMembershipPrice(stripe)).rejects.toThrow(
      "catalog conflict"
    );
    noWrites();
  });
  it("rejects an unrelated product using the deterministic ID", async () => {
    client.products.list.mockResolvedValue(
      page([
        product({ name: "Tennis Camp", metadata: { type: "tennis_camp" } }),
      ])
    );
    await expect(getOrCreateMembershipPrice(stripe)).rejects.toThrow(
      "catalog conflict"
    );
    noWrites();
  });
  it.each([
    page([], true),
    page([product({ id: "prod_tennis", name: "Camp", metadata: {} })], true),
  ])("rejects empty or cycling product pagination", async listed => {
    client.products.list.mockResolvedValue(listed);
    await expect(getOrCreateMembershipPrice(stripe)).rejects.toThrow(
      "invalid product pagination"
    );
    noWrites();
  });
  it("propagates product-list failures without creating a duplicate", async () => {
    client.products.list.mockRejectedValue(new Error("catalog unavailable"));
    await expect(getOrCreateMembershipPrice(stripe)).rejects.toThrow(
      "catalog unavailable"
    );
    noWrites();
  });
  it("reuses a concurrent product after an ID collision/lost response", async () => {
    client.products.create.mockRejectedValue(
      new Error("product already exists")
    );
    expect((await getOrCreateMembershipPrice(stripe)).productId).toBe(
      MEMBERSHIP_CATALOG_PRODUCT_ID
    );
    expect(client.products.retrieve).toHaveBeenCalledWith(
      MEMBERSHIP_CATALOG_PRODUCT_ID,
      {},
      liveRequest
    );
    expect(client.products.create).toHaveBeenCalledTimes(1);
    noOtherMutations();
  });
  it("refuses an invalid colliding product without price creation", async () => {
    client.products.create.mockRejectedValue(new Error("ID collision"));
    client.products.retrieve.mockResolvedValue(product({ active: false }));
    await expect(getOrCreateMembershipPrice(stripe)).rejects.toThrow(
      "catalog conflict"
    );
    expect(client.prices.create).not.toHaveBeenCalled();
    noOtherMutations();
  });
  it("preserves the original product-create error when recovery cannot retrieve a product", async () => {
    const error = new Error("permission denied");
    client.products.create.mockRejectedValue(error);
    client.products.retrieve.mockRejectedValue(new Error("resource missing"));
    await expect(getOrCreateMembershipPrice(stripe)).rejects.toBe(error);
    expect(client.prices.create).not.toHaveBeenCalled();
  });
  it.each([
    { active: false },
    { livemode: false },
    { id: "prod_wrong" },
    { name: "" },
    { metadata: {} },
  ])("validates newly created product response %j", async overrides => {
    client.products.create.mockResolvedValue(product(overrides));
    await expect(getOrCreateMembershipPrice(stripe)).rejects.toThrow(
      "catalog conflict"
    );
    expect(client.prices.create).not.toHaveBeenCalled();
    noOtherMutations();
  });
  it("adopts a valid price published by a concurrent creator before price creation", async () => {
    client.prices.list
      .mockResolvedValueOnce(page())
      .mockResolvedValueOnce(page([price()]));
    expect((await getOrCreateMembershipPrice(stripe)).priceId).toBe(
      "price_membership"
    );
    expect(client.prices.create).not.toHaveBeenCalled();
  });
  it("fails closed if a concurrent creator publishes a wrong price", async () => {
    client.prices.list
      .mockResolvedValueOnce(page())
      .mockResolvedValueOnce(page([price({ unit_amount: 100 })]));
    await expect(getOrCreateMembershipPrice(stripe)).rejects.toThrow(
      "catalog conflict"
    );
    expect(client.prices.create).not.toHaveBeenCalled();
  });
  it("recovers a valid price after a lookup-key race or lost create response", async () => {
    client.prices.list
      .mockResolvedValueOnce(page())
      .mockResolvedValueOnce(page())
      .mockResolvedValueOnce(page([price()]));
    client.prices.create.mockRejectedValue(
      new Error("lookup_key already exists")
    );
    expect((await getOrCreateMembershipPrice(stripe)).priceId).toBe(
      "price_membership"
    );
    expect(client.prices.create).toHaveBeenCalledTimes(1);
    noOtherMutations();
  });
  it("does not adopt a conflicting price while recovering from creation failure", async () => {
    client.prices.list
      .mockResolvedValueOnce(page())
      .mockResolvedValueOnce(page())
      .mockResolvedValueOnce(page([price({ livemode: false })]));
    client.prices.create.mockRejectedValue(
      new Error("lookup_key already exists")
    );
    await expect(getOrCreateMembershipPrice(stripe)).rejects.toThrow(
      "catalog conflict"
    );
    noOtherMutations();
  });
  it("propagates price-create failure if no winner exists", async () => {
    const error = new Error("price creation unavailable");
    client.prices.create.mockRejectedValue(error);
    await expect(getOrCreateMembershipPrice(stripe)).rejects.toBe(error);
    expect(client.prices.create).toHaveBeenCalledTimes(1);
    noOtherMutations();
  });
  it.each([
    { active: false },
    { livemode: false },
    { unit_amount: 1900 },
    { currency: "eur" },
    { lookup_key: "other" },
    { metadata: {} },
  ])("validates newly created price response %j", async overrides => {
    client.prices.create.mockResolvedValue(price(overrides));
    await expect(getOrCreateMembershipPrice(stripe)).rejects.toThrow(
      "catalog conflict"
    );
    expect(client.prices.create).toHaveBeenCalledTimes(1);
    noOtherMutations();
  });
  it("rejects a newly created price assigned to another valid AI product", async () => {
    client.prices.create.mockResolvedValue(
      price({ product: product({ id: "prod_other_ai" }) })
    );
    await expect(getOrCreateMembershipPrice(stripe)).rejects.toThrow(
      "different product"
    );
    noOtherMutations();
  });
  it("repeated calls use stable idempotency keys even if mocked listing remains empty", async () => {
    await getOrCreateMembershipPrice(stripe);
    await getOrCreateMembershipPrice(stripe);
    expect(client.products.create.mock.calls[0]).toEqual(
      client.products.create.mock.calls[1]
    );
    expect(client.prices.create.mock.calls[0]).toEqual(
      client.prices.create.mock.calls[1]
    );
    noOtherMutations();
  });
  it("a subsequent visible lookup avoids all additional provisioning", async () => {
    await getOrCreateMembershipPrice(stripe);
    client.prices.list.mockResolvedValue(page([price()]));
    await getOrCreateMembershipPrice(stripe);
    expect(client.products.create).toHaveBeenCalledTimes(1);
    expect(client.prices.create).toHaveBeenCalledTimes(1);
    noOtherMutations();
  });
});


describe("read-only catalog readiness", () => {
  it("fails closed on a missing price without creating any product", async () => {
    await expect(getOrCreateMembershipPrice(stripe, { readOnly: true })).rejects.toThrow("has not been connected");
    noWrites();
    expect(client.products.list).not.toHaveBeenCalled();
  });
  it("returns the connected price without making any writes", async () => {
    client.prices.list.mockResolvedValue(page([price()]));
    expect(await getOrCreateMembershipPrice(stripe, { readOnly: true })).toHaveProperty("priceId", "price_membership");
    noWrites();
    noOtherMutations();
  });
});
