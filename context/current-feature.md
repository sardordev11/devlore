# Current Feature

<!-- Feature Name -->

Seed Data

## Status

<!-- Not Started|In Progress|Completed -->

In Progress

## Goals

<!-- Goals & requirements -->

- Create `prisma/seed.ts` to populate the database with sample data for development and demos (overwrite any existing seed file)
- Demo user:
  - Email `demo@devlore.io`, name `Demo User`
  - Password `12345678`, hashed with `bcryptjs` (12 rounds)
  - `isPro: false`, `emailVerified` set to the current date
- 7 system item types (`isSystem: true`, `userId: null`): snippet, prompt, command, note, file, image, link, with the Lucide icon names and colors from the spec
- 5 collections owned by the demo user, each with its items:
  - **React Patterns** (_Reusable React patterns and hooks_): 3 TypeScript snippets (custom hooks like useDebounce / useLocalStorage, component patterns like context providers / compound components, utility functions)
  - **AI Workflows** (_AI prompts and workflow automations_): 3 prompts (code review, documentation generation, refactoring assistance)
  - **DevOps** (_Infrastructure and deployment resources_): 1 snippet (Docker / CI/CD config), 1 command (deployment script), 2 links (real documentation URLs)
  - **Terminal Commands** (_Useful shell commands for everyday development_): 4 commands (git operations, Docker, process management, package manager utilities)
  - **Design Resources** (_UI/UX resources and references_): 4 links with real URLs (CSS/Tailwind reference, component library, design system, icon library)
- Make the seed idempotent so it can be re-run safely (upsert the user and system types; clear and recreate the demo user's items and collections)
- Register the seed command in `prisma.config.ts` and add a `db:seed` npm script

## Notes

<!-- Any extra notes -->

- Full spec: @context/features/seed-spec.md
- System types also need `slug`, `contentType` and `isProOnly` (schema requires them); take these from the System Type Seed in @context/project-overview.md
- Set each item's `contentType` and `language` (snippets/commands) to match its type; link items use `url`
- Item content should be realistic, usable code/prompts/commands, not placeholder text
- Install `bcryptjs` as a dependency
- Reuse the Prisma client setup (Neon driver adapter) from the existing app code / `scripts/test-db.ts`
- No schema changes expected; if any are needed, use `prisma migrate dev`, never `db push`

## History

<!-- Keep this updated. Earliest to latest -->

- **Initial Setup** — Next.js 16, React 19, TypeScript, Tailwind CSS v4 and ESLint, set up with Create Next App (Completed)
- **Dashboard UI Phase 1** — shadcn/ui setup (button, input, kbd), `/dashboard` route and layout, dark mode by default, top bar with the "DL DevLore" brand, centered search and New Collection / New Item buttons (display only), Sidebar and Main placeholders (Completed)
- **Dashboard UI Phase 2** — shadcn/ui sidebar (collapsible to icons, always a drawer on mobile) below the full-width top bar, "Navigation" header with the sidebar toggle, Types linking to `/items/[type]` with colored icons and counts, Favorite and Recent collections from mock data, user avatar area linking to Settings (Completed)
- **Dashboard UI Phase 3** — shadcn/ui card and badge, main area with 4 stats cards (colored glowing icons), recent collections grid with type-colored borders and type icons, pinned items and 10 recent items as type-colored item cards with tags and dates, all from mock data (Completed)
- **Prisma + Neon PostgreSQL Setup** — Prisma 7 with the Neon driver adapter, schema with Auth.js and app models, indexes and cascade deletes, initial migration applied to the Neon dev branch, `prisma.config.ts` using the direct connection for the CLI, Prisma client singleton, `db:*` npm scripts and `scripts/test-db.ts` (Completed)
