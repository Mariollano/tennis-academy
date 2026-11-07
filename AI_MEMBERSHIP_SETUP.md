# AI membership: live checkout verified

Updated November 6, 2026, at 10:28 p.m. Eastern after Mario published the corrected website Settings.

## Public-site status

**Public membership checkout is open.** The live API on tennispromario.com returns `available: true`. The homepage banner Join dialog displays the email field and Continue to Stripe button, not the old closed-enrollment message.

The public membership-page Join button was tested in an ordinary visitor browser. It redirected successfully to Stripe Checkout, displaying **AI for the Working Tennis Pro — Membership**, **$20.00 per month**, and cancel-anytime wording. The resulting live session was independently checked through Stripe for quantity one and the correct USD monthly price. No card was entered, payment stayed unpaid, and the unused owner verification session was expired. No more credential entry or publication is required for this setup.

The published member library displays the non-member message and no PDF download links. Both the guide-download endpoint and the Prompt Library API returned HTTP 401 for an unsigned visitor. This final update changes documentation only; it does not change the already-published application.

## Completed

- Live Stripe authentication and business activation passed.
- The product **AI for the Working Tennis Pro — Membership** has a fixed **$20.00 USD/month** recurring price.
- The dedicated membership webhook is connected, separate from tennis payment processing.
- Both live provider connection tests passed, including Gmail for **ritennismario@gmail.com**.
- A signed, genuine membership product-created event was accepted by the public webhook. This was a transport/signature check, not a fabricated payment or a subscription purchase.
- A genuine one-time member sign-in email was sent to **ritennismario@gmail.com** through the production email sender. The sending provider accepted it; inbox receipt has not been independently confirmed.
- A real owner email account was created for this sign-in test. No subscription or paid access was granted by the test.
- Membership readiness passed with no blockers, and enrollment was enabled in the membership settings.
- All 191 focused membership, catalog, landing-page, and tennis booking regression tests passed. The two separate real-provider connection tests also passed. TypeScript checks passed.
- The enabled checkout procedure created a real live Stripe session with the correct product, quantity one, and $20 USD monthly price. No card was entered and payment remained unpaid. That unused owner test session was expired immediately afterward.

## Payment and onboarding behavior

All membership Join buttons use the same permanent Stripe monthly price. Checkout collects the subscriber’s payment email. After confirmed payment, fulfillment creates the member account from the email Stripe returns, saves subscription access, and immediately sends the branded welcome email.

The welcome email includes a private one-use sign-in link, the member-library link, and a three-step getting-started section. A temporary sending failure remains retryable by Stripe. Repeated webhooks do not create duplicate accounts. A checkout-success URL alone cannot sign in to another person’s email account.

Members can cancel future renewal from the library and retain access through their paid month. The checkout is still fail-closed if the payment, email, product, database, or webhook checks stop passing.

## Content Mario still needs to add

The library at `/ai-members` contains Guide 1 through Guide 5 plus New Guides. Each shows **Coming soon** until its PDF is uploaded. Prompt Library likewise shows Coming soon until prompts are added. The Join dialog discloses these placeholders before checkout.

Upload PDFs and add prompts at `/admin/ai-members`. PDFs are encrypted in storage, and the server checks active paid access before decrypting and sending a download. Non-members cannot obtain guide downloads or prompt text.

## Stripe references

- [Live membership product](https://dashboard.stripe.com/products/prod_ai_working_tennis_pro_membership_v1)
- Product ID: `prod_ai_working_tennis_pro_membership_v1`
- Price ID: `price_1UYzWeDYnfcpZzYJIUFhmIZF`
- Price lookup key: `ai_working_tennis_pro_monthly_v1`
- Membership webhook: `https://tennispromario.com/api/ai-members/stripe-webhook`

The separately stored `AI_MEMBERSHIP_STRIPE_SECRET_KEY` is used only by this membership. The platform-managed tennis key, original tennis webhook, academy prices, booking handlers, and SMS code were not changed.

## Testing limits

No card has been charged. No real subscription purchase or complete paid customer onboarding has been performed. Payment fulfillment, immediate welcome email, cancellation, sign-in token consumption, and download authorization are covered by isolated regression tests. Live checks verify the real providers, signed webhook transport, and owner onboarding email.

A real paid end-to-end test requires permission before charging any card. Both the server-side and public browser Join-to-Stripe checks passed without card entry or payment, and their unused checkout sessions were expired. The live Gmail connection and owner sign-in email were verified earlier; a complete paid customer welcome-email/access lifecycle has not been performed with a real charge.

## Repeatable owner launch check

`scripts/verifyMembershipLaunch.ts` checks readiness and the public signed webhook. The optional `--send-owner-link` flag sends a genuine sign-in link only to the configured academy sending address and creates no paid entitlement. `--enable` requires that email check in the same invocation and a final successful readiness check.

## Maintenance

Keep the persistent `JWT_SECRET` unchanged when migrating or restoring the site; it protects encrypted PDFs and the dedicated webhook secret. Never put Stripe keys, App Passwords, or emailed sign-in tokens in public files or repository code.

If Google credentials are changed, re-run the explicit real connection check:

```bash
VERIFY_AI_MEMBERSHIP_CONNECTIONS=1 pnpm vitest run server/aiMembershipConnections.test.ts
```

Membership rate limits trust loopback proxies by default. For another deployment proxy, allowlist its exact peer address through `MEMBERSHIP_TRUSTED_PROXY_IPS` rather than trusting arbitrary forwarding headers.
