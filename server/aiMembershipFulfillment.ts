import type Stripe from "stripe";
import { and, eq, gt } from "drizzle-orm";
import { aiMembers, aiSubscriptions, aiCheckoutIntents } from "../drizzle/schema";
import { AI_MEMBERSHIP, normalizeMemberEmail, subscriptionGrantsAccess } from "../shared/aiMembership";
import { membershipDb, createLoginToken } from "./aiMembershipSecurity";
import { sendMemberEmail } from "./aiMembershipEmail";
import { membershipStripe } from "./aiMembershipReadiness";

export function isMembershipSubscription(sub: Stripe.Subscription) {
  const item = sub.items.data[0];
  return sub.metadata?.type === AI_MEMBERSHIP.type && sub.items.data.length === 1 && item.quantity === 1 &&
    item.price.currency === AI_MEMBERSHIP.currency && item.price.unit_amount === AI_MEMBERSHIP.amountCents &&
    item.price.recurring?.interval === "month" && item.price.recurring.interval_count === 1;
}
export function membershipPaidThrough(sub: Stripe.Subscription) {
  const invoice = sub.latest_invoice as Stripe.Invoice | null;
  const end = sub.items.data[0]?.current_period_end;
  if (sub.status !== "active" || !invoice || typeof invoice === "string" || invoice.status !== "paid" || !end) return null;
  return new Date(end * 1000);
}
export async function findMemberSubscriptions(memberId: number) {
  const db = await membershipDb();
  return db.select().from(aiSubscriptions).where(eq(aiSubscriptions.memberId, memberId));
}
export async function hasMemberAccess(memberId: number) {
  const subscriptions = await findMemberSubscriptions(memberId);
  return subscriptions.some(sub => subscriptionGrantsAccess(sub));
}

export async function synchronizeSubscription(subscriptionId: string) {
  const stripe = membershipStripe();
  // Always retrieve the latest state instead of trusting out-of-order webhook snapshots.
  const sub = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["latest_invoice"] });
  const db = await membershipDb();
  const [existing] = await db.select().from(aiSubscriptions).where(eq(aiSubscriptions.id, sub.id)).limit(1);
  if (!existing) return null; // Checkout fulfillment creates account using the actual paid email.
  if (!isMembershipSubscription(sub)) {
    await db.update(aiSubscriptions).set({ status: "invalid_product", paidThrough: null }).where(eq(aiSubscriptions.id, sub.id));
    return null;
  }
  const paidThrough = membershipPaidThrough(sub);
  await db.update(aiSubscriptions).set({ status: sub.status, cancelAtPeriodEnd: sub.cancel_at_period_end, livemode: sub.livemode, paidThrough }).where(eq(aiSubscriptions.id, sub.id));
  return { ...existing, status: sub.status, paidThrough, livemode: sub.livemode, cancelAtPeriodEnd: sub.cancel_at_period_end };
}

export async function fulfillMembershipCheckout(sessionId: string) {
  const stripe = membershipStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["subscription.latest_invoice"] });
  if (session.metadata?.type !== AI_MEMBERSHIP.type || session.mode !== "subscription" || session.status !== "complete" || session.payment_status !== "paid") {
    throw new Error("A completed, paid membership checkout is required");
  }
  const sub = session.subscription as Stripe.Subscription;
  if (!sub || typeof sub === "string" || !isMembershipSubscription(sub)) throw new Error("Invalid membership subscription");
  const paidThrough = membershipPaidThrough(sub);
  if (!paidThrough) throw new Error("Membership payment has not been confirmed");
  const email = normalizeMemberEmail(session.customer_details?.email || session.customer_email || "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Stripe did not provide a valid paid email");
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  if (!customerId || customerId !== (typeof sub.customer === "string" ? sub.customer : sub.customer.id)) throw new Error("Stripe customer mismatch");
  const db = await membershipDb();
  const [intent] = await db.select().from(aiCheckoutIntents).where(eq(aiCheckoutIntents.id, session.metadata.intentId || "")).limit(1);
  if (!intent) throw new Error("Missing membership checkout intent");
  const member = await db.transaction(async tx => {
    await tx.insert(aiMembers).values({ email, name: session.customer_details?.name?.slice(0, 200) || null }).onDuplicateKeyUpdate({ set: { email } });
    const [member] = await tx.select().from(aiMembers).where(eq(aiMembers.email, email)).limit(1);
    if (!member) throw new Error("Member account could not be created");
    const [existing] = await tx.select().from(aiSubscriptions).where(eq(aiSubscriptions.id, sub.id)).limit(1).for("update");
    if (existing && existing.memberId !== member.id) throw new Error("Subscription account mismatch");
    await tx.insert(aiSubscriptions).values({ id: sub.id, memberId: member.id, customerId, status: sub.status, paidThrough, cancelAtPeriodEnd: sub.cancel_at_period_end, livemode: sub.livemode })
      .onDuplicateKeyUpdate({ set: { status: sub.status, paidThrough, cancelAtPeriodEnd: sub.cancel_at_period_end, livemode: sub.livemode } });
    return member;
  });
  // Account and access are saved before sending email. Failure remains retryable
  // and causes the signed webhook to return 500 (Stripe will retry it).
  const lease = await db.transaction(async tx => {
    const [row] = await tx.select().from(aiSubscriptions).where(eq(aiSubscriptions.id, sub.id)).limit(1).for("update");
    if (row.welcomeSentAt) return "sent";
    if (row.welcomeLeaseAt && row.welcomeLeaseAt.getTime() > Date.now() - 2 * 60 * 1000) return "busy";
    await tx.update(aiSubscriptions).set({ welcomeLeaseAt: new Date() }).where(eq(aiSubscriptions.id, sub.id));
    return "send";
  });
  let welcomeSent = lease === "sent";
  if (lease === "send") {
    try {
      const token = await createLoginToken(member.id);
      await sendMemberEmail(email, intent.origin, `${intent.origin}/ai-members/sign-in#token=${token}`, true);
      await db.update(aiSubscriptions).set({ welcomeSentAt: new Date(), welcomeLeaseAt: null }).where(eq(aiSubscriptions.id, sub.id));
      welcomeSent = true;
    } catch (error) {
      await db.update(aiSubscriptions).set({ welcomeLeaseAt: null }).where(eq(aiSubscriptions.id, sub.id));
      // Browser finalization still gets account access; webhook requests retry email.
      console.warn("[AIMembership] Welcome delivery failed; fulfillment is saved and email remains retryable.");
    }
  }
  return { member, session, welcomeSent };
}

export async function handleMembershipStripeEvent(event: Stripe.Event) {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.type !== AI_MEMBERSHIP.type) return false;
    const result = await fulfillMembershipCheckout(session.id);
    if (!result.welcomeSent) throw new Error("Membership welcome email is awaiting delivery; retry this event");
    return true;
  }
  if (event.type.startsWith("customer.subscription.")) {
    const sub = event.data.object as Stripe.Subscription;
    if (sub.metadata?.type !== AI_MEMBERSHIP.type) return false;
    await synchronizeSubscription(sub.id);
    return true;
  }
  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const linked = invoice.parent?.subscription_details?.subscription;
    const id = typeof linked === "string" ? linked : linked?.id;
    if (id) {
      const db = await membershipDb();
      const [existing] = await db.select().from(aiSubscriptions).where(eq(aiSubscriptions.id, id)).limit(1);
      if (existing) { await synchronizeSubscription(id); return true; }
    }
  }
  return false;
}
