# AI membership: Stripe connected; welcome email still blocked

Updated November 6, 2026.

## Completed in the real Stripe account

The live Stripe key passed account verification: payments are enabled and the required business details have been submitted. A dedicated membership key is stored securely as `AI_MEMBERSHIP_STRIPE_SECRET_KEY`; the platform-managed tennis payment key is unchanged.

The live product **AI for the Working Tennis Pro — Membership** and its fixed **$20.00 USD/month** recurring price are created. All membership Join buttons use that single price when enrollment opens. Members can cancel future renewal from the member library.

- [Open the live product in Stripe](https://dashboard.stripe.com/products/prod_ai_working_tennis_pro_membership_v1)
- Product ID: `prod_ai_working_tennis_pro_membership_v1`
- Price ID: `price_1UYzWeDYnfcpZzYJIUFhmIZF`
- Price lookup key: `ai_working_tennis_pro_monthly_v1`

A separate live subscription webhook is registered at `https://tennispromario.com/api/ai-members/stripe-webhook`, with checkout completion, subscription changes, and invoice paid/failed events. Its endpoint-specific signing secret is encrypted in the membership settings table. The original tennis webhook and signing secret were not changed.

## Only remaining blocker: Gmail

Google still rejects the saved account/password combination for **ritennismario@gmail.com** with authentication error 535. The password was also tested without spaces; this is not a formatting problem. Resend is not a working fallback.

A second secure email form was declined, so no corrected email credentials were supplied.

**Enrollment is intentionally closed.** A member needs their private emailed sign-in link to prove they own the checkout email. Opening payment before that email can be sent would risk someone paying but being unable to sign in.

## Mario’s next step

1. Open [Google App Passwords](https://myaccount.google.com/apppasswords).
2. Check the Google account shown at the top. The address must exactly match the academy’s configured sender, normally **ritennismario@gmail.com**. If you created the password in another Google account, use that same account as the sending address instead.
3. Create a **new** App Password named **RI Tennis Academy**. Google requires 2-Step Verification. This is a 16-character App Password, not your usual Google password.
4. Supply the Gmail address and matching App Password through the secure secrets form. Do not paste the password into ordinary chat. You do not need to provide the Stripe key again.

After Google accepts the credentials, the remaining work is to send and verify a genuine welcome/sign-in email, recheck membership readiness, and open enrollment. An end-to-end paid checkout test requires explicit permission before any real card charge; no real charge has been performed.

## Member delivery already implemented

Paid checkout fulfillment creates a member account from the email returned by Stripe, then attempts the branded welcome email immediately. That email includes a one-use sign-in link, a member-library link, and three getting-started instructions. Failed welcome delivery remains retryable through Stripe; repeat webhooks do not create duplicate accounts.

The member library at `/ai-members` has Guide 1 through Guide 5 plus New Guides, all showing **Coming soon** until a PDF is uploaded. Prompt Library also shows Coming soon until Mario adds prompts. Non-members cannot obtain the PDF downloads or prompt text. Admin uploads are at `/admin/ai-members`.

The server checks paid subscription access before serving decrypted PDFs. The publicly stored file bytes are encrypted. A checkout-success URL alone cannot sign in to an existing email account.

## Validation and deployment

All 191 focused membership/catalog/landing-page and existing tennis booking regression tests passed. TypeScript checks and the production build also passed. The separate read-only live Stripe connection test passed; the real email-authentication test remains failed and is the stated blocker, not a completed test.

No live subscription purchase, real charge, successful welcome email, or fabricated member record was created. The only external configuration changes made were the authorized membership product, monthly price, and dedicated Stripe webhook.

Publishing the latest saved checkpoint deploys the isolated key support and permanent-price checkout. It does **not** open enrollment automatically. Readiness refuses checkout if email authentication or the fixed Stripe product/webhook checks fail.

## Preview links

- [Member library](https://3000-ijfrnb4kjrjdv31x41kvv-81656936.us1.manus.computer/ai-members)
- [Membership administration](https://3000-ijfrnb4kjrjdv31x41kvv-81656936.us1.manus.computer/admin/ai-members)
- [Welcome email preview](https://3000-ijfrnb4kjrjdv31x41kvv-81656936.us1.manus.computer/api/ai-members/welcome-preview)

## Technical maintenance notes

Preserve the persistent server `JWT_SECRET` when backing up or migrating the site; it protects encrypted PDFs and the membership webhook signing secret. Existing tennis booking/payment handlers, academy prices, and SMS/email service code were not edited for this Stripe connection.

The membership product is found using its fixed lookup key and validated for live mode, active status, the exact product name, $20 USD monthly recurrence, and quantity one. An unexpected price/product fails closed rather than silently being changed. Public readiness checks only read the catalog; product creation is an owner/admin action.

Membership rate limits trust loopback proxies by default. If deployment uses another proxy, allowlist its exact peer address through `MEMBERSHIP_TRUSTED_PROXY_IPS`, not arbitrary forwarding headers.
