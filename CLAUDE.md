# DevLore

A developer knowledge hub for snippets, commands, prompts, notes, files, images, links and custom types.

## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Commands

- `npm run dev` — dev server at http://localhost:3000 (Turbopack)
- `npm run build` — production build (also type-checks)
- `npm run start` — serve the production build
- `npm run lint` — ESLint (flat config, `eslint-config-next` core-web-vitals + typescript)
- `npm run db:generate` — generate the Prisma client
- `npm run db:migrate` — create and apply a migration (`prisma migrate dev`)
- `npm run db:deploy` — apply pending migrations (`prisma migrate deploy`)
- `npm run db:status` — check that migrations are in sync
- `npm run db:studio` — open Prisma Studio
- `npm run db:seed` — seed the demo user, system types and sample data
- `npm run db:test` — test the database connection and demo data (`scripts/test-db.ts`)
- `npm run db:delete-users` — delete all non-demo users (dry run unless run as `npm run db:delete-users -- --confirm`)

## Neon Database (MCP)

When using the Neon MCP tools, always target:

- **Project:** `devlore` (ID: `snowy-tree-78812208`)
- **Branch:** `development` (ID: `br-old-sea-b5zvld7r`)

Rules:

- Always pass `project_id: "snowy-tree-78812208"` and `branch_id: "br-old-sea-b5zvld7r"` explicitly. Never rely on the default branch, which is `production`.
- **Never touch the `production` branch** (ID: `br-late-truth-b5v88jo9`) unless I explicitly say "production" in my request. This covers reads, writes, migrations and branch operations.
- Before running any destructive SQL (`DELETE`, `UPDATE`, `DROP`, `TRUNCATE`, `ALTER`) or any destructive Neon tool, even on `development`, ask me first.
- Schema changes go through Prisma migrations (`npx prisma migrate dev`), never through direct SQL or the MCP.
