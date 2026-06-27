# RI Tennis Academy — Project Brain

> Copy this file into a new chat session to give the AI full context about the project.

---

## Project Identity

- **App name:** Tennis Academy Pro (tennispromario.com)
- **Owner / Head Coach:** Mario Llano
- **Academy name:** RI Tennis Academy
- **Location:** Rhode Island
- **Phone (text-to-book):** (401) 965-5873
- **Manus project name:** `tennis-academy`
- **Project path:** `/home/ubuntu/tennis-academy`
- **Live domains:** `tennispromario.com`, `www.tennispromario.com`, `tennispro-kzzfscru.manus.space`
- **Latest checkpoint:** `6ea97ca4`
- **Stack:** React 19 + Tailwind 4 + Express 4 + tRPC 11 + Drizzle ORM + MySQL (TiDB)
- **Features enabled:** `db`, `server`, `user` (Manus OAuth), Stripe (live + test keys)

---

## Programs & Pricing

| Program | Price | Schedule / Notes |
|---|---|---|
| 105 Game (adult clinic) | $35/session | Mon/Wed/Fri + Sun, 9:00–10:30 AM, max **12 players** |
| Private lesson | $125/hr | 1-on-1 with Coach Mario |
| Semi-private lesson | $15/person | Group private |
| Junior summer — half-day | $99/day · $495/week | 9 AM–2 PM |
| Junior summer — full day | $125/day · $125/day · $625/week | 9 AM–5 PM |
| Junior drop-in hourly | **$30/hour** | Text Mario day before to book |
| Summer camp half-day | $99/day · $495/week | 9 AM–2 PM |
| Summer camp full day | $125/day · $625/week | 9 AM–5 PM |
| After-camp add-on | +$26/day | After summer camp |
| Doubles League | $15/session | Tue/Thu 6:30–8 PM & Sat 9–11 AM, all levels, unlimited players |
| Mental coaching | Contact for pricing | "Delete Fear" methodology |
| Tournament attendance | $50/hr + $25/hr travel | Shareable |
| Racquet stringing | $35 (Mario's string) / $25 (customer's string) | |
| Merchandise | Sweatshirts $50 · T-shirts $25 | |

> **Important:** Fall & Spring junior programs are **over**. Only summer pricing applies.
> Junior hourly drop-in is $30/hour — text Mario at (401) 965-5873, preferably the day before.

---

## 105 Game Capacity

- **Max participants per slot: 12** (raised from 8 in June 2026)
- The code defaults are already set to 12 in `server/routers.ts`
- **Existing DB slots** may still show capacity 8 — a SQL update is needed:
  ```sql
  UPDATE scheduleSlots SET maxParticipants = 12 WHERE programId = 1 AND maxParticipants < 12;
  ```
  *(The DB tool had a connection error last session — this still needs to be run successfully)*
- When a session is full, the participant list ("Who's On Court With You 🎾") is now shown so users can see who is booked in

---

## Key Pages

| Route | File | Notes |
|---|---|---|
| `/` | `Home.tsx` | Hero has 3D yellow "☀️ 2026 Summer Program" floating button |
| `/book/:programType` | `BookingPage.tsx` | Main booking flow; shows participant list on full sessions |
| `/summer-camp` | `SummerCamp.tsx` | Dedicated summer camp page; has $30/hr card, flexibility banner, text-to-book |
| `/programs` | `Programs.tsx` | All programs overview |
| `/schedule` | `Schedule.tsx` | Public schedule calendar |
| `/mental-coaching` | `MentalCoaching.tsx` | Delete Fear methodology |
| `/doubles-league` | `DoublesLeague.tsx` | Doubles league signup |
| `/leaderboard` | `Leaderboard.tsx` | Player leaderboard |
| `/social` | `SocialFeed.tsx` | Social feed |
| `/gallery` | `Gallery.tsx` | Photo gallery |
| `/gift-card` | `GiftCard.tsx` | Gift card purchase |
| `/announcements` | `Announcements.tsx` | Academy announcements |
| `/profile` | `Profile.tsx` | User profile & bookings |
| `/admin` | `AdminDashboard.tsx` | Admin panel (role-gated) |
| `/admin/schedule` | `AdminSchedule.tsx` | Schedule management |
| `/admin/newsletter` | `AdminNewsletter.tsx` | Newsletter management |

---

## Server Routers

| File | Handles |
|---|---|
| `server/routers.ts` | Main router: auth, schedule, booking, AI chat, admin, SMS, email |
| `server/routers/doublesLeague.ts` | Doubles league sessions & signups |
| `server/routers/giftCards.ts` | Gift card purchase & redemption |
| `server/routers/icalSync.ts` | iCal calendar sync (blocks Mario's personal calendar time) |
| `server/routers/leaderboard.ts` | Player points & leaderboard |
| `server/routers/newsletter.ts` | Newsletter send/archive |
| `server/routers/voiceBooking.ts` | Voice/AI booking assistant |

---

## Database Schema (key tables)

| Table | Purpose |
|---|---|
| `users` | Manus OAuth users; `role`: `admin` \| `user` |
| `programs` | Program definitions (type, price, season) |
| `scheduleSlots` | Individual bookable sessions; `maxParticipants` defaults to 12 |
| `bookings` | All bookings; status: `confirmed` \| `pending` \| `cancelled` |
| `payments` | Stripe payment records |
| `blockedTimes` | Admin-blocked time ranges (iCal sync writes here) |
| `sessionWaitlist` | Waitlist for full sessions |
| `promoCodes` | Discount codes |
| `newsletters` | Newsletter issues |
| `giftCards` | Gift card records |
| `referrals` | Referral tracking |
| `announcements` | Academy announcements |
| `doublesLeagueSessions` | Doubles league sessions |
| `doublesLeagueSignups` | Doubles league participant signups |
| `icalSyncSettings` | iCal URL for Mario's calendar |

---

## Design System

- **Theme:** Dark navy (`#0a2240`) primary, green accent (`#4a9c5d`), amber/gold (`#f59e0b`) for highlights
- **Font:** Custom (set in `client/index.html` via Google Fonts CDN)
- **Global styles:** `client/src/index.css` — Tailwind 4, OKLCH color tokens
- **UI library:** shadcn/ui (`@/components/ui/*`)
- **ThemeProvider:** Dark theme by default

---

## Integrations

| Integration | Status | Notes |
|---|---|---|
| Stripe | Live + test keys configured | Webhook at `/api/stripe/webhook` |
| Manus OAuth | Active | Login via Manus portal |
| Twilio SMS | Configured | SMS reminders, bulk broadcasts |
| Email (Resend) | Configured | Booking confirmations, newsletters |
| iCal sync | Active | Syncs Mario's Google Calendar to block times |
| Google Maps | Active | Via Manus proxy (no API key needed) |

---

## Social Media

- YouTube: Ri Tennis Mario
- Instagram: `deletefearwithMario`, `RITennisandFAYE`
- TikTok: `@deletefear`
- Facebook: Mario Llano
- Twitter/X: `@RITennisAcademy`

---

## Recent Changes (June 2026)

1. **Junior pricing updated** — Fall/Spring season is over; summer pricing now site-wide:
   - Half-day: $99/day · $495/week (9 AM–2 PM)
   - Full day: $125/day · $625/week (9 AM–5 PM)
   - Hourly drop-in: $30/hour (text Mario)
2. **Summer Camp page** (`/summer-camp`) enhanced:
   - $30/hour drop-in card with "Text to Book" + "Book by the Hour" buttons
   - Flexibility banner: "We Are As Flexible As You Want To Be. Book Anytime. Any Day. As Many Hours As You Want."
   - FAQ updated with hourly pricing and text-to-book instructions
3. **Homepage hero** — 3D floating yellow "☀️ 2026 Summer Program" button added
4. **105 Game capacity** — raised from 8 → 12 in code; DB update still needed for existing slots
5. **Full session participant list** — when a session is full, "Who's On Court" list now shows below the "Session Full" banner

---

## Pending / Known Issues

- [ ] **DB capacity update needed:** Run `UPDATE scheduleSlots SET maxParticipants = 12 WHERE programId = 1 AND maxParticipants < 12;` — the SQL tool had a connection error last session
- [ ] **"Made with Manus" badge** — user wants it removed; requires plan upgrade (user is paying, needs to upgrade from Settings UI)
- [ ] 35 items remain in `todo.md` — most are stretch features, not blocking

---

## How to Continue in a New Chat

1. Open the `tennis-academy` project in Manus
2. Paste this file or reference it
3. The dev server runs at `https://3000-iuols7f7fwjsscnc3cvct-edfde1fc.us2.manus.computer`
4. Latest checkpoint: `6ea97ca4` — use `webdev_rollback_checkpoint` with this ID if needed
