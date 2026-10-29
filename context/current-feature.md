# Current Feature

<!-- Feature Name -->

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

## Notes

<!-- Any extra notes -->

## History

<!-- Keep this updated. Earliest to latest -->

- **Initial Setup** — Next.js 16, React 19, TypeScript, Tailwind CSS v4 and ESLint, set up with Create Next App (Completed)
- **Dashboard UI Phase 1** — shadcn/ui setup (button, input, kbd), `/dashboard` route and layout, dark mode by default, top bar with the "DL DevLore" brand, centered search and New Collection / New Item buttons (display only), Sidebar and Main placeholders (Completed)
- **Dashboard UI Phase 2** — shadcn/ui sidebar (collapsible to icons, always a drawer on mobile) below the full-width top bar, "Navigation" header with the sidebar toggle, Types linking to `/items/[type]` with colored icons and counts, Favorite and Recent collections from mock data, user avatar area linking to Settings (Completed)
- **Dashboard UI Phase 3** — shadcn/ui card and badge, main area with 4 stats cards (colored glowing icons), recent collections grid with type-colored borders and type icons, pinned items and 10 recent items as type-colored item cards with tags and dates, all from mock data (Completed)
- **Prisma + Neon PostgreSQL Setup** — Prisma 7 with the Neon driver adapter, schema with Auth.js and app models, indexes and cascade deletes, initial migration applied to the Neon dev branch, `prisma.config.ts` using the direct connection for the CLI, Prisma client singleton, `db:*` npm scripts and `scripts/test-db.ts` (Completed)
- **Seed Data** — `prisma/seed.ts` with the demo user (bcryptjs-hashed password), 7 system item types, 5 collections with realistic snippets, prompts, commands and links, idempotent re-runs, seed registered in `prisma.config.ts` and `db:seed` npm script (Completed)
- **Dashboard Collections** — `src/lib/db/collections.ts`, 6 recent collections fetched from the database in the server component, card border color from the most-used type, type icons per collection, updated collection stats (Completed)
- **Dashboard Items** — `src/lib/db/items.ts`, pinned items (hidden when none) and 10 recent items fetched from the database in the server component, item card icon and border color from the item type, tags and dates, Total Items and Favorite Items stats from the database, shared demo-user filter in `src/lib/db/demo-user.ts` (Completed)
- **Stats & Sidebar** — sidebar types and collections fetched from the database (`getSidebarItemTypes` in `src/lib/db/items.ts`, `getSidebarCollections` in `src/lib/db/collections.ts`), type links to `/items/[slug]` with icons and counts, favorite collections with stars, recent collections with a colored circle from the most-used type, "View all collections" link to `/collections`, async `SidebarNav` in a Suspense boundary with a skeleton fallback (Completed)
- **Add Pro Badge to Sidebar** — subtle outline shadcn `Badge` reading "PRO" next to the File and Image types, driven by `ItemType.isProOnly` from `getSidebarItemTypes`, hidden when the sidebar collapses to icons, sidebar labels truncate explicitly so long names still get "…" (Completed)
- **Code Scan Fixes** — collection type counts from one grouped SQL query instead of loading every item row (`_count.items` plus a `$queryRaw` shared by sidebar favorites and recents), sidebar user from the database via `getDemoUser()` in `src/lib/db/demo-user.ts` with a Suspense skeleton, single `groupBy` for item and collection stats, `accentColor` on `CollectionSummary`, unused `src/lib/dashboard.ts` and `src/lib/mock-data.ts` removed (Completed)
- **Auth Phase 1** — NextAuth v5 (`next-auth@beta`) with `@auth/prisma-adapter`, split config (edge-safe `src/auth.config.ts` with the GitHub provider, `src/auth.ts` with the Prisma adapter and JWT sessions), `session.user.id` from the token with a `Session` type extension in `src/types/next-auth.d.ts`, `/api/auth/[...nextauth]` route handlers, `src/proxy.ts` protecting `/dashboard/*` and redirecting signed-out users to NextAuth's default sign-in page (Completed)
- **Auth Phase 2** — Credentials (email/password) provider alongside GitHub, edge-safe placeholder in `src/auth.config.ts` overridden in `src/auth.ts` with a bcrypt check against `User.passwordHash`, `POST /api/auth/register` (Zod validation, password match, 409 on duplicate email including concurrent `P2002`, bcrypt hash with 12 rounds, `{ success, data, error }` responses), shared Zod schemas in `src/lib/validations/auth.ts` (emails trimmed and lowercased, passwords 8–72 chars), `zod` added (Completed)
- **Auth Phase 3** — custom `/sign-in` (email/password + GitHub, Zod validation, error display, NextAuth `?error=` messages) and `/sign-up` (posts to `/api/auth/register`, "Account created successfully!" Sonner toast at top center, redirect to sign-in) in a `(auth)` route group, server actions in `src/actions/auth.ts` (credentials and GitHub sign-in with same-site `callbackUrl` only, sign-out), `pages.signIn` and the proxy redirect pointing to `/sign-in`, reusable `UserAvatar` (GitHub image or initials), sidebar user from the session with a Profile / Sign out menu, unused `getDemoUser()` removed, shadcn label, dropdown-menu and sonner added (Completed)
- **Email Verification** — `resend` with a mail helper in `src/lib/email.ts` (`EMAIL_FROM` override, `onboarding@resend.dev` default), `POST /api/auth/register` emails a 24h verification link (random token, only its SHA-256 hash stored in `VerificationToken`, earlier tokens replaced) via `src/lib/verification.ts`, `GET /api/auth/verify-email` sets `emailVerified` and redirects to `/sign-in?verified=1` (success banner) or `/verify-email?error=` (expired/invalid page with a resend form), credentials sign-in blocked until verified via a custom `CredentialsSignin` code with a "Resend verification email" button, `resendVerificationEmail` server action with a 60s cooldown and the same response for unknown emails, sign-up toast now "Check your email to verify your account", shared `emailSchema` in `src/lib/validations/auth.ts`, plus `scripts/delete-users.ts` (`db:delete-users`, dry run unless `--confirm`) to remove all non-demo users (Completed)
