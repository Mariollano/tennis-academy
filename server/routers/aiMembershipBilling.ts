import { randomUUID } from "node:crypto";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../_core/trpc";
import { aiCheckoutIntents, aiMembers, aiSubscriptions } from "../../drizzle/schema";
import { AI_MEMBERSHIP, normalizeMemberEmail, subscriptionGrantsAccess } from "../../shared/aiMembership";
import { membershipDb, newToken, hashToken, tokensMatch, requireMembershipOrigin, requireSameSite, setClaimCookie, readMemberCookie, CLAIM_COOKIE, getSignedInMember, rateLimit, membershipClientAddress } from "../aiMembershipSecurity";
import { getMembershipReadiness, membershipStripe } from "../aiMembershipReadiness";
import { fulfillMembershipCheckout, findMemberSubscriptions, synchronizeSubscription } from "../aiMembershipFulfillment";

export const aiMembershipBillingRouter = router({
  checkoutStatus: publicProcedure.query(async () => {
    const check = await getMembershipReadiness();
    return { available: check.ready && check.enabled };
  }),
  createCheckout: publicProcedure.input(z.object({ email: z.string().email().max(320), origin: z.string() })).mutation(async ({ input, ctx }) => {
    requireSameSite(ctx.req);
    requireMembershipOrigin(input.origin);
    rateLimit(`checkout:${membershipClientAddress(ctx.req)}`, 10);
    const readiness = await getMembershipReadiness();
    if (!readiness.ready || !readiness.enabled) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Membership enrollment is not open yet. No payment was taken. Please contact Coach Mario." });
    const db = await membershipDb();
    const email = normalizeMemberEmail(input.email);
    const [existingMember] = await db.select().from(aiMembers).where(eq(aiMembers.email, email)).limit(1);
    if (existingMember) {
      const subs = await findMemberSubscriptions(existingMember.id);
      await Promise.all(subs.map(sub => synchronizeSubscription(sub.id)));
      if ((await findMemberSubscriptions(existingMember.id)).some(sub => subscriptionGrantsAccess(sub))) {
        throw new TRPCError({ code: "CONFLICT", message: "Please sign in to the existing membership for this email rather than paying twice." });
      }
    }
    const intentId = randomUUID();
    const claim = newToken();
    await db.insert(aiCheckoutIntents).values({ id: intentId, claimHash: hashToken(claim), email, origin: input.origin, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) });
    const session = await membershipStripe().checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [{ quantity: 1, price_data: { currency: AI_MEMBERSHIP.currency, unit_amount: AI_MEMBERSHIP.amountCents, recurring: { interval: AI_MEMBERSHIP.interval, interval_count: 1 }, product_data: { name: AI_MEMBERSHIP.productName, description: "Member PDF guides and Prompt Library. New guides are added as Coach Mario finishes them; unuploaded guides show Coming soon." } } }],
      metadata: { type: AI_MEMBERSHIP.type, intentId },
      subscription_data: { metadata: { type: AI_MEMBERSHIP.type, intentId } },
      custom_text: { submit: { message: "$20 USD billed every month. Cancel future renewal anytime from your member library. Guide slots not uploaded yet show Coming soon." } },
      success_url: `${input.origin}/ai-members?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${input.origin}/ai-for-the-working-tennis-pro?checkout=cancelled`,
    }, { idempotencyKey: `ai-membership-${intentId}` });
    if (!session.url) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to open checkout. No payment was taken." });
    setClaimCookie(ctx.req, ctx.res, claim);
    return { url: session.url };
  }),
  finishCheckout: publicProcedure.input(z.object({ sessionId: z.string().regex(/^cs_[a-zA-Z0-9_]+$/) })).mutation(async ({ input, ctx }) => {
    requireSameSite(ctx.req);
    rateLimit(`finish:${membershipClientAddress(ctx.req)}`, 30);
    const session = await membershipStripe().checkout.sessions.retrieve(input.sessionId);
    if (session.metadata?.type !== AI_MEMBERSHIP.type) throw new TRPCError({ code: "BAD_REQUEST", message: "Not a membership checkout." });
    const db = await membershipDb();
    const [intent] = await db.select().from(aiCheckoutIntents).where(eq(aiCheckoutIntents.id, session.metadata.intentId || "")).limit(1);
    if (!intent || intent.expiresAt.getTime() <= Date.now() || !tokensMatch(readMemberCookie(ctx.req, CLAIM_COOKIE), intent.claimHash)) {
      // A session_id in a shared URL is NOT proof of account ownership.
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Check your welcome email and use its private sign-in link. The checkout was opened in another browser." });
    }
    if (!session.livemode) throw new TRPCError({ code: "FORBIDDEN", message: "Test payments do not grant live member access." });
    const result = await fulfillMembershipCheckout(session.id);
    // Paying with an email does not prove control of that email. Always use
    // the privately emailed token to sign in, including for existing accounts.
    ctx.res.clearCookie(CLAIM_COOKIE, { path: "/", httpOnly: true, sameSite: "lax" });
    return { success: true, welcomeSent: result.welcomeSent };
  }),
  cancelRenewal: publicProcedure.input(z.object({ subscriptionId: z.string().min(1) })).mutation(async ({ input, ctx }) => {
    requireSameSite(ctx.req);
    const member = await getSignedInMember(ctx.req);
    if (!member) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in to cancel your membership renewal." });
    const db = await membershipDb();
    const [sub] = await db.select().from(aiSubscriptions).where(eq(aiSubscriptions.id, input.subscriptionId)).limit(1);
    if (!sub || sub.memberId !== member.id) throw new TRPCError({ code: "FORBIDDEN", message: "This subscription does not belong to your member account." });
    await membershipStripe().subscriptions.update(sub.id, { cancel_at_period_end: true }, { idempotencyKey: `ai-cancel-renewal-${sub.id}` });
    await synchronizeSubscription(sub.id);
    return { success: true };
  }),
});
