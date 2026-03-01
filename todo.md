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
- [x] Upload RI Tennis Academy logo to CDN and display in navbar
- [x] Retheme entire app to brand colors: black, royal blue (#2563EB), light blue, white, tennis ball yellow (#CCFF00)
- [x] Fix /dashboard 404 - add redirect to /admin
- [x] Fix logo cropping in navbar - adjust sizing and object-fit
- [x] Fix navbar wrapping on medium screens
- [x] Fix program name display in My Bookings (shows "Program #1" instead of "Private Lesson")
- [x] Wire Stripe checkout into booking flow - pay immediately at booking time
- [x] Add social media sharing section to booking confirmation screen (Facebook, X/Twitter, WhatsApp, copy link)
- [x] Add admin booking notifications - Mario gets instant alert when anyone signs up for anything (via Manus notification system, triggered on Stripe webhook checkout.session.completed)
- [x] Make Admin dashboard stat cards clickable - link to relevant sections (students, bookings, pending, SMS)
- [x] Add PWA support (manifest, service worker, icons) so app is installable on iOS and Android
- [x] Add session_slots table with capacity, enrollment count, day-of-week rules for 105 clinic (Mon/Wed/Fri=12, Sun=24)
- [x] Add admin-adjustable capacity per session slot
- [x] Show live spot availability to students before booking (X spots left / Full)
- [x] Admin session management UI: create sessions, set capacity, view who is enrolled
- [x] Private lesson time slot availability view for students
- [x] Add blocked_times table so Mario can block date/time ranges
- [x] Admin Schedule page: calendar view of all sessions and bookings
- [x] Admin: create 105 clinic sessions (Mon/Wed/Fri cap 12, Sun cap 24) with per-slot capacity override
- [x] Admin: create private lesson time slots
- [x] Admin: block time off (mark date/time as unavailable)
- [x] Admin: view who is enrolled in each session slot
- [x] Student booking page: show available slots with live spot counts and Full indicators
- [x] Enforce capacity limit on booking creation (reject if slot is full)
- [x] Fix Admin Schedule calendar: show bookings as events (not just schedule slots)
- [x] Add Day/Week/Month view switching to Admin Schedule (Google Calendar style)
- [x] Day view: hourly time grid with events placed at correct times
- [x] Month view: full month grid with event chips per day
- [x] Day/Week view: render events as tall blocks spanning their actual start-to-end hours (like Google Calendar)\n
- [x] Calendar event popup: Charge & Confirm button for pending bookings — sends Stripe payment link and marks booking confirmed
- [x] Fix 105 Clinic schedule: Mon/Wed/Fri = 12 spots, Sun = 24 spots (remove any other days from generator)
