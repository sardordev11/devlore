# Toss Pay Phase 2: Integration & UI

## Overview

Connect the Phase 1 infrastructure to Toss Payments and the app: the card-registration and first-charge flow, daily renewals, the `BILLING_DELETED` webhook, cancel/resume, feature gating behind `ENFORCE_PLAN_LIMITS`, and the `/settings/billing` page with upgrade prompts.

Reference: `docs/toss-pay-integration-plan.md` (sections 2, 3, 4.1, 5.7–5.11, 6, 7, 8, 9 steps 4–8).

## Prerequisites

- Phase 1 merged (`src/lib/usage-limits.ts`, schema, `isPro` in the session, `src/lib/toss.ts`, `src/lib/billing-key-crypto.ts`, `src/lib/billing-plans.ts`, `src/lib/db/billing.ts`)
- Toss test keys (API 개별 연동 키, not widget keys) in `.env.local`
- Decisions from plan section 0 made, at least KRW amounts and whether the homepage shows KRW, USD or both. If not, ship with the placeholder amounts and leave the homepage prices unchanged

## Requirements

### Upgrade flow: `src/app/api/billing/confirm/route.ts`

Toss success URL, as in plan section 5.7:

- `auth()` first (sign-in redirect), `billing` rate limit, `plan` parsed with `parseBillingPlan`
- `customerKey` from the URL must equal the user's stored key, otherwise redirect with `error=invalid` and no Toss call
- Guard: a user with an `ACTIVE` or `PAST_DUE` subscription is redirected without charging
- Issue the billing key, charge the first period, require `status === "DONE"`, then `activateSubscription` with the encrypted key and its hash
- On any failure after issuing, delete the billing key (best effort) and redirect to `/settings/billing?error=<code>`
- Change card (`mode=change`): issue a new key, replace the stored one, delete the old one, no charge

### Renewals: `src/lib/billing-cycle.ts`, `src/app/api/cron/billing/route.ts`, `vercel.json`

As in plan section 5.8:

- `runBillingCycle(now)`: charges due `ACTIVE`/`PAST_DUE` subscriptions one at a time, extends the period on success, moves failures to `PAST_DUE` with `nextRetryAt` one day later, expires after `MAX_FAILED_ATTEMPTS`, expires `CANCELED` subscriptions at the period end and deletes their billing key; one subscription's error never stops the run; returns `{ renewed, failed, expired }`
- Route: `GET`, 401 unless `Authorization: Bearer <CRON_SECRET>` (and 401 when `CRON_SECRET` is unset), `maxDuration = 300`
- `vercel.json`: `{ "crons": [{ "path": "/api/cron/billing", "schedule": "0 1 * * *" }] }` (10:00 KST)

### Webhook: `src/app/api/webhooks/toss/route.ts`

As in plan section 5.9:

- Zod-validated body; `200` for every event other than `BILLING_DELETED` and for malformed bodies, so Toss doesn't retry
- `BILLING_DELETED`: `handleBillingDeleted(billingKey)` matches on `billingKeyHash`, clears the key and switches the subscription to `CANCELED` (access until `currentPeriodEnd`); `500` only on a database error so Toss retries
- Respond within 10 seconds; no Toss calls inside the handler
- Signature check (`tosspayments-webhook-signature`) only if testing shows Toss signs `BILLING_DELETED`; otherwise `TOSS_WEBHOOK_SECRET` stays unused and the handler stays safe because it can only stop a renewal

### Server actions: `src/actions/billing.ts`

Session check, `{ success, data, error }`, user id only from the session, `refresh()` on success:

- `getCustomerKey()`: the user's `customerKey` for the client SDK, created on first use
- `cancelSubscription()`: `ACTIVE` → `CANCELED`, keeps access and the billing key until `currentPeriodEnd`; "No active subscription" otherwise
- `resumeSubscription()`: `CANCELED` → `ACTIVE` before the period ends while the billing key exists

`src/actions/profile.ts` `deleteAccount`: load the subscription before the cascade and call `deleteBillingKey` (best effort, logged), so sign-out still happens if Toss fails.

### Feature gating

Server checks use `getUserPlan` (never `session.user.isPro`) and the helpers from `src/lib/usage-limits.ts`. With `ENFORCE_PLAN_LIMITS` unset, nothing changes.

| Where | Check | Failure |
| --- | --- | --- |
| `createItem` in `src/actions/items.ts` | `canUseTypeSlug` for `files`/`images`, then `canCreateItem` | `UPGRADE_MESSAGES.fileTypes` / `.items` via `fail()` so an uploaded file is removed |
| `createCollection` in `src/actions/collections.ts` | `canCreateCollection` | `UPGRADE_MESSAGES.collections` |
| `POST /api/upload` | `canUsePro` after the rate limit, before buffering | 403 with `UPGRADE_MESSAGES.fileTypes` |

Results carry an `upgrade: true` flag (or a shared error code) so the client can show the upgrade link with the toast. Count-then-create races are acceptable; no locking.

### UI

| File | Purpose |
| --- | --- |
| `src/app/settings/billing/page.tsx` | Server page (`connection()`, `auth()`, `callbackUrl=/settings/billing`): plan, status badge, masked card, next charge date and amount, Upgrade / Change card / Cancel / Resume; banners for `?upgraded=1` and `?error=` mapped to friendly messages, `PAY_PROCESS_CANCELED` shown as a neutral "Card registration cancelled" |
| `src/app/settings/billing/loading.tsx` | Skeleton matching the other settings pages |
| `src/components/billing/UpgradeButton.tsx` | Client: Monthly/Yearly choice with KRW amounts from `BILLING_PLANS`, loads `@tosspayments/tosspayments-sdk`, calls `requestBillingAuth` with success URL `/api/billing/confirm?plan=…` and fail URL `/settings/billing` |
| `src/components/billing/CancelSubscriptionDialog.tsx` | shadcn `AlertDialog` saying access lasts until the period end, "Cancelling…" pending state, toast |
| `src/components/billing/UpgradePrompt.tsx` | Small "Upgrade to Pro" link to `/settings/billing`, used in limit-error toasts and hints |
| `src/app/settings/page.tsx` | New "Billing" `DashboardSection` with the plan name and a link to `/settings/billing` |
| `TypeSelector` / `CreateItemDialog` | File and Image disabled with an upgrade hint for free users when limits are enforced (`isPro` and the flag passed from the server) |
| `CreateCollectionDialog`, top bar "New" buttons | Show the collection/item limit message with `UpgradePrompt` when the server rejects |
| `src/lib/homepage.ts` | `getPlanHref` sends signed-in users to `/settings/billing` for the Pro card; prices only if the pricing decision is made |

### Other changes

- `npm install @tosspayments/tosspayments-sdk` (client SDK v2 only)
- `context/project-overview.md`: Stripe → Toss Payments in the architecture diagram, tech stack, env vars, `/settings/billing` description and `/api/webhooks/toss` route

## Out of Scope

- Going live: billing contract, live keys, live webhook registration, `ENFORCE_PLAN_LIMITS=true` in production (plan section 9 step 9)
- Downgrade handling for data over the free limits (open question in the project overview); existing items and collections stay, only new ones are blocked
- Invoices, receipts, refunds, proration and plan switching between Monthly and Yearly
- International cards or a second payment provider
- AI features, export and custom types (gated with `canUsePro` when they're built)

## Testing

### Unit tests (Vitest, mocking `@/auth`, `@/lib/prisma`, `@/lib/toss`)

- `src/lib/billing-cycle.test.ts`: renews due `ACTIVE`, retries `PAST_DUE`, sets `nextRetryAt`, expires after `MAX_FAILED_ATTEMPTS`, expires `CANCELED` and deletes the key, continues after one subscription throws, treats a non-`DONE` payment as a failure
- `src/actions/billing.test.ts`: cancel and resume, signed out, no subscription, resume after the period ended
- `src/actions/items.test.ts`: 51st item rejected only when enforced, File/Image rejected for free users and the upload removed, Pro user unrestricted
- `src/actions/collections.test.ts`: 4th collection rejected only when enforced
- `src/actions/profile.test.ts`: `deleteAccount` deletes the billing key and still signs out when Toss fails
- Route handlers aren't unit tested (project rule); keep their logic in `src/lib` where possible

### Manual testing with Toss test keys

Toss has no CLI like the Stripe CLI (no `listen`/`trigger` for forwarding or firing events). Test against the Toss test environment instead:

- **Webhooks:** expose the dev server with ngrok (or use a Vercel preview URL), register `https://<tunnel>/api/webhooks/toss` for `BILLING_DELETED` in the developer center (웹훅 → 웹훅 등록하기), then delete a billing key from the test admin and watch it arrive. For quick checks, `curl -X POST` a sample `BILLING_DELETED` payload to `localhost:3000/api/webhooks/toss`
- **Cron:** `curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/cron/billing` after moving a subscription's `currentPeriodEnd` into the past on the Neon `development` branch (ask before running the `UPDATE`, per `CLAUDE.md`)

Checklist (plan section 8):

- [ ] Monthly upgrade: card window opens, redirect to `/settings/billing?upgraded=1`, `Subscription` `ACTIVE`, one `Payment` `DONE`, `isPro` true, Pro shown without signing out
- [ ] Yearly upgrade: period end 12 months out, amount matches `BILLING_PLANS.YEARLY`
- [ ] Closing the card window shows the neutral cancelled message
- [ ] Tampered `customerKey` rejected without a charge; reloading the success URL doesn't charge again
- [ ] Change card replaces the masked card without a new `Payment`
- [ ] Cron renews and extends the period; a second call charges nothing; missing or wrong `Authorization` returns 401
- [ ] Cancel → Pro until the period end → cron expires it → `isPro` false on the next page load; Resume before the period end
- [ ] `BILLING_DELETED` via ngrok switches the subscription to `CANCELED`; unknown events return 200
- [ ] With `ENFORCE_PLAN_LIMITS=true`: free user blocked at 50 items and 3 collections with the upgrade link, File/Image disabled in the dialog and `/api/upload` returns 403; Pro user unrestricted
- [ ] With the flag unset: everything works as today
- [ ] Delete account with an active subscription removes the billing key at Toss
- [ ] `/settings/billing` checked in the browser at 1440px and 390px
- [ ] `npm run test:run`, `npm run build`, `npm run db:status`
