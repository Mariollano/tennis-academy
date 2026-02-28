# RI Tennis Academy - Project TODO

## Foundation
- [x] Database schema (users, programs, bookings, payments, sms_broadcasts, merchandise, tournament_bookings, mental_coaching_resources)
- [x] Global layout, top navigation, footer
- [x] Branding: RI Tennis Academy colors, fonts, logo placeholder

## Home Page
- [x] Hero section with CTA
- [x] Programs overview cards
- [x] About Mario / Academy intro
- [x] Social proof / testimonials placeholder

## Programs & Booking
- [x] Private lessons booking
- [x] 105 Game adult clinic booking ($30 / 1.5hr)
- [x] Junior programs (fall/spring): daily ($80/session, 4:30–6:30 PM) or weekly ($350/week)
- [x] Summer camp: daily ($100/day) or weekly ($450/week, enforce same-week 5 days)
- [x] After camp add-on: $20 extra (2:30–5 PM)
- [x] Booking form with date/time picker
- [x] Booking confirmation flow

## Payments
- [x] Stripe integration
- [x] Checkout session creation for all program types
- [x] Stripe webhook handler (checkout.session.completed)
- [x] Tournament attendance: $50/hr + $25/hr travel + expenses (shareable)
- [x] Racquet stringing: $35 (Mario's string) / $25 (customer's string)
- [x] Merchandise: sweatshirts $50, t-shirts $25
- [x] Payment history for students (via profile page)

## Social Media Feed
- [x] YouTube: Ri Tennis Mario
- [x] Instagram: deletefearwithMario and RITennisandFAYE
- [x] TikTok: @deletefear
- [x] Facebook: Mario Llano
- [x] X/Twitter: @RITennisAcademy
- [x] Unified feed display with platform badges and featured content section

## Mental Coaching Section
- [x] Mental coaching intro / philosophy page ("Delete Fear" methodology)
- [x] Book mental coaching session
- [x] AI-powered mental coaching advice widget (in chatbot)
- [x] Mental coaching resources / articles (from DB)
- [x] Six Pillars of Mental Tennis section

## AI FAQ Chatbot
- [x] Tennis technique Q&A (FAQ mode)
- [x] Mental game coaching Q&A (mental coaching mode)
- [x] Program/pricing Q&A
- [x] Floating chatbot widget on all pages
- [x] Mode toggle: FAQ vs Mental Coaching

## Additional Services
- [x] Tournament attendance booking with cost calculator and sharing
- [x] Racquet stringing booking (Mario's string vs customer's string)
- [x] Merchandise store (sweatshirts $50, t-shirts $25)

## Admin Dashboard
- [x] Stats overview (students, bookings, pending, SMS subscribers)
- [x] View/manage all bookings with status filters
- [x] Confirm / cancel / complete booking actions
- [x] Student directory with SMS opt-in status
- [x] SMS broadcast panel with subscriber count
- [x] Recent broadcast history

## SMS Notifications
- [x] SMS opt-in consent during profile setup
- [x] Store opt-in preference in DB (smsOptIn field on users table)
- [x] Daily update broadcast (admin sends from dashboard)
- [x] Schedule change notifications (via broadcast)
- [x] Motivational message broadcasts
- [ ] Twilio integration (requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER secrets)

## Auth & Profiles
- [x] Student authentication (Manus OAuth)
- [x] Student profile page (name, phone, programs enrolled, bookings)
- [x] SMS opt-in preference management in profile
- [x] Role-based access: student vs admin

## Master AI Prompt
- [x] Prompt engineering for Mario's tennis coaching persona
- [x] Covers technique, mental game, academy info, pricing, SMS templates
- [x] Saved as MASTER_PROMPT.md in project root

## Tests
- [x] Vitest tests: auth, programs, bookings, admin, SMS, AI chat, pricing validation (36 tests passing)

## Fixes & Updates
- [x] Update private lesson price to $120/hour everywhere (pages, routers, master prompt)
