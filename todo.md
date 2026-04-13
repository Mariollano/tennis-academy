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

## Email Fix (Session 15)
- [x] Fix booking confirmation email: add "Time" row to Booking Summary (currently only shows Date, missing Time)

## Label & Voice Fix (Session 16)
- [x] Fix "RESERVE QUICKLY" label: bold white text with dark semi-transparent pill background so it's always visible on any background
- [x] Fix voice booking button not working on published site (investigate production issue)
- [x] Fix voice booking microphone button not working on live site when opened in real browser
- [x] Fix booking confirmation email missing lesson Time field (server now extracts time from sessionStartTime, sessionEndTime, or notes fallback)
- [x] Fix navbar: tighten line-height on multi-word items (My Schedule, Mental Coaching), bold font, uppercase, whitespace-nowrap
- [x] Fix voice booking email: include lesson time when booked via microphone (added email+SMS sending to quickBook procedure)
- [x] Navbar: shift nav items to the left (justify-start ml-4)
- [x] Integrate Resend as email provider (replace Gmail/SMTP with Resend API)
- [x] Fix Facebook share URL to use tennispromario.com instead of dev URL
- [x] Add Open Graph meta tags to index.html for proper social media preview cards (og:url, og:site_name, twitter:title, twitter:description, twitter:image)
- [x] Create custom 1200x630 Open Graph preview image for social sharing (tennispromario.com)
- [x] Improve share section after booking confirmation (fixed referral URL, updated motivational copy)
- [x] Regenerate OG image with Coach Mario's actual photo instead of silhouette
- [x] Add Facebook Page link in footer and navbar social icons (facebook.com/RITennisAcademy) — already present
- [x] Add post-booking SMS share "Text a Friend" button in BookingPage confirmation (sms: protocol)

## Overnight Improvements (Mar 9-10, 2026)
- [x] Fix voice booking email: permanently fix time not showing when booked via microphone
- [x] Add Google Review button on booking confirmation page (links to ri tennis academy Google Maps place)
- [x] Build Share to Stories feature with 9:16 story card for Instagram/Facebook (canvas-based, download + Web Share API)
- [x] Fix JSX syntax error in BookingPage.tsx (StoryCard modal outside Fragment)
- [ ] Additional UX improvements across the site

## Continuous Build (Session 19 — No Stopping)
- [x] Post-booking SMS confirmation to student (date, time, program, "Reply STOP to unsubscribe")
- [x] Resend email integration (replace Gmail/SMTP, better deliverability + tracking, using getroger.biz domain)
- [x] Referral discount promo code: auto-generate unique code for referrer when referred friend books (20% discount, email+SMS reward)
- [x] Student SMS on Stripe payment confirmed webhook
- [x] Real referral link with unique code shown on booking confirmation screen
- [x] Additional UX polish pass (referral card on Profile page, ?ref= URL capture in localStorage, OAuth returnPath redirect, state format updated to JSON)

## Session 20 — Login Fix + Announcements
- [x] Fix OAuth login 404 bug (new JSON state format breaking OAuth SDK callback) — reverted to simple btoa(redirectUri) state
- [x] Build Announcements broadcast system (admin posts rain cancellations, schedule changes)
- [x] Student in-app notification inbox (unread badge, mark as read, Bell icon in navbar)
- [x] Broadcast email + SMS to all students when announcement is posted
- [x] Post Announcement quick action button added to Admin Dashboard

## Session 21 — WordPress Fixes
- [ ] Move "Get the App" section back below the hero on WordPress homepage (tennis girl photo should be first)
- [ ] Fix yellow-green link contrast in WordPress install steps section (hard to read on white background)

## Session 22 — SMS Hide + Categories + WordPress
- [x] Hide SMS features from UI (keep code, disable from user-facing elements)
- [x] Add announcement categories (Rain Cancellation, Schedule Change, General Update, Event, Urgent, Rain Cancellation)
- [x] Enhance announcements UI: mark all as read button, count badges on filters, priority indicators, improved visual hierarchy
- [x] Add My Promo Codes section to Profile page (shows earned referral reward codes with expiry dates)
- [x] Add native share buttons to referral card (WhatsApp, Text/SMS, native Web Share API)
- [ ] Update WordPress install links from tennispro-kzzfscru.manus.space to tennispromario.com
- [ ] Add "Book a Lesson" button to WordPress homepage linking to app booking page

## Session 23 — Login Fix
- [x] Fix OAuth login 404: add www → no-www canonical redirect so login URL is always consistent
- [x] Add error handling in OAuth callback to show a user-friendly error page instead of 404
- [x] Fix cross-domain OAuth: use manus.space as OAuth redirect URI, pass session token to tennispromario.com via /api/oauth/set-session endpoint

## Session 24 — Mic Hide + Email Fix
- [x] Hide voice booking microphone button from UI (keep code, just hide the button)
- [x] Fix booking confirmation email to always include session date and time for voice bookings (timePreference now passed for all program types, not just private_lesson)

## Session 25 — Scroll Fix
- [x] Fix Programs page: clicking Programs link should land at top of page, not bottom (added global ScrollToTop component in App.tsx)

## Session 26 — OAuth Redirect Fix
- [x] Fix OAuth: after login on manus.space, redirect user back to tennispromario.com correctly (use x-forwarded-host to detect domain, always cross-domain redirect unless explicitly on tennispromario.com)

## Session 27 — Newsletter Archive
- [x] Add newsletter database table with slug, htmlContent (mediumtext), season, publishedAt fields
- [x] Add public listPublished and getBySlug tRPC procedures
- [x] Build public Newsletter Archive page (/newsletter)
- [x] Build individual Newsletter View page (/newsletter/:slug) with shareable URL
- [x] Add Newsletter link to Navbar
- [x] Seed Spring 2026 newsletter from uploaded HTML file
- [x] Add newsletter management (publish/unpublish, view, copy link) to Admin Newsletter page
- [x] Add "Pay Cash / Pay by Check at lesson time" payment option to booking flow
<<<<<<< Updated upstream
- [x] Fix OAuth login URL to use canonical domain tennispromario.com (fix1-const.ts)
- [x] Fix Stripe checkout to pass actual bookingId from server (fix2-BookingPage.tsx)
- [x] Fix Stripe checkout redirect to return to booking page confirmation screen (fix3-stripeRouter.ts)
- [x] Update CANONICAL_OAUTH_ORIGIN to https://www.tennispromario.com (with www)
=======
- [x] Fix #5a: Wrong private lesson price in email template ($75 → $120/hr)
- [x] Fix #5b: Wrong mental coaching price in email template ($75/hr → Contact for pricing)
- [x] Fix #5c: AI chat FAQ missing private lesson price
- [x] Fix #6: Booking ID race condition — use insertId instead of re-querying
- [x] Fix #7: getUnavailableHours date comparison fails silently in MySQL
- [x] Fix #8: Admin sendPaymentLink redirects to /profile with no confirmation
- [x] Revert OAuth const.ts to use manus.space callback URL (www.tennispromario.com not registered)
- [x] Revert CANONICAL_OAUTH_ORIGIN to https://tennispro-kzzfscru.manus.space and verify cross-domain redirect
- [x] OAuth workaround: always route Sign In through manus.space, redirect back to www.tennispromario.com
- [x] Fix #9: Move set-session to /oauth/set-session (outside /api/) to bypass CDN interception
- [x] Fix #10: Guest booking — allow booking without login (name + email only)
- [x] Fix guest booking email: switch from Resend/getroger.biz to Gmail for better deliverability
- [x] Fix navbar overflow-x bug and add overflow-x:hidden to body/html

## Newsletter Enhancements (Mar 14)
- [x] Upload new newsletter HTML from Admin panel (replaces /newsletter/latest)
- [x] Back-to-site banner injected at top of /newsletter/latest page
- [x] Newsletter Archive link added to navbar (already present)

## Newsletter Latest Fix (Mar 14)
- [x] Store newsletter HTML in S3 (not local file) so it survives deploys
- [x] Update /newsletter/latest route to fetch from S3
- [x] Seed initial newsletter HTML into S3
- [x] Update admin upload endpoint to write to S3 instead of local file

## Apple Calendar Sync (Mar 15, 2026)
- [x] Add ical_sync_settings table to store the iCal URL and last sync timestamp
- [x] Install node-ical package for parsing .ics feeds
- [x] Build server-side iCal fetcher that parses Apple Calendar events
- [x] Auto-create blocked_times entries from Apple Calendar events
- [x] Add 30-minute sync scheduler
- [x] Add Admin panel UI: paste iCal URL, manual sync button, last sync status
- [x] Show sync'd Apple Calendar blocks as "Unavailable" in the booking calendar
- [x] Add vitest tests for iCal sync service

## iCal Sync Debug (Mar 19, 2026)
- [x] Diagnose: Apple Calendar events not blocking times in app booking page
- [x] Fix: webcal:// protocol not supported by fetch() — convert to https:// at save time AND at sync time
- [x] Fix: blockedHours loop used <= endH causing over-blocking — now uses correct boundary logic
- [x] Root cause #1: No iCal URL was ever saved in the DB (ical_sync_settings table empty)
- [x] Root cause #2: webcal:// URLs silently fail because fetch() only supports http/https

## iCal Sync 0 Blocks Bug (Mar 16, 2026)
- [x] Diagnose why 2017 events found but 0 blocks created
- [x] Fix date filtering / event type filtering in icalSync.ts
- [x] Verify blocked_times rows are created after fix

## iCal Sync Partial Blocking Bug (Mar 16, 2026)
- [x] Inspect which 14 blocks were created and which days are missing
- [x] Fix: recurring events not being expanded (rrule events need date expansion)
- [x] Rewrote icalSync.ts to expand recurring events using rrule library (141 future occurrences found)
- [x] All 63 tests still passing after fix

## iCal Sync Timezone Bug (Mar 16, 2026)
- [x] Fix: iCal events stored in UTC instead of Eastern time (4 hour offset — 9 AM shows as 5 PM)
- [x] Fixed toTimeString() and toDateString() to use Intl.DateTimeFormat with America/New_York timezone
- [x] Re-sync after fix and verify March 23 shows 9 AM and 3:30 PM blocked correctly

## iCal Sync Wednesday Missing Blocks (Mar 16, 2026)
- [x] Diagnose: Wednesday March 18 missing 105 clinic (9 AM), Ethan (2:15 PM), Clinic (4 PM)
- [x] Root cause: MySQL DATE columns return midnight UTC; toDateStringEastern() was converting midnight UTC → March 17 Eastern (1 day off), causing cleanup to miss old blocks
- [x] Fix: cleanup now uses .toISOString().substring(0,10) to get UTC date string (matches MySQL DATE storage)
- [x] Fix: insertBlocksForOccurrence now uses Eastern date strings for iteration, stores blockedDate as midnight UTC
- [x] Verified: March 17 shows 9 AM + 10 AM (105 clinic) + 2 PM + 3 PM (Ethan) ✓
- [x] Verified: March 18 shows 9 AM (New Event), 11 AM-1 PM (Haircut), 2 PM-3 PM (Ethan), 4 PM-7 PM (Junior program) ✓
- [x] All 67 tests passing after fix

## Schedule Junior Program Bug (Mar 16, 2026)
- [x] Fix: Junior Program sessions (weekdays 3:30–6:30 PM) not showing on Schedule page
- [x] Root cause: schedule_slots table was empty (no slots seeded) AND listAvailableMulti only queried clinic_105 + private_lesson
- [x] Fix: Added generateJuniorSlots server procedure (Mon–Fri, configurable time/capacity)
- [x] Fix: Updated listAvailableMulti to include junior_daily + junior_weekly program types
- [x] Fix: Updated Schedule page allSlots merge to include junior_daily + junior_weekly slots
- [x] Fix: Added Book button for Junior Program slots on Schedule page
- [x] Fix: Added Generate Junior button + dialog to Admin Schedule page
- [x] Seeded 67 Junior Program slots (Mon–Fri 3:30–6:30 PM) from Mar 16 to Jun 16, 2026

## iCal Sync Color Filtering Bug (Mar 16, 2026)
- [x] Check if iCal sync filters/skips events based on Google Calendar color
- [x] Confirmed: NO color-based filtering exists — all events have color="none" and are processed equally
- [x] Root cause of wrong times: stale DB data from pre-fix syncs; latest sync stores correct Eastern times
- [x] Verified: 105 clinic = 09:00-10:30, Junior program = 15:30-18:30 (3:30-6:30 PM) ✓

## Junior Program 3:30 PM Blocking Bug (Mar 17, 2026)
- [x] Fix: Junior Program 3:30–6:30 PM — hardcoded permanent rule blocks hours 15–18 on all weekdays
- [x] Verify: booking page shows 3 PM, 4 PM, 5 PM, 6 PM all blocked on weekdays for Junior Program
- [x] Confirmed: booking page shows whole-hour slots only (no :30 intervals), 3 PM slot correctly blocked

## Junior Program Permanent Blocking Rules (Mar 17, 2026)
- [x] Block 3:30–6:30 PM (hours 15, 16, 17, 18) on ALL weekdays (Mon–Fri) permanently
- [x] Block 12:00–3:00 PM (hours 12, 13, 14) on ALL Sundays permanently
- [x] These rules are independent of iCal sync — hardcoded in getUnavailableHours

## 105 Clinic Permanent Blocking Rule (Mar 17, 2026)
- [x] Block 9:00–10:30 AM (hours 9 and 10) on Mon/Wed/Fri/Sun permanently
- [x] Hardcoded in getUnavailableHours, independent of iCal sync

## iCal Timezone Still Wrong After Fix (Mar 17, 2026)
- [x] Diagnosed: Carol stored on March 20 (should be March 21), Audrey stored on March 19 (should be March 20) — was stale DB data
- [x] Confirmed via DEBUG-INSERT logs: insert was writing correct dates (Carol=2026-03-21, Audrey=2026-03-20)
- [x] After full sync with new code: Carol=2026-03-21 (Sat) ✓, Audrey=2026-03-20 (Fri) ✓
- [x] JUNIOR PROGRAM=15:30-18:30 ✓, 105 clinic=09:00-10:30 ✓
- [x] Verified March 17-25 blocks match Google Calendar exactly
- [x] Removed debug logging from icalSync.ts
- [x] All 68 tests passing

## Booking Time Slots & iCal Timezone Bugs (Mar 17, 2026)
- [x] Fix: booking time slots now show every 30 minutes (6:00 AM to 7:30 PM, 28 slots total)
- [x] Fix: iCal sync now uses floatingToRealUTC() with getEasternOffsetMs() — server-TZ-independent, works in UTC
- [x] Fix: getUnavailableHours now returns bookedSlots/blockedSlots as HH:MM strings (not integer hours)
- [x] Fix: slotsInRange() generates 30-min slot strings from startTime to endTime
- [x] Fix: permanent program rules (105 Clinic, Junior Program) also use slotsInRange()
- [x] Verified: DB now shows correct Eastern times (09:00, 15:30, etc.) after re-sync
- [x] All 68 tests passing

## iCal Sync Incorrect Blocks Bug (Mar 17, 2026)
- [x] Identify which iCal events are causing 11 AM–2 PM to be blocked on Friday March 20 (not in Google Calendar)
- [x] Confirmed: personal appointments DO block bookings (correct behavior per Mario)
- [x] Fix: recurring events (JUNIOR PROGRAM) stored with UTC times (19:30) instead of Eastern (15:30) — rrule.between() returns UTC dates that need Eastern conversion
- [x] Fix: use toFloatingEastern(event.start) as dtstart for rrulestr, then fromFloatingEastern() on each occurrence to get correct real UTC
- [x] Added new vitest test: recurring events use floating Eastern dtstart so occurrences have correct Eastern times
- [x] Verified: Junior program now shows 15:30–18:30 (3:30–6:30 PM Eastern) on all weekdays ✓
- [x] Verified: JUNIOR PROGRAM (Sunday) shows 12:00–15:00 (noon–3 PM Eastern) ✓
- [x] All 68 tests passing after fix

## iCal Sync Definitive Timezone Fix (Mar 17, 2026)
- [x] ROOT CAUSE CONFIRMED: dateStringToMidnightUTC used midnight UTC (T00:00:00Z) but MySQL connection TZ is Eastern (UTC-4)
- [x] midnight UTC = 8 PM Eastern (previous day) → MySQL stored 2026-03-19 instead of 2026-03-20
- [x] FIX: Use noon UTC (T12:00:00Z) = 8 AM Eastern, safely within correct calendar day regardless of DST
- [x] FIX: Deletion filter now uses SQL DATE_FORMAT() instead of JS toISOString() to avoid TZ issues
- [x] FIX: Luxon used for rrule floating occurrence → real UTC conversion (DST-safe, server-TZ-independent)
- [x] Verified: Audrey=2026-03-20 (Fri 8 AM) ✓, Carol=2026-03-21 (Sat noon) ✓, JUNIOR PROGRAM=15:30-18:30 ✓
- [x] All 68 tests passing

## Calendar Discrepancies vs Google Cal Screenshots (Mar 17, 2026)
- [x] Compare DB blocks for Mar 17-20 precisely against Google Calendar screenshots
- [x] Mar 17 (Tue): Look at fidelity investing 9-10AM ✅ (now fixed — was missing because event ended before sync ran)
- [x] Mar 18 (Wed): 105 9-10:30AM ✅, Ethan 2:15-3:15PM ✅
- [x] Mar 19 (Thu): Haircut 11:15AM-2PM ✅, Ethan 2:15-3:15PM ✅, Junior program 3:30-6:30PM ✅
- [x] Mar 20 (Fri): Audrey and Katie 8-9AM ✅, 105 9-10:30AM ✅, JUNIOR PROGRAM 3:30-6:30PM ✅
- [x] Note: "Let's gooo", "UP!!", "Come on!!", "Pick up Faye" are on a different Google Calendar (not in the synced iCal feed)
- [x] Fix: changed single event filter from `end < now` to `end < startOfTodayEastern` so events earlier today are included
- [x] Fix: changed recurring event floatingNow to use start-of-today so recurring events earlier today are not missed

## Google Calendar Push (Write-back)
- [ ] Research Google Calendar API OAuth2 approach for server-side event creation
- [ ] Add Google Calendar API credentials (client ID, client secret, refresh token) to secrets
- [ ] Implement createCalendarEvent() helper in server that writes to Mario's Google Calendar
- [ ] Call createCalendarEvent() when a booking is confirmed (new booking + admin confirm action)
- [ ] Call createCalendarEvent() when a manual booking is created by admin
- [ ] Delete/update calendar event when booking is cancelled or rescheduled
- [ ] Test end-to-end: confirm booking → event appears in Google Calendar

## Slot Blocking Bug (Mar 19, 2026)
- [x] Ethan 2:15-3:15 PM on Mar 18 not blocking any slots in the app — fixed by rounding event start DOWN to nearest 30-min boundary
- [x] 10:00 AM correctly blocked (105 ends at 10:30, lesson at 10:00 runs to 11:00 which overlaps) — was correct
- [x] Fix slot overlap logic to handle non-round-hour iCal event start/end times correctly

## Guest Booking Flow Audit (Mar 30, 2026)
- [x] Audit full guest booking flow for all program types
- [x] BUG FIXED: stripe.createCheckout was protectedProcedure — guests (not logged in) got auth error when trying to pay by card → changed to publicProcedure
- [x] BUG FIXED: Stripe webhook handler failed silently for guests — parseInt('guest') = NaN, so booking was never confirmed after payment → now looks up userId from booking record when user_id metadata is not a number
- [x] BUG FIXED: BookingPage now passes guestEmail/guestName to createCheckout so Stripe prefills customer info
- [x] Guest flow verified: guest enters name/email → booking.create (publicProcedure) creates guest user + booking → stripe.createCheckout (now public) creates session → Stripe webhook confirms booking and records payment

## Price & Payment Options Update (Apr 1, 2026)
- [ ] Update private lesson price from $120 to $125 everywhere (pages, routers, Stripe, master prompt)
- [ ] Add Venmo, Zelle, Cash App as payment options alongside cash in booking flow
- [x] Update private lesson price from $120 to $125 everywhere (BookingPage, Home, Programs, QuickBook, routers.ts, newsletter.ts, voiceBooking.ts, newsletter-latest.html)
- [x] Add Venmo, Zelle, Cash App to cash payment option label, description, reminder banner, confirmation message, and payment due badge
- [x] Fix 105 Game booking page showing "No sessions scheduled yet" — generated 104 sessions for Apr-Sep 2026 (Mon/Wed/Fri cap 12, Sun cap 24, 9:00-10:30 AM)
- [x] Fix 105 Clinic sessions showing wrong days (Tue/Sat appearing) — root cause was UTC timezone shift in seed script; fixed to use UTC day arithmetic; deleted and regenerated 105 sessions for Apr-Sep 2026 with correct Mon/Wed/Fri/Sun days

## Bug Fixes
- [x] Private lesson calendar: show blocked/unavailable dates highlighted in red so students don't pick them
- [x] Private lesson booking: make time slot section more visually prominent after date selection
