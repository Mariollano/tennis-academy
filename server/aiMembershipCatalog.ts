import type Stripe from "stripe";
import { AI_MEMBERSHIP } from "../shared/aiMembership";
import { membershipStripe, membershipStripeKey } from "./aiMembershipReadiness";

export const MEMBERSHIP_PRICE_LOOKUP_KEY = "ai_working_tennis_pro_monthly_v1";
export const MEMBERSHIP_CATALOG_PRODUCT_ID =
  "prod_ai_working_tennis_pro_membership_v1";

export interface MembershipCatalogPrice {
  productId: string;
  priceId: string;
  productName: typeof AI_MEMBERSHIP.productName;
  lookupKey: typeof MEMBERSHIP_PRICE_LOOKUP_KEY;
  amountCents: typeof AI_MEMBERSHIP.amountCents;
  currency: typeof AI_MEMBERSHIP.currency;
  interval: typeof AI_MEMBERSHIP.interval;
  intervalCount: 1;
  quantity: 1;
  livemode: true;
  cancelAnytime: true;
  metadata: { type: typeof AI_MEMBERSHIP.type };
}

export interface MembershipCatalogOptions {
  /** Injected, fully mocked Stripe only; never enables test-mode catalog objects. */
  testOnly?: boolean;
  /** Verify an existing catalog only; never create products/prices. */
  readOnly?: boolean;
}

function conflict(message: string): never {
  throw new Error(
    `AI membership catalog conflict: ${message}. No existing catalog entry was changed.`
  );
}

function validProduct(
  product: Stripe.Product | Stripe.DeletedProduct
): Stripe.Product {
  if (
    !product ||
    product.deleted ||
    product.object !== "product" ||
    !product.id ||
    !("active" in product) ||
    product.active !== true ||
    product.livemode !== true ||
    product.name !== AI_MEMBERSHIP.productName ||
    product.metadata?.type !== AI_MEMBERSHIP.type ||
    product.type !== "service" ||
    product.shippable === true
  ) {
    conflict(
      "product must be an active, live AI membership service with the exact name and type metadata"
    );
  }
  return product;
}

function validAmountDecimal(decimal: string | null | undefined): boolean {
  return (
    decimal == null ||
    new RegExp(`^${AI_MEMBERSHIP.amountCents}(?:\\.0{1,12})?$`).test(decimal)
  );
}

function validPrice(price: Stripe.Price): void {
  const recurring = price?.recurring;
  if (
    !price ||
    price.object !== "price" ||
    !price.id ||
    price.active !== true ||
    price.livemode !== true ||
    price.lookup_key !== MEMBERSHIP_PRICE_LOOKUP_KEY ||
    price.metadata?.type !== AI_MEMBERSHIP.type ||
    price.type !== "recurring" ||
    price.billing_scheme !== "per_unit" ||
    price.unit_amount !== AI_MEMBERSHIP.amountCents ||
    !validAmountDecimal(price.unit_amount_decimal) ||
    price.currency !== AI_MEMBERSHIP.currency ||
    recurring?.interval !== AI_MEMBERSHIP.interval ||
    recurring.interval_count !== 1 ||
    recurring.usage_type !== "licensed" ||
    recurring.meter != null ||
    recurring.trial_period_days != null ||
    price.transform_quantity != null ||
    price.custom_unit_amount != null ||
    price.tiers_mode != null ||
    (price.tiers?.length ?? 0) !== 0
  ) {
    conflict(
      "price must be active and live, exactly 2000 cents USD each month, licensed and fixed per unit without trials or quantity transformations"
    );
  }
  // Explicitly expand currency_options so alternate/customer-defined amounts cannot hide.
  for (const [currency, option] of Object.entries(
    price.currency_options ?? {}
  )) {
    if (
      currency !== AI_MEMBERSHIP.currency ||
      option.unit_amount !== AI_MEMBERSHIP.amountCents ||
      !validAmountDecimal(option.unit_amount_decimal) ||
      option.custom_unit_amount != null ||
      (option.tiers?.length ?? 0) !== 0
    ) {
      conflict(
        "alternate currency or adjustable amount options are not permitted"
      );
    }
  }
}

/**
 * Provision only the dedicated AI catalog, never tennis products or global settings.
 * Does not enable checkout, verify email, grant access, or change subscriptions.
 * Caller must retain all existing readiness/access gates and use quantity: 1.
 * Cancel-anytime is descriptive here; subscription cancellation is a separate flow.
 */
export async function getOrCreateMembershipPrice(
  stripe?: Stripe,
  options: MembershipCatalogOptions = {}
): Promise<MembershipCatalogPrice> {
  if (options.testOnly && (process.env.NODE_ENV !== "test" || !stripe)) {
    throw new Error(
      "testOnly requires an injected, fully mocked Stripe client in NODE_ENV=test."
    );
  }
  let request: Stripe.RequestOptions = {};
  if (!options.testOnly) {
    // The membership secret may be separate from platform-managed tennis keys.
    // Pin it on every request, including calls through an injected client.
    const key = membershipStripeKey();
    if (typeof key !== "string" || !/^sk_live_.+/.test(key)) {
      throw new Error(
        "AI membership catalog requires a live Stripe secret key; test or unverifiable credentials are refused."
      );
    }
    request = { apiKey: key };
  }
  const client = stripe ?? membershipStripe();

  const lookup = async (): Promise<Stripe.Price | undefined> => {
    // Do not filter active: an archived/wrong entry must block, not be replaced.
    const listed = await client.prices.list(
      {
        lookup_keys: [MEMBERSHIP_PRICE_LOOKUP_KEY],
        limit: 2,
        expand: ["data.product", "data.currency_options"],
      },
      request
    );
    if (listed.has_more || listed.data.length > 1)
      conflict("multiple prices claim the membership lookup key");
    const price = listed.data[0];
    if (price) validPrice(price);
    return price;
  };
  const productFor = async (price: Stripe.Price): Promise<Stripe.Product> => {
    const reference = price.product;
    if (!reference) conflict("price has no product");
    const product = validProduct(
      typeof reference === "string"
        ? await client.products.retrieve(reference, {}, request)
        : reference
    );
    if (typeof reference === "string" && product.id !== reference)
      conflict("retrieved product ID does not match the price");
    return product;
  };
  const result = (
    product: Stripe.Product,
    price: Stripe.Price
  ): MembershipCatalogPrice => ({
    productId: product.id,
    priceId: price.id,
    productName: AI_MEMBERSHIP.productName,
    lookupKey: MEMBERSHIP_PRICE_LOOKUP_KEY,
    amountCents: AI_MEMBERSHIP.amountCents,
    currency: AI_MEMBERSHIP.currency,
    interval: AI_MEMBERSHIP.interval,
    intervalCount: 1,
    quantity: 1,
    livemode: true,
    cancelAnytime: true,
    metadata: { type: AI_MEMBERSHIP.type },
  });

  const existing = await lookup();
  if (existing) return result(await productFor(existing), existing);
  if (options.readOnly) throw new Error("The live $20/month membership product has not been connected yet.");

  // List (not eventually-consistent search), including inactive products and all
  // pages. Exact name alone is never enough to adopt a tennis payment product.
  let product: Stripe.Product | undefined;
  let cursor: string | undefined;
  const cursors = new Set<string>();
  do {
    const page = await client.products.list(
      { limit: 100, ...(cursor ? { starting_after: cursor } : {}) },
      request
    );
    for (const candidate of page.data) {
      if (
        candidate.id === MEMBERSHIP_CATALOG_PRODUCT_ID ||
        candidate.metadata?.type === AI_MEMBERSHIP.type ||
        candidate.name === AI_MEMBERSHIP.productName
      ) {
        const match = validProduct(candidate);
        if (product)
          conflict("multiple membership products require manual review");
        product = match;
      }
    }
    if (!page.has_more) break;
    const next = page.data.at(-1)?.id;
    if (!next || cursors.has(next)) conflict("invalid product pagination");
    cursors.add(next);
    cursor = next;
  } while (true);

  if (!product) {
    // Deterministic ID prevents duplicate products even after Stripe expires
    // idempotency records. Never update/reactivate a product on a collision.
    try {
      product = await client.products.create(
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
            amount_cents: String(AI_MEMBERSHIP.amountCents),
            currency: AI_MEMBERSHIP.currency,
            interval: AI_MEMBERSHIP.interval,
            cancel_anytime: "true",
            scope: "ai_membership_only",
          },
        },
        { ...request, idempotencyKey: `${MEMBERSHIP_PRICE_LOOKUP_KEY}:product` }
      );
    } catch (error) {
      // A concurrent creator or lost response may have already saved this ID.
      try {
        product = await client.products.retrieve(
          MEMBERSHIP_CATALOG_PRODUCT_ID,
          {},
          request
        );
      } catch {
        throw error;
      }
    }
    if (product.id !== MEMBERSHIP_CATALOG_PRODUCT_ID)
      conflict("created product ID is not the dedicated membership ID");
    product = validProduct(product);
  }

  // Recheck after product provisioning to resolve a concurrent price creator.
  const raced = await lookup();
  if (raced) return result(await productFor(raced), raced);
  let price: Stripe.Price;
  try {
    price = await client.prices.create(
      {
        product: product.id,
        active: true,
        currency: AI_MEMBERSHIP.currency,
        unit_amount: AI_MEMBERSHIP.amountCents,
        recurring: {
          interval: AI_MEMBERSHIP.interval,
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
        ...request,
        idempotencyKey: `${MEMBERSHIP_PRICE_LOOKUP_KEY}:price:${product.id}`,
      }
    );
  } catch (error) {
    // Lookup uniqueness may win over idempotency during concurrent requests.
    const winner = await lookup();
    if (!winner) throw error;
    return result(await productFor(winner), winner);
  }
  validPrice(price);
  const pricedProduct = await productFor(price);
  if (pricedProduct.id !== product.id)
    conflict("created price references a different product");
  return result(pricedProduct, price);
}
