# Momentum

**An AI-native workspace that unifies Gmail, Calendar, and your tasks into one calm, prioritized command center.**

Momentum pulls your email and calendar into a single fast interface, uses AI to triage what matters, summarizes everything you missed while you were away, and lets you act — reply, schedule, track — without tab-switching. Built on a multi-tenant architecture where every user's data is fully isolated.

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" />
  <img alt="React" src="https://img.shields.io/badge/React-19-149eca?logo=react" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript" />
  <img alt="tRPC" src="https://img.shields.io/badge/tRPC-11-2596be" />
  <img alt="Drizzle" src="https://img.shields.io/badge/Drizzle-ORM-c5f74f" />
  <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss" />
</p>

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Billing (Razorpay)](#billing-razorpay)
- [Granting Pro access manually](#granting-pro-access-manually)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [License & acknowledgements](#license--acknowledgements)

---

## Features

- **Dynamic dashboard** — Live, per-user stats, a 6-month email-volume chart, and recent activity pulled from your own connected accounts. A time-of-day greeting (morning → night) sets the tone whenever you sign in.
- **Gmail-like inbox** — Two-pane list + reading view, a filter rail (All / Unread / Starred), full-text search over the local cache, per-message star and read state, compose, and drafts.
- **AI priority triage** — One click classifies your inbox into **Urgent / Reply / Waiting / FYI** and sorts the most important mail to the top.
- **Catch Me Up** — The flagship. Pick a window (last 3 hours, today, last 24 hours, this week, this month) and get a single digest of everything that happened across your tools — email, calendar, and (soon) Slack and GitHub.
- **Colorful calendar** — A Google-Calendar-style week grid with an all-day row, today highlight, time-positioned events auto-colored by title, click-to-view details, event creation, and attendee invites.
- **Kanban board** — Drag-and-drop task tracking (To Do / In Progress / Done), persisted per user.
- **Connections hub** — One place to see every integration's live status and item counts, with one-click **Sync** and **Disconnect**.
- **⌘K command agent** — A natural-language command palette that proposes structured actions (search, compose, schedule, catch-up) for you to approve.
- **Settings & customization** — Edit your profile and tune greeting tone, list density, accent color, and notifications.
- **Notifications** — A top-right bell with a derived feed of recent mail and imminent meetings.
- **Billing** — Free tier with full product access; **Pro** unlocks the AI layer, via Razorpay subscriptions with webhook-verified state.
- **Background jobs** — Inngest powers off-request AI work (inbound-email triage) and an AI-summarized log/event monitor.

---

## Tech stack

| Layer           | Technology                                                                                                                                                                                      |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework       | [Next.js 15](https://nextjs.org) (App Router, Turbopack), [React 19](https://react.dev)                                                                                                         |
| Language        | [TypeScript](https://www.typescriptlang.org)                                                                                                                                                    |
| API             | [tRPC v11](https://trpc.io) (end-to-end typesafe)                                                                                                                                               |
| Database        | [PostgreSQL](https://www.postgresql.org) via [Drizzle ORM](https://orm.drizzle.team)                                                                                                            |
| Auth            | [Better Auth](https://www.better-auth.com) — Google OAuth (Gmail + Calendar scopes)                                                                                                             |
| Integrations    | [Corsair](https://www.npmjs.com/package/corsair) — Gmail & Google Calendar plugins                                                                                                              |
| AI              | [OpenAI](https://platform.openai.com) (`gpt-4o-mini`)                                                                                                                                           |
| Background jobs | [Inngest](https://www.inngest.com)                                                                                                                                                              |
| Payments        | [Razorpay](https://razorpay.com) subscriptions                                                                                                                                                  |
| UI              | [Tailwind CSS v4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com), [Framer Motion](https://www.framer.com/motion/), [Recharts](https://recharts.org), [Lucide](https://lucide.dev) |
| Validation      | [Zod](https://zod.dev) · [superjson](https://github.com/blitz-js/superjson)                                                                                                                     |
| Tooling         | pnpm · ESLint · Prettier                                                                                                                                                                        |

Bootstrapped with the [T3 Stack](https://create.t3.gg).

---

## Architecture

**Multi-tenant by user.** Each signed-in user maps to a Corsair tenant
(`getTenant(ctx.user.id)`), so their Gmail/Calendar accounts, cached entities,
and events live under their own tenant and are never visible to anyone else.

**Local-first reads.** Corsair caches Gmail messages and Calendar events in
Postgres, so search and list views resolve in milliseconds without a round-trip
to Google on every keystroke. Writes (send, schedule, invite) go straight to the
provider APIs.

**Typed procedure tiers.** tRPC procedures come in three flavors:

- `publicProcedure` — unauthenticated.
- `protectedProcedure` — requires a signed-in user; everything a free user can do builds on this.
- `paidProcedure` — requires a signed-in user **on the Pro plan**; the AI endpoints use it, so free users get a typed `PAYWALL` error the client turns into an upgrade prompt.

The caller's plan is resolved once per request in the tRPC context and is
**period-aware** (Pro only counts while the paid period is still valid).

**Billing source of truth.** The Razorpay webhook is the durable authority on
plan state; the in-app payment-verification mutation grants instant access
optimistically by verifying the signature server-side. The `plan` column is
never trusted from the client.

**AI off the request path.** New inbound emails are handed to Inngest for
classification so the request stays fast, and an AI log monitor batches app
events into human-readable ops digests.

---

## Project structure

```
src/
├── app/
│   ├── (app)/                 # Authenticated app (sidebar + topbar shell)
│   │   ├── dashboard/          # Live stats, chart, greeting
│   │   ├── inbox/              # Gmail-like inbox with filters
│   │   ├── calendar/           # Colorful week grid
│   │   ├── board/              # Kanban board
│   │   ├── catch-up/           # "Catch Me Up" digest
│   │   ├── connections/        # Integrations hub
│   │   ├── settings/           # Profile + customization
│   │   └── billing/            # Plan management
│   ├── (marketing)/            # Public landing + docs
│   ├── login/                  # Google sign-in
│   └── api/
│       ├── auth/[...all]/       # Better Auth handler
│       ├── trpc/[trpc]/         # tRPC handler
│       ├── inngest/             # Inngest endpoint
│       └── webhooks/            # Corsair + Razorpay webhooks
├── components/
│   ├── app/                    # Sidebar, topbar, notifications, feature clients
│   ├── billing/                # Upgrade card, Razorpay checkout hook
│   ├── marketing/              # Landing components
│   └── ui/                     # shadcn/ui primitives
├── server/
│   ├── api/routers/            # tRPC routers (gmail, calendar, ai, billing,
│   │                           #   dashboard, kanban, catch-up, connections,
│   │                           #   notifications, preferences)
│   ├── auth/                   # Better Auth config
│   ├── db/                     # Drizzle schema + client
│   ├── lib/                    # ai, billing, tenant, email helpers
│   └── corsair.ts              # Corsair client (plugins, multi-tenancy)
├── inngest/                    # Background functions
├── lib/                        # Client utils (greeting, display, week, hooks)
└── trpc/                       # tRPC client/server wiring
scripts/
└── grant-pro.ts                # Manually grant/revoke Pro
```

---

## Getting started

### Prerequisites

- **Node.js** 20+
- **pnpm** 10+ (`corepack enable && corepack prepare pnpm@latest --activate`)
- **PostgreSQL** (local via Docker, or a hosted provider like [Neon](https://neon.tech))
- A **Google Cloud** OAuth client (for sign-in + Gmail/Calendar access)

### 1. Clone and install

```bash
git clone https://github.com/saurabhravte/momentumV2.git
cd momentumV2
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in the **REQUIRED** block (see [Environment variables](#environment-variables)). Generate secrets with:

```bash
openssl rand -base64 32   # use for BETTER_AUTH_SECRET and CORSAIR_KEK
```

### 3. Set up Google OAuth

In [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials, create an **OAuth 2.0 Client ID** (Web application):

- **Authorized redirect URI:** `http://localhost:3000/api/auth/callback/google` (and your production origin's equivalent)
- Enable the **Gmail API** and **Google Calendar API**
- Copy the client ID/secret into `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

### 4. Start the database & push the schema

```bash
./start-database.sh   # spins up local Postgres in Docker (optional if you use a hosted DB)
pnpm db:push          # creates all tables (auth, Corsair cache, subscriptions, kanban, preferences)
```

### 5. Run

```bash
pnpm dev              # app on http://localhost:3000
pnpm inngest:dev      # (separate terminal) background jobs dashboard
```

Sign in with Google, and your Gmail and Calendar begin syncing through Corsair.

---

## Environment variables

| Variable                                    | Required | Description                                                        |
| ------------------------------------------- | :------: | ------------------------------------------------------------------ |
| `DATABASE_URL`                              |    ✅    | Postgres connection string                                         |
| `NEXT_PUBLIC_APP_URL`                       |    ✅    | App origin, no trailing slash                                      |
| `CORSAIR_KEK`                               |    ✅    | Base64 key-encryption key (`openssl rand -base64 32`)              |
| `TENANT_ID`                                 |    ✅    | Fallback tenant for local scripts (default `dev`)                  |
| `BETTER_AUTH_SECRET`                        |    ✅    | Auth signing secret                                                |
| `BETTER_AUTH_URL`                           |    ✅    | Must match your origin                                             |
| `GOOGLE_CLIENT_ID`                          |    ✅    | Google OAuth client ID                                             |
| `GOOGLE_CLIENT_SECRET`                      |    ✅    | Google OAuth client secret                                         |
| `OPENAI_API_KEY`                            |    —     | Enables AI triage, digests, ⌘K. App degrades gracefully without it |
| `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` |    —     | Required in production for background jobs                         |
| `RAZORPAY_KEY_ID`                           |    —     | Razorpay key id (`rzp_test_…` / `rzp_live_…`)                      |
| `RAZORPAY_KEY_SECRET`                       |    —     | Razorpay secret                                                    |
| `RAZORPAY_PLAN_ID`                          |    —     | Monthly Plan id created in the Razorpay dashboard                  |
| `RAZORPAY_WEBHOOK_SECRET`                   |    —     | Webhook secret you set when registering the endpoint               |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID`               |    —     | Public key id used by the browser checkout                         |

Billing turns on only when **all four** server `RAZORPAY_*` vars are set; otherwise the app runs free-only and the upgrade UI is inert.

---

## Scripts

| Command                              | Description                      |
| ------------------------------------ | -------------------------------- |
| `pnpm dev`                           | Start the dev server (Turbopack) |
| `pnpm build`                         | Production build                 |
| `pnpm start`                         | Run the production build         |
| `pnpm preview`                       | Build + start                    |
| `pnpm check`                         | Lint + typecheck                 |
| `pnpm typecheck`                     | `tsc --noEmit`                   |
| `pnpm lint` / `pnpm lint:fix`        | ESLint                           |
| `pnpm format:write` / `format:check` | Prettier                         |
| `pnpm db:push`                       | Push schema to the database      |
| `pnpm db:generate` / `db:migrate`    | Generate / apply SQL migrations  |
| `pnpm db:studio`                     | Open Drizzle Studio              |
| `pnpm inngest:dev`                   | Local Inngest dev server         |

---

## Billing (Razorpay)

The Pro plan unlocks the AI layer (triage, Catch Me Up digest, ⌘K agent). To enable payments:

1. **API keys** — Razorpay Dashboard → Settings → API Keys (start in Test Mode). Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `NEXT_PUBLIC_RAZORPAY_KEY_ID`.
2. **Plan** — Subscriptions → Plans → create a monthly plan; copy its id into `RAZORPAY_PLAN_ID`.
3. **Webhook** — Settings → Webhooks → add `https://YOUR_DOMAIN/api/webhooks/razorpay`, choose a secret (→ `RAZORPAY_WEBHOOK_SECRET`), and subscribe to the `subscription.*` events.

Flow: Upgrade → server creates the subscription → Razorpay checkout → signature verified server-side for instant Pro → webhook keeps plan state durable thereafter. (AI also requires `OPENAI_API_KEY` — Razorpay gates _who_ may use AI; OpenAI is what runs it.)

---

## Granting Pro access manually

For yourself, teammates, or beta testers — bypasses Razorpay entirely:

```bash
pnpm tsx scripts/grant-pro.ts grant  user@example.com        # 365 days (default)
pnpm tsx scripts/grant-pro.ts grant  user@example.com 30     # custom days
pnpm tsx scripts/grant-pro.ts revoke user@example.com
```

It resolves the user by email and writes the subscription using the same helpers
the webhook uses, so access updates on the user's next request. There is
intentionally no in-app admin endpoint for this, so a compromised session can
never escalate a plan.

---

## Deployment

Momentum deploys cleanly to **Vercel** with a hosted Postgres (e.g. **Neon**):

1. Push to GitHub and import the repo into Vercel.
2. Add all required environment variables (and any optional ones you use) in **Project → Settings → Environment Variables**. Set `NEXT_PUBLIC_APP_URL` and `BETTER_AUTH_URL` to your production origin.
3. Add the production OAuth redirect URI in Google Cloud Console.
4. Run `pnpm db:push` against the production database.
5. For background jobs and billing, set the Inngest keys and register the Razorpay webhook against your production URL.

---

## Roadmap

- Slack and GitHub connectors (the Connections hub and Catch Me Up are already built for them — wiring is a data-only change in `src/server/corsair.ts`).
- Persistent inbox read/star state and write-through to Gmail labels.
- Autonomous ⌘K execution via the Corsair MCP (currently propose-and-approve).
- Configurable calendar time window and month view.

---

## License & acknowledgements

Built on the [T3 Stack](https://create.t3.gg). Integrations powered by
[Corsair](https://www.npmjs.com/package/corsair).

Add a `LICENSE` file (MIT is a common choice) before sharing publicly.
