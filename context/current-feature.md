# Current Feature

Code Scan Fixes

## Status

<!-- Not Started|In Progress|Completed -->

In Progress

## Goals

<!-- Goals & requirements -->

- **Collection type counts in the database (High #1)** — stop loading every item row of every collection just to count types. Fetch collections with `_count.items`, then get per-collection type counts in one grouped SQL query for all fetched collection ids, and merge them in `toCollectionSummary`
- **Sidebar user from the database (Medium #4)** — add `getDemoUser()` to `src/lib/db/demo-user.ts`, use it in `AppSidebar` instead of `currentUser` from `mock-data`, and type `SidebarUser` with a DB-backed user type instead of `MockUser`
- **Quick wins (low risk)**
  - Low #6: `getItemStats` and `getCollectionStats` use one `groupBy` on `isFavorite` each instead of two `count` queries
  - Low #7: expose `accentColor` on `CollectionSummary` so `CollectionCard` and `SidebarNav` stop relying on `types[0]`
  - Low #8: drop the unneeded `export` on `ItemSummaryType`

## Notes

<!-- Any extra notes -->

- Out of scope: inline styles (#2) and the dashboard stats refactor (#5), which are larger changes
- Medium #3 (approved): deleted the unused `src/lib/dashboard.ts` and `src/lib/mock-data.ts`. Older specs in `context/features/` still mention `mock-data.ts` as history

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
