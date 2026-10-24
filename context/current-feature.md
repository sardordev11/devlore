# Current Feature

<!-- Feature Name -->

Dashboard Collections

## Status

<!-- Not Started|In Progress|Completed -->

In Progress

## Goals

<!-- Goals & requirements -->

- Replace the mock collection data in the dashboard main area with real data from the Neon database via Prisma (instead of `src/lib/mock-data.ts`)
- Keep the current layout of 6 recent collection cards
- Create `src/lib/db/collections.ts` with the data fetching functions
- Fetch collections directly in the server component
- Derive each collection card's border color from the most-used content type in that collection
- Show small icons of all types in that collection
- Update the collection stats display
- Keep the current design

## Notes

<!-- Any extra notes -->

- Full spec: @context/features/dashboard-collections-spec.md
- Do not add the items underneath yet; that comes later
- Reference @context/screenshots/dashboard-ui-main.png if needed; layout and design already exist

## History

<!-- Keep this updated. Earliest to latest -->

- **Initial Setup** — Next.js 16, React 19, TypeScript, Tailwind CSS v4 and ESLint, set up with Create Next App (Completed)
- **Dashboard UI Phase 1** — shadcn/ui setup (button, input, kbd), `/dashboard` route and layout, dark mode by default, top bar with the "DL DevLore" brand, centered search and New Collection / New Item buttons (display only), Sidebar and Main placeholders (Completed)
- **Dashboard UI Phase 2** — shadcn/ui sidebar (collapsible to icons, always a drawer on mobile) below the full-width top bar, "Navigation" header with the sidebar toggle, Types linking to `/items/[type]` with colored icons and counts, Favorite and Recent collections from mock data, user avatar area linking to Settings (Completed)
- **Dashboard UI Phase 3** — shadcn/ui card and badge, main area with 4 stats cards (colored glowing icons), recent collections grid with type-colored borders and type icons, pinned items and 10 recent items as type-colored item cards with tags and dates, all from mock data (Completed)
- **Prisma + Neon PostgreSQL Setup** — Prisma 7 with the Neon driver adapter, schema with Auth.js and app models, indexes and cascade deletes, initial migration applied to the Neon dev branch, `prisma.config.ts` using the direct connection for the CLI, Prisma client singleton, `db:*` npm scripts and `scripts/test-db.ts` (Completed)
- **Seed Data** — `prisma/seed.ts` with the demo user (bcryptjs-hashed password), 7 system item types, 5 collections with realistic snippets, prompts, commands and links, idempotent re-runs, seed registered in `prisma.config.ts` and `db:seed` npm script (Completed)
