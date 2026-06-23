# Deploying Momentum (free tier)

This app is a Next.js 15 app (App Router) with a Postgres database, Better Auth
(Google sign-in), Corsair, optional OpenAI/Inngest, and optional Razorpay
billing. The cheapest production setup is **Vercel (hosting) + Neon (Postgres)**,
both of which have free tiers.

> The app boots with only the **required** env vars. OpenAI, Inngest and
> Razorpay are optional — when unset, those features degrade gracefully and the
> app still runs.

---

## 1. Database — Neon (free)

1. Create a project at https://neon.tech and copy the **pooled** connection
   string (it looks like `postgresql://USER:PASS@HOST/DB?sslmode=require`).
2. Apply the schema. Locally, with `DATABASE_URL` set to the Neon string:
   ```bash
   pnpm db:push
   ```
   This creates the Corsair cache tables and the Better Auth tables.

## 2. Google sign-in (Better Auth)

1. In Google Cloud Console → APIs & Services → Credentials, create an **OAuth
   client ID** (Web application).
2. Authorized redirect URI: `https://YOUR-DOMAIN/api/auth/callback/google`
   (and `http://localhost:3000/api/auth/callback/google` for local dev).
3. Copy the **Client ID** and **Client secret**.

## 3. Secrets

Generate two random secrets:
```bash
openssl rand -base64 32   # CORSAIR_KEK
openssl rand -base64 32   # BETTER_AUTH_SECRET
```

## 4. Deploy to Vercel

1. Push this repo to GitHub, then “Import Project” in Vercel.
2. Framework preset: **Next.js** (auto-detected). Build command and output are
   default; Vercel runs `pnpm install` and `next build`.
3. Add the environment variables below (Project → Settings → Environment
   Variables), then deploy.

### Required env vars

| Key | Value |
| --- | --- |
| `DATABASE_URL` | Neon pooled connection string |
| `NEXT_PUBLIC_APP_URL` | `https://YOUR-DOMAIN` |
| `BETTER_AUTH_URL` | `https://YOUR-DOMAIN` (must match the origin) |
| `BETTER_AUTH_SECRET` | random base64 string |
| `GOOGLE_CLIENT_ID` | from step 2 |
| `GOOGLE_CLIENT_SECRET` | from step 2 |
| `CORSAIR_KEK` | random base64 string |
| `TENANT_ID` | `dev` (or your tenant id) |

### Optional env vars

| Key | Effect when unset |
| --- | --- |
| `OPENAI_API_KEY` | AI triage / catch-me-up / ⌘K return safe defaults |
| `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` | background AI jobs disabled |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_PLAN_ID`, `RAZORPAY_WEBHOOK_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` | billing disabled; app is free-only |

> After the first deploy, set `NEXT_PUBLIC_APP_URL` / `BETTER_AUTH_URL` to the
> real Vercel URL (or your custom domain) and redeploy, and add that origin's
> `/api/auth/callback/google` redirect URI in Google Cloud Console.

## 5. (Optional) Inngest

If you set the Inngest keys, register the serve endpoint
`https://YOUR-DOMAIN/api/inngest` in the Inngest dashboard. Locally,
`pnpm inngest:dev` runs the dev server with no keys.

## 6. (Optional) Razorpay billing

Set all five Razorpay vars, create a monthly **Plan** in the Razorpay dashboard
(its id → `RAZORPAY_PLAN_ID`), and register a webhook at
`https://YOUR-DOMAIN/api/webhooks/razorpay` with the subscription events listed
in `src/app/api/webhooks/razorpay/route.ts`; put its secret in
`RAZORPAY_WEBHOOK_SECRET`.

---

## Verifying locally before deploy

```bash
pnpm install
pnpm typecheck   # clean
pnpm lint        # clean
pnpm build       # set the required env vars first, or use SKIP_ENV_VALIDATION=1
```
