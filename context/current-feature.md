# Current Feature

<!-- Feature Name -->

Prisma + Neon PostgreSQL Setup

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

- Set up Prisma 7 ORM with Neon PostgreSQL (serverless)
- Create the initial schema from the data models in @context/project-overview.md (this will evolve)
- Include the NextAuth models (Account, Session, VerificationToken)
- Add appropriate indexes and cascade deletes
- Create and apply the initial migration

## Notes

<!-- Any extra notes -->

- Use Prisma 7, which has breaking changes. Read the upgrade guide first: https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7
- Setup guide: https://www.prisma.io/docs/getting-started/prisma-orm/quickstart/prisma-postgres
- `DATABASE_URL` points to the Neon development branch; production uses a separate branch
- ALWAYS create migrations (`prisma migrate dev`), never `prisma db push` unless specified
- References: @context/features/database-spec.md, @context/project-overview.md

## History

<!-- Keep this updated. Earliest to latest -->

- **Initial Setup** — Next.js 16, React 19, TypeScript, Tailwind CSS v4 and ESLint, set up with Create Next App (Completed)
- **Dashboard UI Phase 1** — shadcn/ui setup (button, input, kbd), `/dashboard` route and layout, dark mode by default, top bar with the "DL DevLore" brand, centered search and New Collection / New Item buttons (display only), Sidebar and Main placeholders (Completed)
- **Dashboard UI Phase 2** — shadcn/ui sidebar (collapsible to icons, always a drawer on mobile) below the full-width top bar, "Navigation" header with the sidebar toggle, Types linking to `/items/[type]` with colored icons and counts, Favorite and Recent collections from mock data, user avatar area linking to Settings (Completed)
- **Dashboard UI Phase 3** — shadcn/ui card and badge, main area with 4 stats cards (colored glowing icons), recent collections grid with type-colored borders and type icons, pinned items and 10 recent items as type-colored item cards with tags and dates, all from mock data (Completed)
- **Prisma + Neon PostgreSQL Setup** — Prisma 7 with the Neon driver adapter, schema with Auth.js and app models, indexes and cascade deletes, initial migration applied to the Neon dev branch, `prisma.config.ts` using the direct connection for the CLI, Prisma client singleton, `db:*` npm scripts and `scripts/test-db.ts` (Completed)
