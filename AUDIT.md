# Landing Page Audit

Audit of the public site against `docs/landing-page-instructions.md` (repo root of the workspace), written 2026-10-16.

> **Process note.** The instructions ask for this audit *before* the redesign. It was written afterwards, so the "Before" findings below come from reviewing the previous code, and the Lighthouse numbers are a **post-redesign** baseline. There is no pre-redesign Lighthouse score.

---

## Page structure

The homepage is an overview (hero with quick search, available rooms, residences, how it works, links to the other pages, final CTA). Facilities, Location and FAQ each have their own page, sharing the final CTA, footer and floating CTA via `PublicPageShell`. Visual language follows residoz.webflow.io (light canvas, black pill CTAs with rust arrow badges, "• label" eyebrows, //01 stat cards, black How-it-works band, room carousel, Reach-out block, black footer with oversized wordmark), adapted to the brand rust `#a44a32` and the instructions (live data only, no fake logos/testimonials). The homepage hero and quick search fit a 1440×900 screen at 100% zoom.

---

### Page-by-page (2026-10-16)

| Page | Design |
|---|---|
| Home `/` | Photo hero + quick search, about + live stats, room carousel, how it works, residences, explore, reach-out |
| Rooms `/search-kosts` | Light header with live stats, search panel, sticky filter/sort/view toolbar, shared room tiles or table, empty state with waitlist |
| Residence `/kosts/[id]` | Title block + share, photo bento, sticky in-page tabs, room tiles, facilities + property deposit, pinned map, sticky booking card, property-specific mobile bar |
| Room `/kosts/[id]/[unitTypeId]` | Specs, price packages table, inclusions + deposit, pinned map, sticky booking/waitlist card, "similar rooms" carousel |
| Residences / Facilities / Location / FAQ | Section pages sharing the shell |
| About `/about` | Typographic hero + photo strip, story with mission/vision, values grid, **live** numbers (fake stats removed), how it works |
| Contact `/contact` | Four channel cards, lead-saving inquiry form, residences with pinned maps |
| Terms / Privacy | Shared document layout: sticky numbered TOC with scroll-spy, readable sections; Privacy gains a lead-forms section (§13) — **owner/legal review needed** |

Content conflicts to resolve: the old contact copy (`contact.info.*`) lists a different Cherry Kost address and different opening hours than the live data and `siteConfig.viewingHours`; the new pages use the live data. `BOOKING_DEPOSIT_AMOUNT` (Rp 300.000, used in the booking dialog) differs from the Cherry Kost deposit in `siteConfig.deposits` (Rp 400.000).

Unused after the redesign (safe to delete once confirmed): `AboutHero`, `AboutMission`, `AboutJourney`, `AboutValues`, `AboutStats`, `HomeIntro`, `HomeNeighborhood`, `ContactHero`, `ContactForm`, `ContactInfo`, `ContactMap`, `TermsHero`, `TermsContent`, `PrivacyHero`, `PrivacyContent`, `RoomDetailSidebar`, `RoomTypeCard`, `KostGrid`.

---

## 1. Stack and data

| Area | Current state |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4, next-intl (`id` default, `en`), TanStack Query, framer-motion |
| Backend | Elysia on Bun, Prisma 7, PostgreSQL (`cherry-sky-kost-backend`) |
| Hosting | Frontend on Vercel, backend on Railway (from `.env.example` / `railway.toml`) |
| Room data | Owner-managed in the admin panel → `Property` → `UnitType` → `Unit` (status `vacant` / `occupied`) → public API `/public/properties` and `/public/search` |
| Copy | `src/locales/en.json`, `src/locales/id.json` |
| Site settings | `src/config/site.ts` (new): contacts, viewing hours, response time, deposits, social links |
| Leads | **New** `Lead` table + `POST /public/leads` (see §4) |

Availability shown on the site is computed from unit status, so it is as accurate as the admin panel.

---

## 2. Content kept, moved or removed

| Content | Outcome |
|---|---|
| Hero copy, subtitle, WhatsApp messages | Kept |
| Property photos (`public/assets/*.jpeg`, uploaded attachments) | Kept |
| Journey steps, amenities, FAQ answers, survey dialog | Kept and restyled; a 4th journey step was added |
| Neighbourhood map | Moved to the dedicated `/location` page |
| `HomeIntro` with `StatsBar` ("500+ residents", "98% satisfaction", "5+ years") | **Removed from the homepage.** These figures are hard-coded and unverified, which §7.4 / §15 forbid. `StatsBar` and `AboutStats` are still used on the About page. |
| Old `#properties` grid (`KostGrid`) | Replaced by the curated rooms section; the component is still used elsewhere |

---

## 3. Conversion problems found (before) and status

| Problem | Status |
|---|---|
| Hero had no live availability, no search, no price proof | Fixed: live room count, starting price, residence count, quick search |
| Header linked to pages only; no persistent availability CTA | Fixed: section anchors + "Check availability" (desktop and mobile menu) |
| Occupied rooms were a dead end (just a "Full" label) | Fixed: "Join waitlist" form on homepage and search page |
| Every CTA opened WhatsApp; nothing was recorded | Fixed: inquiry, waitlist and survey requests are saved as leads with UTM source |
| Unverified marketing numbers on the homepage | Fixed (removed) |
| No "what's included / paid separately" | Fixed: transparency panel (electricity token, deposits, no agent fees) |
| No floating CTA on mobile | Fixed on the homepage: bottom bar (rooms, WhatsApp, call) |
| Body text 13–15px | Fixed on the homepage sections, lead forms and footer (16px) |
| No analytics | Fixed: §10 events wired; inactive until an ID is configured |

---

## 4. Lead capture (§7)

- **Endpoint:** `POST /public/leads` (backend `src/modules/public/lead`). Validates name and Indonesian mobile number, normalises the phone to +62, links property/room only if they exist.
- **Spam:** hidden honeypot field (bots get a fake success) and a dedicated rate-limit tier, 5 submissions per IP per 10 minutes.
- **Owner notification:** Telegram message with a direct `wa.me` reply link when `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are set. Otherwise the lead is saved and logged.
- **Admin API:** `GET /admin/leads` (filter by status, type, property) and `PATCH /admin/leads/:id` (status, notes).
- **Frontend:** `LeadForm` / `LeadDialog` (inquiry + waitlist), plus the existing survey dialog now saves a `viewing` lead in the background after opening WhatsApp.
- **Tests:** `src/modules/public/lead/lead.schema.test.ts` (validation and message format).

### ⚠️ Required before forms work

The migration `prisma/migrations/20261016070000_lead/migration.sql` has been **written but not applied**. Until it is deployed, form submissions fail and visitors see the "message us on WhatsApp" fallback. Apply it with your normal process (for example `bunx prisma migrate deploy` against the target database).

---

## 5. Lighthouse (mobile, production build)

### Current design (Residoz-inspired revamp, 2026-10-16)

| Method | Performance | Accessibility | Best Practices | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| Real throttling (`--throttling-method=devtools`, 2 runs) | 79–94 | 100 | 100 | 100 | 2.1–3.1 s | 0 |
| Simulated throttling (Lighthouse default) | 57 | 100 | 100 | 100 | 11.3 s | 0.002 |

The simulated model attributes ~80% of LCP to "render delay" (main-thread work), while an unthrottled browser paints the hero at ~1.1 s. The most likely cause is that the homepage is entirely client-rendered; moving the data fetch and static sections to Server Components is the main remaining performance task.

Fixed during this pass: the room carousel self-scrolled on load (snap alignment vs. padding), which stopped Chrome from reporting LCP at all; contrast of muted heading text and the word-reveal statement; invalid `<dl>` markup.

### Previous design (for reference)



Measured locally with Lighthouse 12.6.1 against `next build --webpack && next start`; the API was the configured backend, so server response time varies between runs.

| Page | Performance | Accessibility | Best Practices | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| Home | 77–80 | 96 | 100 | 100 | 4.8 s | 0 |
| Search | 69 | 96 | 100 | 100 | 8.2 s | 0.072 |

Targets (§12): Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95, Best Practices ≥ 95, LCP < 2.5 s, CLS < 0.1.

**Met:** Accessibility, Best Practices, SEO, CLS. **Not met:** Performance and LCP.

Already fixed during this audit: the hero no longer fades in a remote photo over the local one, and the hero card/headline no longer animate in (home LCP 11.0 s → 4.8 s).

Next steps for performance:
1. The Material Symbols stylesheet from Google Fonts is render-blocking; self-host the icon font or swap to inline SVG icons.
2. The homepage is fully client-rendered (`"use client"` + client-side data fetch). Fetching properties on the server and passing them down would let the live numbers and cards arrive in the first HTML.
3. Search page LCP: preload the first result image.
4. Accessibility's only failure is contrast on the footer's decorative oversized wordmark (`aria-hidden`); it pre-dates this work.

---

## 6. Compliance with section 5

| Section | Status |
|---|---|
| 5.1 Sticky header | ✅ each item has its own page: Rooms `/search-kosts`, Residences `/residences`, Facilities `/facilities`, Location `/location`, FAQ `/faq`, Contact `/contact` |
| 5.2 Hero | ✅ |
| 5.3 Trust bar | 🟡 owner-managed note + live stats; no years/tenants/rating until real data exists |
| 5.4 Property overview | 🟡 no distances to campus/offices, no per-property facilities (not in the data model) |
| 5.5 Room listing | 🟡 search page: filters synced to URL, counts, grid/table toggle, waitlist. Missing "availability first" sort (needs a backend sort), "available soon"/"reserved" statuses (units only have vacant/occupied), facility/floor/gender filters (not in the data model) |
| 5.6 Room detail | ⚪ not reviewed in this pass; `view_room_detail` and `gallery_open` events added |
| 5.7 Facilities | 🟡 shared copy, not per-property tabs |
| 5.8 Pricing overview | 🟡 included/excluded panel; no room-type comparison table |
| 5.9 Location | 🟡 map is a general Medan view; each property has a Directions link |
| 5.10 Social proof | ❌ needs real testimonials / Google rating |
| 5.11 How it works | 🟡 4 steps; required documents and typical timeline not stated |
| 5.12 FAQ | 🟡 6 answered; 8 more topics waiting for the owner (§7 below) |
| 5.13 Final CTA | ✅ live count + inquiry form + WhatsApp |
| 5.14 Footer | ✅ addresses, viewing hours, call, email; social links render once set |
| 5.15 Floating WhatsApp | 🟡 homepage and the new section pages (not yet on Search, Contact, About, room detail) |
| §8 Admin leads inbox UI | ❌ API exists; no screen in the admin panel yet |
| §9 Dark mode | ❌ the site forces light mode (`<html class="light">`) |

---

## 7. Owner to-do (content only, no code)

1. **FAQ answers** in `src/locales/en.json` and `id.json` → `home.faq.items`: `minimumStay`, `payment`, `guests`, `curfew`, `gender`, `pets`, `maintenance`, `cancellation`. Each appears on the site as soon as its `a` text is filled in.
2. **Response time** in `src/config/site.ts` → `responseTime` (for example "1 hour"). Shown in form success messages.
3. **Social links** in `src/config/site.ts` → `social`.
4. **Telegram bot** env vars on the backend for instant lead alerts.
5. **Analytics ID**: `NEXT_PUBLIC_GA_ID` or `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` on the frontend.
6. **Deposits** are in two places: `src/config/site.ts` and the FAQ / amenities copy. Update both if they change.
7. **Missing assets:** testimonials, a Google rating, and per-property photos of shared facilities.

---

## 8. Analytics events (§10)

| Event | Where |
|---|---|
| `view_room_list` | Homepage rooms section enters viewport; search page load |
| `filter_used` | Hero quick search; any search-page filter/sort/page change |
| `view_room_detail` | Room detail page |
| `click_whatsapp` | Every WhatsApp CTA, with a `location` parameter |
| `click_call` | Mobile floating bar, footer |
| `submit_viewing` / `submit_inquiry` / `submit_waitlist` | After a lead is saved |
| `gallery_open` | Photo gallery opened |

First-touch UTM parameters and referrer are stored per session and sent with every lead.
