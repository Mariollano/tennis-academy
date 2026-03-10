/**
 * Referral system helpers
 *
 * Flow:
 * 1. Every user gets a unique referral code generated on first login (ensureReferralCode).
 * 2. When a new user signs up via a referral link (?ref=CODE), the code is stored on their profile.
 * 3. When that referred user completes their FIRST booking (any program), we:
 *    a. Find the referrer via the referral code.
 *    b. Create a 20%-off promo code for the referrer.
 *    c. Mark the referral as "rewarded".
 *    d. Notify the referrer via SMS + email.
 */

import { getDb } from "./db";
import { users, promoCodes, referrals } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { sendSms, isTwilioConfigured } from "./sms";
import { sendEmail, isEmailConfigured } from "./email";

// ─── Code generation ──────────────────────────────────────────────────────────

/** Generate a short, human-friendly referral code like "MARIO7X3K" */
function generateCode(name: string | null): string {
  const base = (name || "TENNIS")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 5)
    .padEnd(3, "X");
  const suffix = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `${base}${suffix}`;
}

/** Ensure a user has a referral code; generate one if missing. Returns the code. */
export async function ensureReferralCode(userId: number, name: string | null): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const [user] = await db.select({ referralCode: users.referralCode }).from(users).where(eq(users.id, userId)).limit(1);
  if (user?.referralCode) return user.referralCode;

  // Generate a unique code (retry on collision)
  let code = generateCode(name);
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.referralCode, code)).limit(1);
    if (!existing.length) break;
    code = generateCode(name); // retry with new random suffix
  }

  await db.update(users).set({ referralCode: code }).where(eq(users.id, userId));
  return code;
}

// ─── Reward on first booking ──────────────────────────────────────────────────

/**
 * Call this after a user's FIRST booking is confirmed.
 * Checks if the user was referred; if so, rewards the referrer with a 20% promo code.
 */
export async function maybeRewardReferrer(newUserId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Get the new user's referredBy code
  const [newUser] = await db
    .select({ referredBy: users.referredBy, name: users.name })
    .from(users)
    .where(eq(users.id, newUserId))
    .limit(1);

  if (!newUser?.referredBy) return; // not a referred user

  // Find the referrer
  const [referrer] = await db
    .select({ id: users.id, name: users.name, phone: users.phone, email: users.email })
    .from(users)
    .where(eq(users.referralCode, newUser.referredBy))
    .limit(1);

  if (!referrer) return; // referral code doesn't match any user

  // Check if this referral was already rewarded
  const existingReferral = await db
    .select({ id: referrals.id, status: referrals.status })
    .from(referrals)
    .where(and(eq(referrals.referrerId, referrer.id), eq(referrals.referredUserId, newUserId)))
    .limit(1);

  if (existingReferral.length && existingReferral[0].status === "rewarded") return; // already rewarded

  // Create a 20% discount promo code for the referrer
  const rewardCode = `REFER${referrer.name?.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) || "FRIEND"}${Date.now().toString(36).toUpperCase().slice(-4)}`;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90); // valid for 90 days

  const [insertedPromo] = await db.insert(promoCodes).values({
    code: rewardCode,
    description: `Referral reward for referring ${newUser.name || "a friend"}`,
    discountType: "percent",
    discountValue: 20,
    maxUses: 1,
    usedCount: 0,
    expiresAt,
    isActive: true,
    appliesTo: null, // applies to all programs
    createdBy: null,
  });

  const promoId = (insertedPromo as any)?.insertId || null;

  // Record the referral
  if (existingReferral.length) {
    await db
      .update(referrals)
      .set({ status: "rewarded", rewardPromoCodeId: promoId, rewardedAt: new Date() })
      .where(eq(referrals.id, existingReferral[0].id));
  } else {
    await db.insert(referrals).values({
      referrerId: referrer.id,
      referredUserId: newUserId,
      referralCode: newUser.referredBy,
      rewardPromoCodeId: promoId,
      status: "rewarded",
      rewardedAt: new Date(),
    });
  }

  const referredName = newUser.name || "a friend";
  const expiry = expiresAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  // Notify referrer via SMS
  if (isTwilioConfigured() && referrer.phone) {
    const smsMsg = `🎾 Great news ${referrer.name || ""}! ${referredName} just booked their first lesson using your referral link. You've earned 20% OFF your next session! Use code: ${rewardCode} (expires ${expiry}). Book at tennispromario.com. Reply STOP to unsubscribe.`;
    sendSms(referrer.phone, smsMsg).catch(() => {});
  }

  // Notify referrer via email
  if (isEmailConfigured() && referrer.email) {
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#0a1628 0%,#1a3a8f 100%);padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:2px;font-weight:900;">RI TENNIS ACADEMY</h1>
            <p style="margin:6px 0 0;color:#c4ff00;font-size:13px;letter-spacing:1px;">Coach Mario Llano · #DeleteFear</p>
          </td>
        </tr>
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 12px;color:#1a3a8f;font-size:22px;">🎉 You Earned a Reward!</h2>
          <p style="margin:0 0 20px;color:#444;font-size:15px;">
            Hi ${referrer.name || "there"},<br><br>
            <strong>${referredName}</strong> just booked their first session using your referral link — and you've earned a reward!
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7ff;border:2px solid #1a3a8f;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
            <tr>
              <td style="text-align:center;">
                <p style="margin:0 0 8px;color:#555;font-size:14px;">Your 20% discount code:</p>
                <p style="margin:0;font-size:28px;font-weight:900;letter-spacing:4px;color:#1a3a8f;">${rewardCode}</p>
                <p style="margin:8px 0 0;color:#888;font-size:12px;">Valid for 1 use · Expires ${expiry}</p>
              </td>
            </tr>
          </table>
          <p style="margin:0 0 20px;color:#444;font-size:14px;">
            Use this code at checkout on your next booking for <strong>20% off any program</strong>.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr>
              <td align="center">
                <a href="https://tennispromario.com/booking/private_lesson"
                   style="display:inline-block;background:#1a3a8f;color:#ffffff;font-weight:bold;font-size:14px;padding:12px 28px;border-radius:6px;text-decoration:none;">
                  Book Now & Use Your Code →
                </a>
              </td>
            </tr>
          </table>
          <p style="margin:0;font-size:13px;color:#888;border-top:1px solid #eee;padding-top:16px;">
            Keep sharing your referral link to earn more rewards! Every friend who books their first session earns you another discount.
          </p>
        </td></tr>
        <tr>
          <td style="background:#f0f3ff;padding:16px 32px;text-align:center;border-top:1px solid #dde3f5;">
            <p style="margin:0;font-size:12px;color:#888;">
              RI Tennis Academy · Rhode Island's Premier Tennis Academy<br>
              <a href="https://tennispromario.com" style="color:#1a3a8f;">tennispromario.com</a> · 401-965-5873
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const text = `Hi ${referrer.name || "there"}!\n\n${referredName} just booked their first session using your referral link. You've earned 20% OFF your next session!\n\nYour discount code: ${rewardCode}\nExpires: ${expiry}\n\nUse it at checkout on tennispromario.com.\n\n— RI Tennis Academy`;

    sendEmail({
      to: referrer.email,
      toName: referrer.name || "there",
      subject: `🎉 You earned a reward! ${referredName} just booked their first lesson`,
      html,
      text,
    }).catch(() => {});
  }

  console.log(`[Referral] Rewarded user #${referrer.id} (${referrer.name}) with promo code ${rewardCode} for referring user #${newUserId}`);
}
