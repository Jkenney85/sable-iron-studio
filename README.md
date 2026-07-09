# Sable & Iron — Custom Tattoo Studio + Booking

A production-minded MVP for a **custom tattoo studio website** with a **booking
experience embedded directly into the site**, **Stripe payments** for deposits
or full payment, and a **practical admin dashboard** for studio staff.

Not a generic booking widget with tattoo labels bolted on — the booking flow is
part of the studio's brand and flows naturally from the public pages.

- **Public site:** Home, Artists, Artist detail, Gallery, Booking, Contact
- **Booking flow:** appointment type → artist → real per-artist calendar → contact → optional tattoo intake (with reference-image uploads) → deposit/full payment → Stripe Checkout → confirmation
- **Admin:** protected dashboard, bookings list/detail, schedule view, artist profiles + availability, services & payment rules
- **Payments:** Stripe Checkout + webhook, deposit / full / customer-choice rules, stored payment IDs & status
- **Notifications:** email scaffolding (confirmation, receipt, reminder, studio alert) with an audit log; SMS left as a future channel

---

## Stack

| Layer      | Choice                                                            |
| ---------- | ---------------------------------------------------------------- |
| Framework  | **Next.js 14** (App Router, TypeScript, Server Components)        |
| Database   | **PostgreSQL** via **Prisma**                                    |
| Payments   | **Stripe Checkout** + webhooks                                   |
| Styling    | **Tailwind CSS** (editorial ink/bone theme, Fraunces + Instrument Sans) |
| Auth       | Seeded admin, **bcrypt** + signed **JWT** cookie (jose), edge middleware |
| Email      | **Nodemailer** (SMTP; Mailpit for local dev)                     |
| Uploads    | Local disk (`/public/uploads`, Docker volume) — swappable for object storage |

Why this stack: it is self-contained (real API routes for reliable Stripe
webhooks, server-rendered public pages, protected admin), Dockerizes cleanly,
and still deploys to managed platforms.

---

## Quick start (local, Docker) — recommended

Everything (app + Postgres + a catch-all mail inbox) runs with one command.

```bash
cp .env.example .env
# Edit .env: set AUTH_SECRET (openssl rand -hex 32) and, optionally, Stripe keys.
docker compose up --build
```

Then open:

| URL                              | What                                        |
| -------------------------------- | ------------------------------------------- |
| http://localhost:3000            | Public site                                 |
| http://localhost:3000/admin      | Admin dashboard (login below)               |
| http://localhost:8025            | **Mailpit** — see all outgoing emails       |

On first boot the container applies the schema and **seeds demo data**
(`RUN_SEED=true` in `docker-compose.yml`). After the first successful run, set
`RUN_SEED=false` to stop re-seeding.

**Demo admin login** (from `.env` — change these):

```
email:    studio@sableiron.test
password: changeme-admin-password
```

> **No Stripe keys?** The booking flow still works end-to-end: without Stripe
> configured the app runs in **demo mode** — bookings are confirmed immediately
> and confirmation emails are logged to Mailpit. Add Stripe keys to exercise the
> real payment + webhook path (below).

---

## Quick start (local, without Docker)

Requires Node 20+ and a local PostgreSQL.

```bash
cp .env.example .env
# In .env, point DATABASE_URL at your local Postgres, e.g.:
#   postgresql://sable:sable@localhost:5432/sable_iron?schema=public
npm install
npm run db:push        # create tables
npm run db:seed        # load demo studio, artists, bookings
npm run dev            # http://localhost:3000
```

---

## Environment variables

All secrets/config come from env — nothing is hard-coded. See `.env.example`
for the annotated source of truth.

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | PostgreSQL connection string. In Docker use host `db`; outside, `localhost`. |
| `APP_URL` / `NEXT_PUBLIC_APP_URL` | ✅ | Public base URL. Used for Stripe redirects and email links. |
| `AUTH_SECRET` | ✅ | Signs the admin session JWT. `openssl rand -hex 32`. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | ✅ (seed) | Credentials for the first admin created by the seed. |
| `STRIPE_SECRET_KEY` | payments | `sk_test_…` (test) or `sk_live_…` (live). |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | payments | `pk_test_…` / `pk_live_…`. |
| `STRIPE_WEBHOOK_SECRET` | payments | `whsec_…` — from `stripe listen` (dev) or the webhook config (prod). |
| `PAYMENT_CURRENCY` | – | ISO currency for Checkout (default `usd`). |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_SECURE` | – | SMTP for email. If `SMTP_HOST` is empty, emails are logged to the console. |
| `EMAIL_FROM` | – | From address for notifications. |
| `STUDIO_NOTIFICATION_EMAIL` | – | Where "new booking" studio alerts go. |
| `TZ` | – | Server timezone; align with the studio timezone so slots match calendars. |

**Where the Stripe keys go:** put **test** keys (`sk_test_`/`pk_test_`) in `.env`
for development and staging; put **live** keys (`sk_live_`/`pk_live_`) only in
your production environment's secret manager. The **webhook secret** (`whsec_`)
is different per endpoint — the local `stripe listen` value is not the same as
your deployed endpoint's value.

---

## Stripe: testing the real payment flow

1. Add test keys to `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
2. Forward webhooks to your local app (install the [Stripe CLI](https://docs.stripe.com/stripe-cli)):
   ```bash
   stripe login
   npm run stripe:listen
   # → prints  "Ready! Your webhook signing secret is whsec_..."
   ```
   Copy that `whsec_...` into `STRIPE_WEBHOOK_SECRET` in `.env` and restart the app.
3. Book an appointment on the site. At checkout use a Stripe **test card**:
   ```
   4242 4242 4242 4242   any future expiry   any CVC   any ZIP
   ```
4. On success you're returned to the confirmation page and the booking flips to
   **Confirmed**; the payment row stores the PaymentIntent/charge IDs and a
   receipt link. Check Mailpit (http://localhost:8025) for the confirmation +
   receipt emails.

**How payment status stays correct:** the confirmation page and the webhook both
call one idempotent `fulfillCheckoutSession()` routine, so the booking is
finalized reliably whichever arrives first — no duplicate emails, no lost
confirmations if the webhook is delayed.

**Payment rules per appointment type** (`paymentPolicy`):
- `DEPOSIT_REQUIRED` — deposit taken now, balance in-studio
- `FULL_REQUIRED` — full price up front
- `CUSTOMER_CHOICE` — customer picks deposit or full at checkout

Card data is never stored — only Stripe IDs (`stripeCheckoutSessionId`,
`stripePaymentIntentId`, `stripeChargeId`) and status.

---

## Deploying to Lovable (or a similar managed builder)

This project is a standard Next.js + Prisma + Postgres app, which Lovable-style
platforms support well.

1. **Import the repo** into your project/workspace.
2. **Provision a PostgreSQL database** (Lovable/Supabase/Neon/etc.) and set
   `DATABASE_URL` to its connection string.
3. **Set environment variables** (from the table above) in the platform's
   secret manager — do **not** commit a `.env`. At minimum: `DATABASE_URL`,
   `AUTH_SECRET`, `APP_URL`, `NEXT_PUBLIC_APP_URL`, and (for payments) the Stripe
   keys + webhook secret.
4. **Run migrations + seed once** against the managed DB:
   ```bash
   npm run db:push
   npm run db:seed     # optional demo data; skip for a clean studio
   ```
5. **Build & start:** `npm run build` then `npm run start` (the platform usually
   wires these automatically).
6. **Add the Stripe webhook** in the Stripe dashboard pointing at
   `https://<your-domain>/api/stripe/webhook`, subscribe to
   `checkout.session.completed`, `checkout.session.expired`, `charge.refunded`,
   and paste the endpoint's signing secret into `STRIPE_WEBHOOK_SECRET`.
7. **Swap file storage** for production (see TODOs) — local disk uploads don't
   persist on ephemeral/multi-instance hosts.

> If your managed builder prefers Supabase, the schema maps cleanly onto a
> Supabase Postgres; keep Prisma as the access layer or generate types from the
> same schema.

---

## Project structure

```
prisma/
  schema.prisma        # full relational data model (see below)
  seed.ts              # demo studio, artists, availability, bookings, payments
src/
  app/
    (site)/            # public site: home, artists, gallery, book, contact, confirmation
    admin/             # protected dashboard: bookings, schedule, artists, services
    api/
      availability/    # slot lookup
      booking/         # create booking + open Stripe Checkout (double-booking safe)
      upload/          # reference-image upload
      contact/         # contact form
      stripe/webhook/  # authoritative payment/booking status updates
      admin/auth/      # login / logout
  components/          # site/, booking/ (wizard), admin/
  lib/                 # prisma, stripe, auth, email, availability, pricing, fulfillment, validation
  middleware.ts        # edge guard for /admin and /api/admin
```

### Data model (relational)

`StudioSetting`, `Admin`, `Artist`, `AvailabilityWindow`, `TimeOff`,
`AppointmentType` (+ `AppointmentTypeArtist` join), `Customer`, `Booking`,
`TattooIntake`, `ReferenceImage`, `Payment`, `NotificationEvent`,
`PortfolioItem`.

Notable design choices:
- **Double-booking prevention:** booking creation runs in a transaction that
  re-checks the slot against blocking statuses before inserting.
- **Google Calendar-ready:** `Artist` carries `gcalCalendarId` / `gcalSyncEnabled`
  and each `Booking` has `gcalEventId` / `gcalSyncStatus` / `gcalLastSyncedAt` —
  sync can be added later per artist **without a migration**.
- **SMS-ready:** `NotificationEvent.channel` already includes `SMS`.
- **Money** is stored in integer cents; **no raw card data** is ever persisted.

---

## What's complete / mocked / next

### ✅ Complete
- Full public website (home, artists, artist detail, gallery w/ filter, contact) — responsive, editorial design
- End-to-end booking wizard embedded in the site (mobile-friendly, stateful, validated)
- Per-artist availability + real slot generation with available/unavailable states and double-booking guard
- Stripe Checkout integration, deposit / full / customer-choice rules, webhook + idempotent fulfillment, stored payment IDs & statuses, success/cancel flows
- Reference-image uploads tied to intake records
- Admin auth (bcrypt + JWT + middleware), dashboard, bookings list/detail with status actions, schedule view, artist profile + availability editor, services/pricing editor
- Email notification scaffolding with a persisted audit log
- Prisma schema + realistic seed data; Docker + docker-compose; this README

### 🟡 Mocked / demo-grade
- **Demo mode** (no Stripe keys) auto-confirms bookings so the flow is testable offline
- **Portfolio/avatar images** point at Unsplash for the demo — replace with studio assets
- **Email** logs to console / Mailpit unless real SMTP is configured
- **Reference images** are stored on local disk (fine for single-instance; not for serverless/multi-instance)
- **Timezone** handling uses the server's local time (set `TZ`); good for a single-location studio

### 🔜 TODOs (clearly extensible)
- **Google Calendar sync** — per-artist OAuth + push/pull using the reserved `gcal*` fields; write availability from external busy times and mirror bookings as events
- **SMS reminders** — add a Twilio (or similar) sender behind `NotificationChannel.SMS`; reuse the `NotificationEvent` log
- **Appointment reminders** — `sendAppointmentReminder()` exists; wire a cron/queue (e.g. a scheduled job) to send 24–48h out
- **Production email delivery** — swap SMTP for a provider (Resend/Postmark/SES) and verify SPF/DKIM
- **Production file storage** — replace `/api/upload` disk writes with S3 / R2 / Vercel Blob and store the returned URL in `ReferenceImage.url`
- **Final security hardening** — rate-limit public POST routes (booking/upload/contact), add CSRF defenses for admin server actions, virus-scan/validate uploads more strictly, rotate `AUTH_SECRET`, add role-based admin permissions, and switch the Docker image to a slim standalone runtime (set `output: "standalone"` in `next.config.mjs` and run `node .next/standalone/server.js`)

---

## Useful scripts

```bash
npm run dev          # local dev server
npm run build        # prisma generate + next build
npm run start        # production server
npm run db:push      # apply schema to the database
npm run db:seed      # load demo data
npm run db:reset     # drop, re-migrate, re-seed
npm run db:studio    # Prisma Studio (browse the DB)
npm run stripe:listen# forward Stripe webhooks to localhost
```

---

## Security notes (MVP baseline)

- Admin area guarded by edge middleware **and** re-checked in every server action.
- Passwords hashed with bcrypt (cost 12); sessions are signed httpOnly JWT cookies (`secure` in production).
- Stripe webhooks verified by signature; card details never touch the app.
- Uploads restricted by MIME type and size; served by random filenames.
- All secrets via environment variables; `.env` is gitignored.

See the hardening TODOs above before going live.
