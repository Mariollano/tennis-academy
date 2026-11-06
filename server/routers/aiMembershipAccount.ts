import { z } from "zod";
import { and, eq, gt } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../_core/trpc";
import { aiMembers, aiMemberSessions } from "../../drizzle/schema";
import { normalizeMemberEmail } from "../../shared/aiMembership";
import { membershipDb, getSignedInMember, createLoginToken, consumeLoginToken, createMemberSession, readMemberCookie, MEMBER_COOKIE, hashToken, rateLimit, requireMembershipOrigin, requireSameSite, membershipClientAddress } from "../aiMembershipSecurity";
import { findMemberSubscriptions, hasMemberAccess, synchronizeSubscription } from "../aiMembershipFulfillment";
import { sendMemberEmail, verifyMembershipEmail } from "../aiMembershipEmail";

export async function requireActiveMember(req: Parameters<typeof getSignedInMember>[0]) {
  const member = await getSignedInMember(req);
  if (!member) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in to your member account." });
  // Reconcile on protected requests too: missed/out-of-order events must not
  // leave canceled subscriptions with access to future downloads.
  const subs = await findMemberSubscriptions(member.id);
  await Promise.all(subs.map(sub => synchronizeSubscription(sub.id)));
  if (!await hasMemberAccess(member.id)) throw new TRPCError({ code: "FORBIDDEN", message: "An active paid membership is required." });
  return member;
}

export const aiMembershipAccountRouter = router({
  me: publicProcedure.query(async ({ ctx }) => {
    ctx.res.setHeader("Cache-Control", "private, no-store");
    const member = await getSignedInMember(ctx.req);
    if (!member) return { member: null, hasAccess: false, subscriptions: [], admin: ctx.user?.role === "admin" };
    const subs = await findMemberSubscriptions(member.id);
    await Promise.all(subs.map(sub => synchronizeSubscription(sub.id)));
    const subscriptions = await findMemberSubscriptions(member.id);
    return { member: { email: member.email, name: member.name }, hasAccess: await hasMemberAccess(member.id), admin: ctx.user?.role === "admin", subscriptions: subscriptions.map(sub => ({ id: sub.id, status: sub.status, paidThrough: sub.paidThrough, cancelAtPeriodEnd: sub.cancelAtPeriodEnd })) };
  }),
  requestSignIn: publicProcedure.input(z.object({ email: z.string().email().max(320), origin: z.string() })).mutation(async ({ input, ctx }) => {
    requireSameSite(ctx.req);
    requireMembershipOrigin(input.origin);
    const email = normalizeMemberEmail(input.email);
    rateLimit(`login-ip:${membershipClientAddress(ctx.req)}`, 20);
    rateLimit(`login-email:${hashToken(email)}`, 3);
    if (!(await verifyMembershipEmail()).ready) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Member sign-in emails are temporarily unavailable. Please contact Coach Mario." });
    const db = await membershipDb();
    const [member] = await db.select().from(aiMembers).where(eq(aiMembers.email, email)).limit(1);
    if (member) {
      const token = await createLoginToken(member.id);
      await sendMemberEmail(email, input.origin, `${input.origin}/ai-members/sign-in#token=${token}`, false);
    }
    return { message: "If that email has a member account, a private sign-in link is on its way. Check your spam folder too." };
  }),
  signIn: publicProcedure.input(z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) })).mutation(async ({ input, ctx }) => {
    requireSameSite(ctx.req);
    rateLimit(`token:${membershipClientAddress(ctx.req)}`, 30);
    const memberId = await consumeLoginToken(input.token);
    if (!memberId) throw new TRPCError({ code: "UNAUTHORIZED", message: "That link has expired or was already used. Request a new sign-in link." });
    await createMemberSession(memberId, ctx.req, ctx.res);
    return { success: true };
  }),
  signOut: publicProcedure.mutation(async ({ ctx }) => {
    requireSameSite(ctx.req);
    const token = readMemberCookie(ctx.req);
    if (token) { const db = await membershipDb(); await db.delete(aiMemberSessions).where(eq(aiMemberSessions.hash, hashToken(token))); }
    ctx.res.clearCookie(MEMBER_COOKIE, { path: "/", httpOnly: true, sameSite: "lax" });
    return { success: true };
  }),
});
