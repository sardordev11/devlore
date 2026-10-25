# Current Feature

<!-- Feature Name -->

Dashboard Items

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

- Replace the mock pinned and recent item data in the dashboard main area with real data from the Neon database via Prisma (instead of `src/lib/mock-data.ts`)
- Create `src/lib/db/items.ts` with the data fetching functions
- Fetch items directly in the server component
- Derive each item card's icon and border color from the item type
- Display item type tags and everything else currently on the cards
- Hide the pinned section entirely when there are no pinned items
- Update the collection stats display
- Keep the current design

## Notes

<!-- Any extra notes -->

- Full spec: @context/features/dashboard-items-spec.md
- Reference @context/screenshots/dashboard-ui-main.png if needed; layout and design already exist

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
