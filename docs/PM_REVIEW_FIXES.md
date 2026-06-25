# PM Review — Fixes & Requirements Traceability

This branch (`fix/pm-review-bugs`) addresses the product-design-review feedback
and ties each change back to the project requirements (Superhuman-style Gmail +
Calendar workflow on Next.js + Postgres + Corsair).

Validated locally: `tsc --noEmit` clean, `next lint` clean, `next build` succeeds
(17/17 routes).

---

## 1. Bug fixes

### 1.1 "Nothing is syncing" — the USP bug  ⭐ root cause found
**Symptom:** Sync reported a count but the inbox / dashboard stayed empty.
**Cause:** `gmail.refreshInbox` called `gmail.api.threads.list()`, which only
writes Corsair's **threads** cache. Every read path (inbox `searchEmails`,
`dashboard`, `notifications`) reads the **messages** cache — which was never
populated. (Confirmed by reading the compiled `@corsair-dev/gmail` plugin:
`threads.list` upserts `db.threads`; only `messages.get` upserts full
subject/body/from/to into `db.messages`.)
**Fix:** `refreshInbox` now lists message IDs and hydrates each via
`messages.get` (format `full`) with bounded concurrency (6 at a time), so the
cache the UI reads actually fills. `src/server/api/routers/gmail.ts`.

### 1.2 Couldn't see mail inbox / couldn't see calendar events
**Cause:** Both pages read from cache and only synced on a manual button click,
so a freshly connected user saw nothing on first load.
**Fix:** One-shot **auto-sync on mount** when the cache is empty, guarded by a
ref so it never loops on a genuinely empty mailbox/week. Calendar re-arms per
week so navigating to an un-synced week pulls it in.
`src/app/(app)/inbox/page.tsx`, `src/app/(app)/calendar/page.tsx`.
(Calendar's `events.getMany` already cached correctly — verified in the plugin
source — so the calendar issue was purely "never auto-synced".)

### 1.3 Reading pane could show an empty body
**Cause:** `gmail.getMessage` short-circuited to the cache when *subject* was
present, even if the body wasn't cached.
**Fix:** Only serve from cache when `data.body` exists; otherwise fall through
to a full fetch. `src/server/api/routers/gmail.ts`.

### 1.4 Slow tab switching + slow Settings customisation
**Cause:** the create-t3-app starter's `timingMiddleware` injected a random
**100–500 ms delay on every tRPC call** in dev. Every navigation/refetch paid
it. Settings also waited for a server round-trip + refetch before reflecting a
toggle.
**Fix:** Removed the artificial delay (kept the timing log).
`src/server/api/trpc.ts`. Made Settings preference toggles **optimistic**
(`onMutate` cache update + rollback). `src/components/app/settings/settings-client.tsx`.

### 1.5 Board: edit + priority
**Requested:** pen icon to edit a task, and priority labels (Urgent / Awaited …).
**Fix:** Added a `priority` column (`urgent | awaited | normal | low`), an
`update` mutation (title and/or priority), and rebuilt the board UI: colored
priority badge + left border, a **pen-icon inline editor**, and a priority
picker when adding. Cards sort by priority within a column. Edits and moves are
optimistic. `src/server/db/schema.ts`, `src/server/api/routers/kanban.ts`,
`src/components/app/board/board-client.tsx`.

### 1.6 Connections: user choice + step-wise Slack/GitHub
**Requested:** let the user connect / disconnect (not auto-connected) and
document how to connect Slack and GitHub.
**Fix:** Connect / Sync / Disconnect were already per-tool; replaced the bare
`window.prompt` token flow with a proper modal containing **numbered
step-by-step setup instructions** for Slack (xoxb token, scopes, install) and
GitHub (classic PAT, scopes), a link to the setup page, and a validated token
field. `src/components/app/connections/connections-client.tsx`.

### 1.7 Razorpay: "billing is not enabled on this deployment"
**Cause:** This message is the app's own correct guard when the `RAZORPAY_*`
env vars are unset — i.e. a **deployment-config gap, not a code bug**. The
billing UI still showed an "Upgrade" button that errored on click.
**Fix:** Wired the existing `status.billingEnabled` flag into the UI: when
billing is off, show a clear disabled "Billing not available" state with a note
to set the env vars, instead of an error-on-click. `src/components/billing/billing-client.tsx`.
**Action required (you):** set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
`RAZORPAY_PLAN_ID`, `RAZORPAY_WEBHOOK_SECRET`, and `NEXT_PUBLIC_RAZORPAY_KEY_ID`
on the deployment to enable Pro upgrades.

### 1.8 Multi-user — "anyone can come and use it"
**State:** Reads are already per-user — every router uses
`getTenant(ctx.user.id)`, so each user's Gmail/Calendar/cache is tenant-isolated;
Kanban + preferences are scoped by `userId` on every write. The auto-sync and
the `refreshInbox` fix all run under the signed-in user's tenant, so multiple
users each see their own mail.
**Hardening:** Extended the edge middleware to also gate `/board`, `/catch-up`,
`/connections`. `src/middleware.ts`.
**Known limitation (not fixed here):** the Corsair **webhook** handler
(`src/app/api/webhooks/route.ts`) processes under the global `TENANT_ID`, so the
*realtime* webhook path isn't per-user yet (polling/manual sync is). Resolving a
tenant from the webhook payload is the documented next step — flagged, not
silently changed, because it needs a product decision on tenant routing.

---

## 2. Requirements → where it lives

| Requirement | Status | Where |
|---|---|---|
| Next.js + Postgres + Corsair stack | ✅ | `package.json`, `src/server/corsair.ts`, Drizzle/Postgres in `src/server/db` |
| Gmail integration via Corsair (mandatory) | ✅ fixed | `src/server/api/routers/gmail.ts` (sync now populates the read cache) |
| Google Calendar via Corsair (mandatory) | ✅ | `src/server/api/routers/calendar.ts` |
| Not a basic Gmail clone — real workflow improvement | ✅ | Unified priority inbox + AI triage + Catch-Me-Up + email→calendar |
| AI improves the workflow (not bolted on) | ✅ | `src/server/lib/ai.ts`, `src/server/api/routers/ai.ts` (triage, digest, ⌘K) |
| **Bonus** — Corsair MCP agent chat | ⚠️ partial | ⌘K command parser proposes structured actions (`parseCommand`); MCP execution is the documented next step |
| **Bonus** — realtime webhooks | ⚠️ partial | `src/app/api/webhooks/route.ts` (works under global tenant; per-user routing pending) |
| **Bonus** — priority filtering via cheap LLM | ✅ | `classifyEmail` (gpt-4o-mini) + Inngest off-request triage |
| **Bonus** — keyboard shortcuts / command palette | ✅ | `src/components/app/command-palette.tsx` (⌘K) |
| **Bonus** — fast local search | ✅ | Reads Corsair's Postgres cache (`db.messages` / `db.events`) instead of the Gmail API |
| Hardcoded Gmail/Calendar data | ✅ none | All reads come from the per-user Corsair cache |

---

## 3. How to run after pulling

```bash
pnpm install
pnpm db:push        # applies the new kanban_tasks.priority column
pnpm dev
pnpm inngest:dev    # separate terminal, for background AI jobs
```

The `priority` column is added via `db:push` (the repo's existing workflow — the
baseline migrations in `drizzle/` predate several tables and aren't the source
of truth). Existing rows default to `normal`.
