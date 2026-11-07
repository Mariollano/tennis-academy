# AI membership: verified and enabled; publication still needed

Updated November 6, 2026, after the corrected Gmail credentials were saved directly to this website.

## Public-site status

The project is ready and enrollment is enabled in its database. However, a signed-in admin check on the public website confirms its running service still rejects the old email credentials. Its public checkout status remains unavailable. The latest checkpoint must be published to apply the corrected email Settings to production. No further Stripe or Gmail credential entry is needed.

The assistant tried to open the project publishing controls in the cloud browser, but Manus requires the owner's login. Publishing can be done from the owner's already signed-in Manus app. After publication, the public Join dialog and Stripe redirect must be retested before calling the public launch complete.

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

A real paid end-to-end test requires permission before charging any card. The server-side Join-to-Stripe check passed without card entry or payment, and its unused checkout session was expired. The public browser check is still blocked by production's old email settings and needs publication before it can be completed.

## Repeatable owner launch check

`scripts/verifyMembershipLaunch.ts` checks readiness and the public signed webhook. The optional `--send-owner-link` flag sends a genuine sign-in link only to the configured academy sending address and creates no paid entitlement. `--enable` requires that email check in the same invocation and a final successful readiness check.

## Maintenance

Keep the persistent `JWT_SECRET` unchanged when migrating or restoring the site; it protects encrypted PDFs and the dedicated webhook secret. Never put Stripe keys, App Passwords, or emailed sign-in tokens in public files or repository code.

If Google credentials are changed, re-run the explicit real connection check:

```bash
VERIFY_AI_MEMBERSHIP_CONNECTIONS=1 pnpm vitest run server/aiMembershipConnections.test.ts
```

Membership rate limits trust loopback proxies by default. For another deployment proxy, allowlist its exact peer address through `MEMBERSHIP_TRUSTED_PROXY_IPS` rather than trusting arbitrary forwarding headers.
