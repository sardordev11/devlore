# Toss Pay Phase 1: Core Infrastructure

## Overview

Lay the groundwork for DevLore Pro billing with Toss Payments 자동결제 (billing): the usage-limits module, the database schema, `isPro` in the session, and the server-side Toss client, billing-key encryption and plan math. Nothing in this phase calls Toss from a page, charges a card or changes what users can do. Limits are defined here but enforced in Phase 2.

Reference: `docs/toss-pay-integration-plan.md` (sections 0, 1, 4, 5.1–5.6, 6.1, 6.2, 9 steps 1–3).

## Requirements

### Usage-limits module: `src/lib/usage-limits.ts`

The project overview calls this `lib/plan.ts`; it lives in `src/lib/usage-limits.ts` instead. Pure functions only (no Prisma, no `server-only`), so client components can import the constants for UI hints in Phase 2.

- `ENFORCE_PLAN_LIMITS`: `true` only when `process.env.ENFORCE_PLAN_LIMITS === "true"`, so a missing env var leaves everything unlocked during development
- `FREE_LIMITS = { items: 50, collections: 3 } as const`
- `PRO_ONLY_TYPE_SLUGS = ["files", "images"] as const` and `isProOnlyTypeSlug(slug)`
- `canUsePro(user: { isPro: boolean })`: `!ENFORCE_PLAN_LIMITS || user.isPro`
- `isWithinLimit(count, limit, isPro)`: `canUsePro({ isPro }) || count < limit`
- `canCreateItem(plan)`, `canCreateCollection(plan)` and `canUseTypeSlug(plan, slug)` taking a `UserPlan` (`{ isPro, itemCount, collectionCount }`), built on the two helpers above
- `UPGRADE_MESSAGES` for `items`, `collections` and `fileTypes`, using the `FREE_LIMITS` numbers in the text
- `UserPlan` type in `src/types/billing.ts`

### Database: `prisma/schema.prisma`

Migration via `npx prisma migrate dev --name toss_billing` (never `db push`), applied to the Neon `development` branch only. Schema as in plan section 5.1:

- `User`: remove the unused `stripeCustomerId` and `stripeSubscriptionId`; add `tossCustomerKey String? @unique`, `subscription Subscription?`, `payments Payment[]`; keep `isPro`
- Enums `BillingPlan` (`MONTHLY`, `YEARLY`), `SubscriptionStatus` (`ACTIVE`, `CANCELED`, `PAST_DUE`, `EXPIRED`), `PaymentStatus` (`DONE`, `FAILED`)
- `Subscription` (one per user, cascade delete): plan, status, encrypted `billingKey`, `billingKeyHash @unique`, masked card fields, KRW `amount`, `currentPeriodStart`/`currentPeriodEnd`, `failedAttempts`, `nextRetryAt`, `@@index([status, currentPeriodEnd])`
- `Payment` (cascade delete): `orderId @unique` (also the Idempotency-Key), `paymentKey @unique`, plan, amount, status, failure code/message, period start/end, `@@index([userId, createdAt])`
- Seed unchanged (`isPro: false` for the demo user)

### Session: `src/auth.ts`, `src/types/next-auth.d.ts`

- Add a `jwt` callback that reads `isPro` from the database on every call (plan section 6.1), since billing changes happen outside the user's request (cron, webhook)
- `session` callback copies `token.isPro` to `session.user.isPro` (default `false`)
- Type extensions: `isPro: boolean` on `Session.user`, `isPro?: boolean` on `JWT`
- `src/auth.config.ts` and `src/proxy.ts` unchanged (edge config never runs the Prisma callback)
- `session.user.isPro` is for UI only; server-side gating uses `getUserPlan`

### Plan math: `src/lib/billing-plans.ts`

- `BILLING_PLANS` with placeholder KRW amounts (₩11,000 monthly, ₩99,000 yearly), `orderName` and `months`, typed with `satisfies Record<BillingPlan, …>`; a comment says the amounts are placeholders until pricing is decided
- `GRACE_DAYS = 3`, `MAX_FAILED_ATTEMPTS = 3`
- `addMonths(date, months)` in UTC, clamping to the last day of the month (Jan 31 → Feb 28/29)
- `addDays(date, days)`
- `getOrderId(userId, periodStart)`: deterministic `sub_<userId>_<YYYYMMDD>`, 6–64 chars of `[A-Za-z0-9_=-]`
- `parseBillingPlan(value)`: `"MONTHLY" | "YEARLY"` or `null`

### Toss client: `src/lib/toss.ts`

`server-only`, plain `fetch` (no server SDK), as in plan section 5.4:

- Basic auth header `base64("<TOSS_SECRET_KEY>:")`, throws when the key is unset
- 60s timeout via `AbortSignal.timeout`
- `TossError` with `code`, `message` and `status` from Toss error bodies
- `issueBillingKey(authKey, customerKey)`, `chargeBillingKey(billingKey, input)` (sends `Idempotency-Key: orderId`), `deleteBillingKey(billingKey)`
- `TossBilling` and `TossPayment` response types

### Billing-key encryption: `src/lib/billing-key-crypto.ts`

`server-only`, AES-256-GCM with `BILLING_KEY_SECRET` (32 bytes, base64), as in plan section 5.5:

- `encryptBillingKey(plain)` → `iv.tag.data` (base64 parts)
- `decryptBillingKey(stored)`, throwing on tampered data
- `hashBillingKey(plain)`: SHA-256 hex for `Subscription.billingKeyHash` (reuse `hashToken` from `src/lib/tokens.ts` if it fits)

### Queries: `src/lib/db/billing.ts`

`server-only`, every function scoped by `userId` or subscription id:

- `getUserPlan(userId)`: `isPro` plus item and collection counts in one query, `null` for an unknown user
- `getOrCreateCustomerKey(userId)`: `dl_<uuid>` stored on first use
- `getBillingOverview(userId)`: plan, status, masked card, amount, `currentPeriodEnd`
- `getDueSubscriptions(now, take = 50)`
- `activateSubscription`, `recordRenewal`, `recordFailedRenewal`, `expireSubscription`, `cancelSubscription`, `resumeSubscription`, `handleBillingDeleted`: each a `prisma.$transaction` that updates `Subscription`, inserts a `Payment` row where relevant, and sets `User.isPro` to match the status (plan section 4.2)

### Config

- `.env.example`: replace the uncommitted Toss block with the list from plan section 6.2 (`TOSS_SECRET_KEY`, `NEXT_PUBLIC_TOSS_CLIENT_KEY`, optional `TOSS_WEBHOOK_SECRET`, `BILLING_KEY_SECRET`, `CRON_SECRET`, `ENFORCE_PLAN_LIMITS`), each with a comment; drop `TOSS_PUBLISHABLE_KEY` and the `TOSS_PRICE_ID_*` entries
- `src/lib/rate-limit.ts`: add a `billing` limiter (5 per 10 min), used in Phase 2

## Out of Scope (Phase 2)

- Enforcing limits in `createItem`, `createCollection` and `/api/upload`
- `/api/billing/confirm`, `/api/cron/billing`, `vercel.json`, `/api/webhooks/toss`
- Cancel/resume server actions and the `deleteAccount` change
- `/settings/billing`, upgrade and cancel UI, the client SDK package, homepage changes
- KRW pricing, audience and contract decisions (plan section 0)

## Testing

Unit tests (Vitest, colocated, mocking `@/lib/prisma` and stubbing `fetch`/`process.env`):

- `src/lib/usage-limits.test.ts`:
  - With the flag off (unset, `""`, `"false"`, `"TRUE"`): `canUsePro` is `true` for free users, every limit helper allows, File/Image allowed
  - With the flag `"true"`: `canUsePro` follows `isPro`; free user allowed at 49 items and blocked at 50, allowed at 2 collections and blocked at 3; Pro user allowed far past both limits; `canUseTypeSlug` blocks `files` and `images` for free users only and allows the 5 text/link types
  - `isWithinLimit` boundaries (`count === limit - 1`, `count === limit`, `count > limit`)
  - `isProOnlyTypeSlug` for all 7 system slugs and an unknown slug
  - `UPGRADE_MESSAGES` include the `FREE_LIMITS` numbers
  - The flag is read at import time, so use `vi.stubEnv` + `vi.resetModules()` and a dynamic `import()` per case
- `src/lib/billing-plans.test.ts`: `addMonths` (Jan 31 → Feb 28 and Feb 29 in a leap year, Dec → Jan, 12 months), `addDays`, `getOrderId` length/charset and determinism, `parseBillingPlan`
- `src/lib/billing-key-crypto.test.ts`: round trip, different ciphertext per call, tampered data throws, wrong key length throws, hash is stable
- `src/lib/toss.test.ts`: auth header, missing secret throws, error body → `TossError` with `code`/`status`, `Idempotency-Key` equals `orderId`, billing key URL-encoded
- `src/lib/db/billing.test.ts`: `getUserPlan` mapping and `null`; `getOrCreateCustomerKey` creates once and reuses; each transaction sets `isPro` together with the status

Then `npm run test:run`, `npm run build` and `npm run db:status`. Nothing to check in the browser beyond signing in and out once to confirm the new `jwt` callback doesn't break sessions.
