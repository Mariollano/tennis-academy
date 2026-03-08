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
- [x] Waitlist: add waitlist table, join/leave procedures, admin notification on join
- [x] Waitlist: show "Join Waitlist" button on full sessions in student booking page
- [x] Waitlist: show waitlist count on Admin calendar session events
- [x] Auto-confirm booking on Stripe webhook payment success (already implemented in webhook handler)
- [x] Current-time red line indicator in Day and Week calendar views
- [x] Fix 105 Clinic days everywhere: delete wrong-day DB sessions, fix generator, fix all UI labels (Mon/Wed/Fri/Sun only)
- [x] Seed DB with 105 Clinic sessions for March & April (Mon/Wed/Fri=12, Sun=24)
- [x] Persist last-used start/end time in session generator (localStorage)
- [x] Add publish reminder banner to Admin dashboard
- [x] Remove "Book a Lesson" button from homepage hero section
- [x] Wire Twilio SMS: install SDK, add credentials, send real texts on broadcast and booking notifications
- [x] Show Booking Confirmed + social share screen after ALL booking types (Stripe, cash, mental coaching, waitlist, etc.)
- [ ] Debug and fix SMS not being delivered to users
- [x] Update homepage stats: 40+ years, thousands of students, 3 coaching disciplines (Mental, Technique, Fitness)
- [x] Add user-provided photos spread throughout the app (hero bg, program cards, about section, photo gallery page)
- [x] Add second batch of 11 photos to gallery (total 21 photos now in gallery)
- [x] Fix DialogContent missing DialogTitle accessibility error on homepage (Navbar mobile sheet)
- [x] Add photos to Programs page cards (adult photo on 105 clinic)
- [x] Generate and add mental/brain graphics to Mental Coaching page
- [x] Move Tournament Attendance from Services page to Programs page
- [x] Add YouTube Shorts section to Mental Coaching page (links to @RitennisMario channel)
- [x] Embed 7 real YouTube Shorts with actual thumbnails and titles on Mental Coaching page
- [x] Fix broken Tournament Attendance card photo on Programs page
- [x] Add social media icons/links to footer and navbar (all pages) - YouTube, Instagram, Facebook, TikTok
- [x] Replace placeholder images in Social Media page with real YouTube thumbnails
- [x] Add Mario's US Open photo as avatar on all social media channel cards and user profile
- [x] Make Mario's US Open photo large and prominent on Social Media page hero section
- [x] Add Mario's US Open photo to About Mario section on homepage
- [x] Fix "Sign Up & Opt In to SMS" button on Social Media page - button is not functional
- [ ] Update WordPress site ritennisacademy.com branding to match app (colors, logo, hero, programs, About Mario, social links)
- [ ] Fix Junior Programs time to 3:30–6:30 PM on WordPress site
- [x] Fix Junior Programs time to 3:30–6:30 PM in the RI Tennis Academy app (currently shows 4:30–6:30 PM)
- [ ] Update WordPress homepage hero with new branding (black/royal blue/yellow colors, bold typography)
- [ ] Add About Mario section with US Open photo to WordPress homepage
- [ ] Add prominent Book Now button on WordPress site linking to tennispro app
- [ ] Add social media links (YouTube, Instagram, TikTok, Facebook) to WordPress site
- [x] Add "Get the App" button on WordPress homepage linking to tennispro-kzzfscru.manus.space
- [x] Add visual "Install the App" section to WordPress homepage with iPhone/Android steps
- [x] Add in-app install prompt banner that guides users to add app to home screen
- [ ] Fix contrast on WordPress install steps section - text is barely visible (light gray on white)
- [x] Move "Get the App" section to top of WordPress homepage (currently at bottom)
- [x] Fix mobile visibility of Get the App button on WordPress site
- [x] Fix 105 Game price in app: $30 → $35 per session
- [x] Fix Summer Camp day pass price in app: $100 → $90/day
- [x] Fix Summer Camp weekly price in app: $450 → $420/week
- [ ] Audit and fix all booking flow prices to match confirmed prices: 105 Game $35, Junior $80/day, Summer $90/day $420/week, Private $120/hr
- [x] Add $1 Donate One Dollar Test button to test live Stripe payment
- [x] Fix image cropping on program cards - Private Lessons and Mental Coaching faces cut off
- [x] Add floating contact button (email ritennismario@gmail.com + phone 401-965-5873) visible on all pages
- [x] Move Install App banner to top of homepage next to "Rhode Island's Premier Tennis Academy" tagline
- [x] Build Schedule page: private lesson slots and 105 Game availability with day/week/month/year views
- [x] Add Schedule link to main navigation
- [x] Fix Install App button: make it small, round, move to navbar right side (not in hero)
- [x] Fix Private Lessons card image crop to show player face (object-position adjustment)
- [x] Rebuild Schedule page: day view with 7AM-8PM hourly slots (occupied/Free labels), month view with session dots on busy days
- [x] Remove $1 donation test button from homepage
- [x] Add $0 free test session booking option for testing the full booking flow (via promo codes)
- [x] Add promoCodes table to DB schema (code, discountType, discountValue, maxUses, usedCount, expiresAt, programTypes)
- [x] Add server procedures: createPromoCode (admin), listPromoCodes (admin), deletePromoCode (admin), validatePromoCode (public)
- [x] Add promo code input to booking checkout flow (validate + apply discount, bypass Stripe if 100% off)
- [x] Build Admin Promo Codes management page (create/view/delete codes)
- [x] Add round Download App button to top-right corner of homepage hero section
- [x] Add social media icons/handles to top-left corner of homepage hero section
- [x] Replace social pill buttons with circle profile photo style (Mario US Open photo + platform badge) for YouTube, Instagram, Facebook, X, TikTok
- [x] Fix social media circles overlapping Download the App button on mobile (circles too wide)
- [x] Create TESTFREE promo code in DB (100% off, unlimited uses, all program types)
- [x] Polish Download the App button: smaller yellow area, shadow/gradient depth, pressed-state feel
- [x] Redesign booking slot picker: calendar month view to pick date, then show time slots for selected day only
- [x] Fix calendar bleeding over booking form fields (z-index / layout containment issue)
- [x] Fix calendar not showing available dates even though slots exist in DB
- [x] Fix time slots not showing after picking a date on 105 Clinic calendar
- [x] Fix booking submission error
- [x] Fix time slots not appearing after clicking a date on 105 Clinic calendar
- [x] Auto-scroll to time slots section when a date is picked on the calendar
- [x] Fix stray "0" showing next to date in booking form date badge
- [x] Add time preference selector (Morning/Afternoon/Evening) to Private Lesson booking
- [x] Replace Morning/Afternoon/Evening buttons with hourly time grid (6 AM – 7 PM) for private lesson
- [x] Show already-booked private lesson times as "Booked" (grayed out) on hour grid
- [x] Admin can block specific hours on specific dates for private lessons
- [x] Blocked times show as "Unavailable" (grayed out) on student hour grid
- [x] Add student-facing "Cancel Booking" button on Profile page (pending/confirmed bookings only)
- [x] Fix Schedule page showing empty even when user has booked lessons
- [x] Private lesson bookings should appear on the Schedule page
- [x] Send booking confirmation email to student after successful booking
- [x] Junior Programs: add 1–5 day selector so students can pay for multiple days in one checkout ($80 × days)
- [x] Fix Schedule page: Junior Program (and other non-private-lesson) bookings not showing
- [x] Junior Programs: replace day-count selector with multi-day date picker (select specific days)
- [x] Fix: Junior Program bookings not showing on Schedule page after multi-day picker refactor
- [x] Fix: Schedule Day view shows nothing even though Week view shows bookings correctly
- [x] Fix: 105 Game Clinic shows "Full" incorrectly even when not enough participants have signed up
- [x] Fix: 105 Game Clinic bookings not showing in Schedule Day view (Week view works fine)
- [x] Feature: Jump-to-date picker on Schedule page
- [x] Feature: Show clinic start/end time on booking confirmation email
- [x] Feature: Admin Recalculate Counts button for participant sync
- [x] Feature: Newsletter DB schema (subscribers, newsletters, sent_log tables)
- [x] Feature: Admin Newsletter Composer page with preview + send
- [x] Feature: Newsletter sections: programs/schedule/cost, tennis tip, mental tip, winner spotlight, best practices
- [x] Feature: March 16 restart newsletter draft and send
- [x] Feature: Twice-weekly automated newsletter (Tue + Fri)
- [ ] Fix: Redesign newsletter email template to look professional and on-brand (RI Tennis Academy colors, clean layout)
- [x] Newsletter feature rebuilt inside main app: compose/preview/send, AI generate, history, subscriber management (bulk CSV import), premium navy/gold email template
- [x] Remove newsletter feature completely from the app (moving to separate project)
- [x] Fix Twilio SMS delivery — upgraded Twilio to paid account, tested live send to +14019655873, confirmed working
- [x] Audit and fix all booking prices: fixed Clinic 105 ($30->$35), Junior Daily ($0->$80), added Junior Weekly ($350), Summer Camp Daily ($90), Summer Camp Weekly ($420) to DB
- [x] Fix booking email: changed heading to "Booking Request Received" and body copy to clarify pending state
- [x] Add confirmation email + SMS to student when admin confirms a booking (confirmNow procedure updated)
- [x] Phone number field already in profile page — confirmed present and saving correctly
- [x] Fix: Admin Dashboard Confirm button now uses confirmNow (sends confirmed email + SMS) instead of updateStatus

## Follow-up Features (Session 3)
- [x] Add cancellation notification: when Mario cancels a booking, send cancellation email + SMS to student
- [x] Add Remind button: one-click SMS reminder to student the day before their lesson
- [x] Wire Cancel button in Admin Dashboard to new cancelNow procedure (email + SMS)
- [x] Wire Cancel button in Admin Schedule to new cancelNow procedure (email + SMS)
- [x] Add Remind button to Admin Dashboard booking rows
- [x] Add Remind button to Admin Schedule booking rows

## UX Redesign (Session 4 — Overnight Overhaul)
- [x] Research top tennis booking apps (Tennis Australia, PlayYourCourt, CourtReserve, Picktime) for UX best practices
- [x] Redesign global CSS: premium dark navy/royal blue/tennis yellow design system, Inter + Bebas Neue fonts
- [x] Rebuild Homepage: asymmetric hero, live stats counter, next-available-sessions widget, programs grid, testimonials, gallery CTA
- [x] Redesign Navbar: sticky with blur backdrop, social icons, Book Now CTA button, improved mobile menu
- [x] Redesign Footer: 4-column layout with quick links, contact info, social icons, newsletter opt-in
- [x] Redesign Programs page: improved card layout with photos, program type badges, price callouts
- [x] Improve BookingPage: step-indicator wizard UI (Sign In → Pick Date → Confirm & Pay), better order summary sidebar
- [x] Improve booking confirmation screen: celebratory design with social share, next steps, and back-to-home CTA
- [x] Add QuickBook floating widget: accessible from any page, pre-fills program selector, links to booking flow
- [x] Add Book Now button to Navbar (desktop and mobile)
- [x] Improve Profile page: better booking history with upcoming vs past sessions, color-coded status badges
- [x] Fix date formatting in Profile page: gracefully handle null/invalid dates (show "Date TBD" instead of "Invalid Date")
- [x] Improve Admin Dashboard: show program names instead of "Program #2" (join programs table in adminList query)
- [x] Add mobile-first CSS improvements: better touch targets, smoother animations, scroll behavior
- [x] Improve Schedule page header: premium look with live stats, quick-book CTA

## Continuous Improvement (Session 5 — Keep Going Until Perfect)
- [x] Update hero headline to "Elevate Your Game. Master Your Mind." (two-line bold style)
- [x] Add Refer-a-Friend card on booking confirmation screen (copy referral link)
- [x] Add animated counter stats on homepage (IntersectionObserver, counts up on scroll)
- [x] Add testimonials section with 6 player reviews on homepage (5-star ratings)
- [x] Add FAQ accordion section on homepage (8 common questions)
- [x] Add sticky mobile bottom bar (Home, Schedule, Book, Profile)
- [x] Improve Programs page: add "Most Popular" and "Best Value" badges
- [x] Add Program Comparison Table to Programs page
- [x] Add testimonials strip to Programs page (3 player reviews)
- [x] Add social proof counter on booking page ("X people booked this week")
- [x] Add Cancellation Policy + What to Bring checklist to booking sidebar
- [x] Add Next Session countdown banner to Profile page
- [x] Add Revenue Breakdown + Quick Actions panels to Admin Dashboard
- [x] Admin Dashboard shows real program names instead of IDs
- [x] MentalCoaching page FAQ accordion + testimonials strip
- [x] Footer "Ready to Elevate Your Game?" CTA strip
- [x] Location section with Google Maps embed on homepage
- [x] Bottom padding for mobile bottom bar content overlap fix

## Round 3 Features (Session 6)

- [x] Newsletter Manager: AI-powered compose/send, history, subscriber count, admin page at /admin/newsletter
- [x] Player Leaderboard: most active players, top performers, social proof page at /leaderboard
- [x] Gift a Session: purchase session as gift, Stripe checkout, gift card redemption flow at /gift-card
- [x] Admin Dashboard Quick Actions: Newsletter + Leaderboard buttons added
- [x] Footer: Leaderboard + Gift a Session links added
- [x] Navbar: Leaderboard link added to nav

## Round 4 Features (Session 7)

- [x] Voice Booking Assistant: floating mic button + hero "Voice Book" button, records audio, Whisper transcription, AI intent parsing, availability check, redirect or alternatives popup
- [x] Book Again shortcut on Profile page past bookings
- [x] ECONNRESET retry handling for reminder scheduler
- [x] multer installed for audio file uploads
- [x] /api/voice-upload endpoint added to Express server
- [x] voiceBooking router: transcribe + parseAndCheck procedures
- [x] open-voice-booking custom event wired between hero button and VoiceBooking modal

## Round 5 Features (Session 8)

- [x] Tip of the Week widget on homepage (mental coaching tip from DB, rotating weekly)
- [x] Coach Availability Calendar on Schedule page (color-coded dots: green=available, amber=limited, red=full)
- [x] Student Progress Dashboard on Profile page (milestone tracker 🎾→⭐→🏆→🥇, progress bar, program breakdown, total invested)
- [x] Admin Analytics tab: Revenue by Program (bar chart), Top Students leaderboard, Monthly Booking Trends (6-month bar chart)
- [x] admin.getAnalytics procedure: revenue by program, monthly trends, top students by session count

## Newsletter Bugs (Session 9)

- [x] Fix: Newsletter save/draft button not working (form fills but doesn't save)
- [x] Fix: AI Generate button not clickable / not responding
- [x] Fix: Newsletter send button not working
- [x] Fix: Newsletter form end-to-end flow (create draft → AI generate → preview → send)

## Voice Booking Fix (Session 9)

- [x] Fix: Voice booking date/time not pre-filling on booking form after redirect (e.g. "March 22 at 11 AM" should auto-populate the date picker and time on the BookingPage)

## Follow-up Features (Session 10)

- [x] Voice Confirm & Book one-tap button (skip form for logged-in users after voice slot confirmation)
- [x] Newsletter subscriber opt-in checkbox on booking confirmation page
- [x] Coach Notes per booking (admin-only notes on each booking in Admin Dashboard)
- [x] Redesign voice booking button as large, prominent, round hero button on homepage (not just floating icon)

## Voice Button Redesign (Session 11)
- [x] Redesign voice button: round circle with yellow ring outline + mic icon, placed inline with CTA buttons, "Book by Voice" text below

## Voice Button Position (Session 11b)
- [x] Move mic button to right side of hero, below the "Download App" button

## Layout Bugs (Session 12)
- [x] Remove stray green circle button appearing above "Contact Mario" button
- [x] Fix mobile layout: Download App + mic button overlapping social icons and hero text

## QuickBook Bug (Session 13)
- [x] Fix: quickBook procedure trying to INSERT new program row instead of looking up existing program by type

## Voice QuickBook Type Bug (Session 14)
- [x] Fix: AI returns "private" instead of "private_lesson" causing NOT_FOUND error in quickBook — add alias normalization
- [x] Change "Confirm & Book Instantly" to redirect to pre-filled booking form (with promo code support) instead of instant-booking
