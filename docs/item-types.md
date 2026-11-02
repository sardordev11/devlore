# Item Types

Reference for DevLore's 7 system item types: what each one is for, which `Item` fields it uses, and how types are stored and displayed today.

**Sources:** `context/project-overview.md`, `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/type-icons.ts`, `src/lib/db/items.ts`, `src/lib/db/collections.ts`, `src/lib/db/profile.ts`, `src/components/dashboard/*`, `src/components/profile/TypeBreakdown.tsx`.

> `src/lib/constants.tsx` (listed as a source in the research prompt) does not exist. The icon mapping lives in `src/lib/type-icons.ts`, and all other type metadata (name, slug, color, content type, Pro flag) lives in the database, seeded from `SYSTEM_TYPES` in `prisma/seed.ts`.

---

## Quick reference

Listed in seed order, which is also the sidebar and profile display order (both sort system types by `createdAt asc`).

| # | Name      | Slug (`/items/…`) | Icon (Lucide) | Color     | Content type | Plan |
| - | --------- | ----------------- | ------------- | --------- | ------------ | ---- |
| 1 | `snippet` | `snippets`        | `Code`        | `#3b82f6` | `TEXT`       | Free |
| 2 | `prompt`  | `prompts`         | `Sparkles`    | `#8b5cf6` | `TEXT`       | Free |
| 3 | `command` | `commands`        | `Terminal`    | `#f97316` | `TEXT`       | Free |
| 4 | `note`    | `notes`           | `StickyNote`  | `#fde047` | `TEXT`       | Free |
| 5 | `file`    | `files`           | `File`        | `#6b7280` | `FILE`       | Pro  |
| 6 | `image`   | `images`          | `Image`       | `#ec4899` | `FILE`       | Pro  |
| 7 | `link`    | `links`           | `Link`        | `#10b981` | `URL`        | Free |

All seven are created with `isSystem: true` and `userId: null`. The overview table lists them in a different order (Snippet, Prompt, Note, Command, Link, File, Image). The seed order is the one the UI shows.

---

## Per-type details

### Snippet

- **Icon / color:** `Code` / `#3b82f6` (blue)
- **Purpose:** reusable code: hooks, utilities, config files, Dockerfiles.
- **Key fields:** `content` (the code), `language` (syntax highlighting, e.g. `typescript`, `dockerfile`), plus `title` and `description`.
- **Seed examples:** `useDebounce & useLocalStorage hooks`, `Next.js multi-stage Dockerfile`.

### Prompt

- **Icon / color:** `Sparkles` / `#8b5cf6` (purple)
- **Purpose:** AI prompts, system messages and workflow templates. Seeded prompts use `{{code}}` placeholders.
- **Key fields:** `content` (prompt text). `language` is not set on seeded prompts.
- **AI features (Pro, planned):** Prompt Optimizer, summaries.
- **Seed examples:** `Code review prompt`, `Documentation generator`, `Refactoring assistant`.

### Command

- **Icon / color:** `Terminal` / `#f97316` (orange)
- **Purpose:** shell and CLI one-liners you'd otherwise dig out of bash history.
- **Key fields:** `content` (the command), `language` (seeded as `bash`).
- **Seed examples:** `git reset --soft HEAD~1`, `lsof -ti tcp:3000 | xargs kill -9`.

### Note

- **Icon / color:** `StickyNote` / `#fde047` (yellow)
- **Purpose:** free-form Markdown notes, explanations and course notes.
- **Key fields:** `content` (Markdown). `language` normally unused.
- **Seed examples:** none. The demo data has no notes yet.

### File

- **Icon / color:** `File` / `#6b7280` (gray)
- **Purpose:** uploaded documents and context files (stored in Cloudflare R2).
- **Key fields:** `fileUrl`, `fileName`, `fileSize` (bytes), `mimeType`.
- **Plan:** Pro only (`isProOnly: true`). During development `ENFORCE_PLAN_LIMITS` is meant to keep it open to everyone.
- **Seed examples:** none. Upload (`/api/upload`, presigned R2 URLs) isn't built yet.

### Image

- **Icon / color:** `Image` / `#ec4899` (pink)
- **Purpose:** screenshots, diagrams and other images.
- **Key fields:** same as File. `mimeType` decides between an image preview and a plain download.
- **Plan:** Pro only.
- **Seed examples:** none.

### Link

- **Icon / color:** `Link` / `#10b981` (emerald)
- **Purpose:** bookmarks to docs, tools and references.
- **Key fields:** `url`, plus `title` and `description`.
- **Seed examples:** `Docker documentation`, `Tailwind CSS documentation`, `shadcn/ui`, `Lucide Icons`.

---

## Classification by content type

`ContentType` is an enum on both `ItemType` (decides which editor or uploader to show) and `Item` (decides which fields hold the payload).

| Content type | Types                              | Payload fields                                  | Editor (planned)            |
| ------------ | ---------------------------------- | ----------------------------------------------- | --------------------------- |
| `TEXT`       | snippet, prompt, command, note     | `content` (`@db.Text`), `language` (optional)   | Markdown / code editor      |
| `FILE`       | file, image                        | `fileUrl`, `fileName`, `fileSize`, `mimeType`   | File uploader (R2)          |
| `URL`        | link                               | `url`                                           | URL input                   |

Fields for the other content types are left `null`. Nothing in the schema enforces this; it is up to the create/update code.

**Watch out:** `Item.contentType` duplicates `ItemType.contentType`, and nothing keeps them in sync. The seed derives it from the data (`item.url ? "URL" : "TEXT"`) rather than reading the type. Item create/update actions should copy it from the chosen type (or validate it against the type).

---

## Shared properties

### On every item type (`ItemType`)

| Field         | Notes                                                                 |
| ------------- | --------------------------------------------------------------------- |
| `name`        | Singular, lowercase (`snippet`). Shown capitalized in the UI.         |
| `slug`        | Plural URL segment (`snippets`). Unique per `userId`.                 |
| `icon`        | Lucide icon **name** as a string, resolved by `getTypeIcon()`.        |
| `color`       | 6-digit hex string.                                                   |
| `contentType` | `TEXT` / `FILE` / `URL`.                                              |
| `isSystem`    | `true` for the 7 built-ins; they can't be edited or deleted.          |
| `isProOnly`   | `true` for file and image.                                            |
| `userId`      | `null` for system types; set for future custom (Pro) types.           |

Deleting a type is blocked while items use it (`Item.type` is `onDelete: Restrict`). Deleting a type that is a collection's `defaultType` sets that field to `null`.

### On every item (`Item`), regardless of type

- `title` (required), `description` (optional)
- `isFavorite`, `isPinned`, `lastUsedAt` (powers "Recently used")
- `tags` (implicit many-to-many with per-user `Tag`)
- `collections` (many-to-many through `ItemCollection`)
- `userId`, `typeId`, `createdAt`, `updatedAt`

---

## Display differences

Type styling comes entirely from the database row. There are no per-type components or switch statements yet.

| Where                         | How the type shows up                                                                                                         |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Sidebar** (`SidebarNav`)    | Icon tinted with `type.color`, item count, link to `/items/[slug]`, outline "PRO" badge when `isProOnly`.                      |
| **Item card** (`ItemCard`)    | 2px left border in `type.color`; icon in a tile with `${color}1a` (~10% alpha) background and `color` foreground.              |
| **Collection card**           | Left border uses `accentColor`, the color of the collection's most-used type; one tinted icon per type it contains.           |
| **Sidebar recent collections**| Small colored circle in the most-used type's color.                                                                           |
| **Profile** (`TypeBreakdown`) | Same tinted icon tile as item cards, with the per-user count; label is `` `${name}s` `` (capitalized), not the slug.          |

Every view so far renders the same card layout for all types. Type-specific rendering (syntax-highlighted code, Markdown, image previews, link favicons/opening the URL, file download) is still to be built in the item drawer and `/items/[type]` pages.

Icon resolution: `getTypeIcon(name)` in `src/lib/type-icons.ts` maps the 7 icon names to Lucide components and falls back to `FileQuestionIcon` for unknown names. A custom type with any other icon will need its name added to that map.

---

## Gaps and notes for upcoming work

- **No `/items/[type]` page yet.** Sidebar links point to it, but only `/dashboard` and `/profile` exist under the app shell.
- **Seed coverage:** no note, file or image items in the demo data.
- **`contentType` duplication** (see above): set or validate it from the type on create/update.
- **Hex alpha trick:** `${color}1a` only works for 6-digit hex colors. Custom type colors should be validated as `#rrggbb`.
- **Note color:** `#fde047` is a light yellow and may be hard to read as a border or icon color in light mode.
- **Pro gating** is only a flag on the type today (`isProOnly`); `src/lib/plan.ts` / `ENFORCE_PLAN_LIMITS` from the overview don't exist yet.
