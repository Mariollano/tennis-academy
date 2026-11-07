import { describe, expect, it } from "vitest";
import Stripe from "stripe";
import { verifyMembershipEmail } from "./aiMembershipEmail";
import { membershipStripeKey } from "./aiMembershipReadiness";

// Deliberate, read-only provider checks. No products, customers, subscriptions,
// test people, emails, or payment records are created by this file.
// Run explicitly after the owner updates the project's secure credentials.
const runConnections = process.env.VERIFY_AI_MEMBERSHIP_CONNECTIONS === "1";
describe.skipIf(!runConnections)("real membership connection verification (read only)", () => {
  it("authenticates an activated LIVE Stripe account", async () => {
    const key = membershipStripeKey();
    expect(key.startsWith("sk_live_"), "Supply a LIVE Stripe secret key, not the sandbox/test key").toBe(true);
    const stripe = new Stripe(key);
    const account = await stripe.accounts.retrieve();
    expect(account.charges_enabled, "Finish Stripe account activation before opening membership checkout").toBe(true);
    expect(account.details_submitted, "Complete the Stripe business verification details").toBe(true);
  }, 30000);
  it("can authenticate the configured welcome-email sender", async () => {
    const result = await verifyMembershipEmail();
    expect(result.ready, "Restore the Gmail App Password or a verified Resend sender before accepting membership payments").toBe(true);
    expect(["gmail", "resend"]).toContain(result.provider);
  }, 40000);
});
