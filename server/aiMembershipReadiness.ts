import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { aiMembershipSettings } from "../drizzle/schema";
import { membershipDb, encryptGuide, decryptGuide } from "./aiMembershipSecurity";
import { verifyMembershipEmail } from "./aiMembershipEmail";
import { getOrCreateMembershipPrice, type MembershipCatalogPrice } from "./aiMembershipCatalog";

export const MEMBERSHIP_EVENTS = ["checkout.session.completed", "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted", "invoice.paid", "invoice.payment_failed"];
export const MEMBERSHIP_WEBHOOK_URL = "https://tennispromario.com/api/ai-members/stripe-webhook";
export function membershipStripeKey() {
  return process.env.AI_MEMBERSHIP_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || "";
}
export function membershipStripe() {
  const key = membershipStripeKey();
  if (!key) throw new Error("Stripe is not configured");
  return new Stripe(key, { apiVersion: "2026-02-25.clover" as any });
}
export async function membershipWebhookSettings() {
  const db = await membershipDb();
  const [settings] = await db.select().from(aiMembershipSettings).where(eq(aiMembershipSettings.id, 1)).limit(1);
  return settings;
}
export function storedMembershipWebhookSecret(settings: NonNullable<Awaited<ReturnType<typeof membershipWebhookSettings>>>) {
  if (!settings.encryptedWebhookSecret) throw new Error("Membership webhook is not connected");
  return decryptGuide(Buffer.from(settings.encryptedWebhookSecret, "base64")).toString();
}
export async function getMembershipReadiness() {
  const blockers: string[] = [];
  let settings: Awaited<ReturnType<typeof membershipWebhookSettings>> | undefined = undefined;
  let catalog: MembershipCatalogPrice | null = null;
  try { settings = await membershipWebhookSettings(); } catch { blockers.push("Membership database is unavailable or its migration is missing."); }
  try {
    const sample = Buffer.from("membership-encryption-check");
    if (!decryptGuide(encryptGuide(sample)).equals(sample)) throw new Error("Encryption unavailable");
  } catch { blockers.push("The persistent library encryption secret is missing."); }
  if (!membershipStripeKey().startsWith("sk_live_")) {
    blockers.push("Stripe is in test mode. Finish Stripe business activation and connect the live secret key before accepting real payments.");
  } else {
    try {
      const stripe = membershipStripe();
      const account = await stripe.accounts.retrieve();
      if (!account.charges_enabled || !account.details_submitted) blockers.push("Stripe has not enabled payments. Complete its business and payout-account verification.");
      const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
      const endpoint = endpoints.data.find(e => e.id === settings?.stripeWebhookEndpointId && e.url === MEMBERSHIP_WEBHOOK_URL && e.status === "enabled" && e.livemode);
      if (!endpoint || settings?.stripeWebhookAccountId !== account.id || !MEMBERSHIP_EVENTS.every(type => endpoint.enabled_events.includes("*") || endpoint.enabled_events.includes(type as any))) {
        blockers.push("After connecting the live Stripe key, use Connect membership webhook here. This creates a separate endpoint on the correct account without changing tennis payment webhooks.");
      }
      try { catalog = await getOrCreateMembershipPrice(stripe, { readOnly: true }); }
      catch { blockers.push("The permanent live $20/month product needs attention. Use Connect membership product, or check its price in Stripe."); }
    } catch { blockers.push("Stripe authentication or account checks failed."); }
  }
  try { if (!settings || !storedMembershipWebhookSecret(settings).startsWith("whsec_")) throw new Error("Missing secret"); }
  catch { blockers.push("The dedicated membership webhook is not connected securely. Use Connect membership webhook after switching Stripe to live mode."); }
  const email = await verifyMembershipEmail();
  if (!email.ready) blockers.push("Welcome emails cannot be sent. Reconnect Gmail with a current Google App Password, or connect a valid Resend key and verified sender domain.");
  return { ready: blockers.length === 0, enabled: !!settings?.checkoutEnabled, blockers, emailProvider: email.provider, catalog };
}

export async function connectMembershipWebhook() {
  if (!membershipStripeKey().startsWith("sk_live_")) throw new Error("Connect an activated live Stripe key first.");
  const stripe = membershipStripe();
  const account = await stripe.accounts.retrieve();
  if (!account.charges_enabled || !account.details_submitted) throw new Error("Complete Stripe activation first.");
  const settings = await membershipWebhookSettings();
  if (settings?.stripeWebhookAccountId === account.id && settings.stripeWebhookEndpointId && settings.encryptedWebhookSecret) {
    const endpoint = await stripe.webhookEndpoints.retrieve(settings.stripeWebhookEndpointId);
    if (endpoint.url === MEMBERSHIP_WEBHOOK_URL && endpoint.status === "enabled" && endpoint.livemode && MEMBERSHIP_EVENTS.every(type => endpoint.enabled_events.includes("*") || endpoint.enabled_events.includes(type as any))) {
      storedMembershipWebhookSecret(settings); return { connected: true };
    }
  }
  // The secret returned by Stripe is tied to THIS endpoint and THIS account.
  // It is encrypted at rest, never sent to the browser, and never replaces the
  // existing STRIPE_WEBHOOK_SECRET used by tennis bookings/donations.
  const endpoint = await stripe.webhookEndpoints.create({ url: MEMBERSHIP_WEBHOOK_URL, enabled_events: MEMBERSHIP_EVENTS as any, api_version: "2026-02-25.clover", description: "AI for the Working Tennis Pro membership only" });
  if (!endpoint.secret || !endpoint.livemode) throw new Error("Stripe did not create a live membership endpoint.");
  const db = await membershipDb();
  const values = { stripeWebhookEndpointId: endpoint.id, stripeWebhookAccountId: account.id, encryptedWebhookSecret: encryptGuide(Buffer.from(endpoint.secret)).toString("base64") };
  await db.insert(aiMembershipSettings).values({ id: 1, ...values }).onDuplicateKeyUpdate({ set: values });
  return { connected: true };
}
