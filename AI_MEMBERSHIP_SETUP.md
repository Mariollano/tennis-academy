# AI membership: built, enrollment closed

The membership feature is built and tested, but it is **not accepting payments yet**. Do not announce enrollment as open until the Stripe and email setup below is completed and the real delivery flow has been checked.

## What is ready

Both homepage and membership-page Join buttons use the same guarded checkout control. When enrollment is safely opened, Stripe Checkout charges **$20.00 USD each month** for **AI for the Working Tennis Pro — Membership**. The visitor sees the monthly billing terms and the fact that unfinished guides say “Coming soon” before paying.

A completed paid checkout creates a member account using the email returned by Stripe. The welcome email contains a private, one-use sign-in link and the member-library link. A payment-confirmation URL alone never signs someone in: the subscriber uses the emailed link to prove they control that email.

The library at `/ai-members` has Guide 1 through Guide 5 plus New Guides. All six PDF slots start as **Coming soon**. Prompt Library also says Coming soon until Mario adds prompts. Non-members see a short membership message, the Join button, and an email sign-in form—not the downloads or prompts.

Members can cancel future renewal from the library. They retain access through the paid month. Downloaded PDFs are theirs to keep.

Mario can upload or replace PDFs and paste Prompt Library text at `/admin/ai-members`. PDFs are encrypted in file storage and served through an authenticated server endpoint, not a public PDF link.

Existing tennis homepage sections, prices, booking procedures, SMS/email services, and original tennis Stripe webhook handlers are unchanged.

## What you need to do first

1. **Open your Stripe Dashboard.** Finish business and bank-account activation if Stripe asks for it. Switch from test mode to live mode and obtain the live secret key. The saved project key checked during this task starts with `sk_test_`, not `sk_live_`.
2. **Restore welcome-email sending.** The saved Gmail password was rejected with authentication error 535; the Resend key was also invalid. Use a current Google App Password for the academy’s sending Gmail account, or a valid Resend key with a verified sender domain. Supply secrets through the project’s secure secrets form, never ordinary chat or source code.
3. **Publish the saved membership code with enrollment still closed.** Then open `/admin/ai-members` and click **Connect membership webhook**. It creates a separate live endpoint at `https://tennispromario.com/api/ai-members/stripe-webhook`, on the connected account, and saves its Stripe-returned signing secret encrypted. It does not change the existing `/api/stripe/webhook` or its signing secret. You do not need to create a membership product or price manually; Checkout creates the correctly named monthly price automatically.
4. **Check actual delivery before opening to the public.** Recheck setup. Preview the welcome email. Confirm that a real email can be delivered and that the end-to-end Stripe checkout, emailed sign-in, member access, and cancellation flow work. Unit tests used in-memory records and mocked Stripe/email responses; they did not charge a card or send a real email. Any paid live test requires your explicit approval first.
5. When ready, use **Open enrollment** in membership administration. Even after that switch is on, the server refuses new checkout requests if live Stripe, the dedicated webhook, database/encryption, or email verification fails.

The website’s current public version may remain older until the checkpoint is published. Preview links below show the implementation without opening enrollment.

## Preview links

- [Member library](https://3000-ijfrnb4kjrjdv31x41kvv-81656936.us1.manus.computer/ai-members)
- [Manage PDFs and membership setup](https://3000-ijfrnb4kjrjdv31x41kvv-81656936.us1.manus.computer/admin/ai-members)
- [Welcome email preview](https://3000-ijfrnb4kjrjdv31x41kvv-81656936.us1.manus.computer/api/ai-members/welcome-preview)

## Validation completed

44 membership/landing-page tests passed. Another 14 focused tests for tennis booking calendars, clinic scheduling, donation rules, availability, and safe calendar-sync handling passed. TypeScript checks and the production build passed.

The browser showed the non-member library correctly and confirmed that Join shows “Membership enrollment is not open yet” with no payment action. Direct unauthenticated PDF requests returned HTTP 401.

No live Stripe checkout, real charge, real welcome email, or PDF upload to live storage was performed. No fabricated member or payment was inserted into the production database. Schema changes only added the membership tables and fields.

## Technical maintenance notes

The membership has separate accounts and session cookies; it does not grant tennis-admin privileges. Login tokens are hashed, expiring, and transactionally one-use. Server-side access requires a live, active subscription with a confirmed paid period in the future. Protected requests reconcile the latest Stripe status; changed products, failed payments, and canceled subscriptions do not keep stale access.

PDF bytes and the dedicated webhook signing secret are encrypted using a key derived from the existing persistent server `JWT_SECRET`. Preserve that secret with secure backups; rotate it only with a planned migration of the encrypted assets and webhook secret. The existing Stripe webhook signing secret is not changed.

Membership rate limits trust only loopback proxy peers by default. If deployment uses another proxy address, allowlist its exact peer IP in `MEMBERSHIP_TRUSTED_PROXY_IPS`; never indiscriminately trust visitor-supplied forwarding headers. Rate limits are bounded in-memory, not distributed across instances.

## Stripe references used

- [Subscription webhooks and paid access](https://docs.stripe.com/billing/subscriptions/webhooks)
- [Subscription Checkout](https://docs.stripe.com/payments/checkout/build-subscriptions)
