import { eq } from "drizzle-orm";
import { aiMembers, aiMembershipSettings } from "../drizzle/schema";
import { AI_MEMBERSHIP, normalizeMemberEmail } from "../shared/aiMembership";
import { createLoginToken, membershipDb } from "../server/aiMembershipSecurity";
import { sendMemberEmail } from "../server/aiMembershipEmail";
import { getMembershipReadiness, membershipStripe, membershipWebhookSettings, storedMembershipWebhookSecret } from "../server/aiMembershipReadiness";

// Owner-invoked launch check only; no charges or fabricated subscriptions.
// --send-owner-link creates a real email account for the configured academy
// sender, without granting paid access, and tests the production email sender.
// --enable requires --send-owner-link in the same invocation.
async function main() {
  const args = new Set(process.argv.slice(2));
  const enabling = args.has("--enable");
  if (enabling && !args.has("--send-owner-link")) throw new Error("Enable requires an owner email delivery check in the same run.");
  const readiness = await getMembershipReadiness();
  if (!readiness.ready) throw new Error(`Launch blocked: ${readiness.blockers.join(" ")}`);
  console.log("Readiness passed: live Stripe, $20/month product, email, database, encryption, dedicated webhook.");
  const stripe = membershipStripe();
  const settings = await membershipWebhookSettings();
  if (!settings) throw new Error("Membership settings are missing.");

  // Replay only a genuine, unhandled catalog event as a transport check.
  // This never simulates a payment or provisions member access.
  const events = await stripe.events.list({ type: "product.created", limit: 100 });
  const event = events.data.find(e => e.livemode && (e.data.object as any).id === "prod_ai_working_tennis_pro_membership_v1");
  if (!event) throw new Error("Cannot locate the genuine membership product event for the signed webhook check.");
  const payload = JSON.stringify(event);
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: storedMembershipWebhookSecret(settings) });
  const response = await fetch("https://tennispromario.com/api/ai-members/stripe-webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Stripe-Signature": signature, "User-Agent": "Mozilla/5.0 MembershipLaunchCheck" },
    body: payload,
    signal: AbortSignal.timeout(25000),
  });
  const body = await response.text();
  if (!response.ok || !body.includes('"received":true')) throw new Error(`Public signed webhook check failed with HTTP ${response.status}. Enrollment was not changed.`);
  console.log("Public signed webhook transport accepted a genuine catalog event; no payment event was fabricated.");

  const db = await membershipDb();
  if (args.has("--send-owner-link")) {
    const email = normalizeMemberEmail(process.env.EMAIL_USER || "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("A valid configured owner sender email is required.");
    await db.insert(aiMembers).values({ email, name: "Coach Mario" }).onDuplicateKeyUpdate({ set: { email } });
    const [member] = await db.select().from(aiMembers).where(eq(aiMembers.email, email)).limit(1);
    if (!member) throw new Error("Owner sign-in account could not be created.");
    const token = await createLoginToken(member.id);
    await sendMemberEmail(email, "https://tennispromario.com", `https://tennispromario.com/ai-members/sign-in#token=${token}`, false);
    console.log(`Owner onboarding sign-in email accepted by the sending provider: ${email}. No subscription or paid entitlement was created.`);
  }
  if (enabling) {
    const finalCheck = await getMembershipReadiness();
    if (!finalCheck.ready) throw new Error("A final readiness check failed. Enrollment was not changed.");
    await db.update(aiMembershipSettings).set({ checkoutEnabled: true }).where(eq(aiMembershipSettings.id, 1));
    console.log("ENROLLMENT ENABLED for AI for the Working Tennis Pro: $20 USD monthly, cancel anytime.");
  }
  const final = await getMembershipReadiness();
  console.log(JSON.stringify({ ready: final.ready, enabled: final.enabled, product: AI_MEMBERSHIP.productName, emailProvider: final.emailProvider, blockers: final.blockers }));
}
main().then(() => process.exit(0)).catch(error => {
  // Never log Stripe objects, mail configuration, password, token, or signature.
  console.error("Membership launch check:", error instanceof Error ? error.message : "failed");
  process.exit(1);
});
