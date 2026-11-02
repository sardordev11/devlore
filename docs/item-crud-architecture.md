# Item CRUD Architecture

A proposed design for creating, reading, updating and deleting items of all 7 system types (and future custom types) using one action file, one query module, one dynamic route and shared components that adapt to the type.

**Sources:** `context/project-overview.md`, `context/coding-standards.md`, `docs/item-types.md`, `prisma/schema.prisma`, `src/lib/type-icons.ts`, and the existing code in `src/actions/`, `src/lib/db/`, `src/app/dashboard/`, `src/components/dashboard/` and `src/proxy.ts`.

> The prompt lists `docs/content-types.md` and `src/lib/constants.tsx`. Neither exists. The type research is in `docs/item-types.md`, and the icon map is in `src/lib/type-icons.ts`.

---

## Design principles

1. **Types are data, not code.** Name, slug, icon, color, content type and the Pro flag come from the `ItemType` row. Nothing hard-codes the list of 7 types, so custom types will work without new routes or actions.
2. **Actions are type-agnostic.** Mutations only know about the 3 content types (`TEXT`, `FILE`, `URL`), which decide which columns are valid. They never branch on `snippet` vs `note`.
3. **Type-specific behavior lives in components.** How a snippet or a note is edited and shown (code editor vs Markdown, image preview vs download) is decided in the UI, by content type first and type name second.
4. **Everything is scoped to the signed-in user.** Queries and actions take the user ID from `auth()`, not from `demoUserFilter()`. The dashboard still uses the demo user; new item code should not.

---

## File structure

```
src/
├── actions/
│   └── items.ts                  # "use server": createItem, updateItem, deleteItem (+ toggles)
├── lib/
│   ├── db/
│   │   └── items.ts              # existing file, extended with item list/detail/type queries
│   └── validations/
│       └── items.ts              # Zod schemas: shared fields + per-content-type payload
├── app/
│   └── items/
│       ├── layout.tsx            # <AppShell>, like dashboard/ and profile/
│       └── [type]/
│           ├── page.tsx          # list of items of one type + drawer for ?item=<id>
│           └── loading.tsx       # list skeleton
└── components/
    └── items/
        ├── ItemList.tsx          # server: grid/list of ItemCards, empty state
        ├── ItemListHeader.tsx    # server: type icon, title, count, "New <type>" button
        ├── ItemDrawer.tsx        # client: Sheet shell, view/edit/create modes, URL sync
        ├── ItemDetail.tsx        # server-safe: read-only view, picks a content view
        ├── ItemForm.tsx          # client: shared fields + the right content field
        ├── ItemDeleteButton.tsx  # client: AlertDialog + deleteItem
        ├── NewItemButton.tsx     # client: opens the drawer in create mode
        ├── fields/
        │   ├── TextContentField.tsx   # textarea/editor + language select
        │   ├── UrlField.tsx
        │   └── FileField.tsx          # upload via /api/upload (later)
        └── views/
            ├── CodeView.tsx           # snippet, command
            ├── MarkdownView.tsx       # note, prompt
            ├── LinkView.tsx           # link
            ├── FileView.tsx           # file
            └── ImageView.tsx          # image
```

Also touched:

- `src/proxy.ts`: add `"/items/:path*"` to the matcher so the route is protected.
- `src/components/dashboard/ItemCard.tsx`: reused as-is for lists; it only needs to become a link to `?item=<id>` (see [Drawer](#the-item-drawer)).
- `src/components/dashboard/TopBar.tsx`: its "New Item" button becomes `NewItemButton`.

This follows the existing conventions: server actions in `src/actions/[feature].ts`, Prisma queries in `src/lib/db/[feature].ts` marked `server-only`, Zod schemas in `src/lib/validations/[feature].ts`, components in `src/components/[feature]/`.

---

## Routing: `/items/[type]`

`[type]` is the **plural slug** stored on `ItemType.slug` (`snippets`, `prompts`, `commands`, `notes`, `files`, `images`, `links`). The sidebar already links to `/items/${type.slug}`.

```tsx
// src/app/items/[type]/page.tsx (sketch)
export default async function ItemsByTypePage({
  params,
  searchParams,
}: PageProps<"/items/[type]">) {
  const session = await auth();
  const userId = session!.user.id; // proxy guarantees a session
  const { type: slug } = await params;
  const { item: itemId } = await searchParams;

  const type = await getItemTypeBySlug(userId, slug);
  if (!type) notFound();

  const [items, selected] = await Promise.all([
    getItemsByType(userId, type.id),
    typeof itemId === "string" ? getItemById(userId, itemId) : null,
  ]);

  return (
    <>
      <ItemListHeader type={type} count={items.length} />
      <ItemList items={items} />
      <ItemDrawer type={type} item={selected} />
    </>
  );
}
```

How it works:

1. **Resolve the slug to a type.** `getItemTypeBySlug(userId, slug)` finds a system type (`userId: null`) or one of the user's own custom types. An unknown slug, or another user's custom type, returns `notFound()`.
2. **Fetch per request.** The app runs with `cacheComponents: true`. Awaiting `params`, `searchParams` and `auth()` makes the page dynamic, as `connection()` does on the dashboard.
3. **Drawer state in the URL.** `?item=<id>` opens that item in the drawer, which keeps drawers shareable and back-button friendly (per the overview). The page fetches the item on the server, so the drawer gets its data without a client fetch.
4. **Pro types.** `files` and `images` still render. When `ENFORCE_PLAN_LIMITS` is on and the user isn't Pro, the page shows an upgrade prompt instead of the "New" button. Checks use `canUsePro()` from `src/lib/plan.ts` (described in the overview, not built yet).
5. **No static params.** Types can be user-defined, so there is no `generateStaticParams`.

A dedicated `/items/[type]/[id]` page is not needed. If one is wanted later, it can render `ItemDetail` full-page with the same queries.

---

## Data fetching: `src/lib/db/items.ts`

Extend the existing module (keep `getPinnedItems`, `getRecentItems`, etc. as they are). Every new function takes `userId` as its first argument, like `getProfile(userId)`, and filters on it so one user can never read another's items.

| Function                               | Returns                    | Used by                                     |
| -------------------------------------- | -------------------------- | ------------------------------------------- |
| `getItemTypeBySlug(userId, slug)`      | `ItemTypeInfo \| null`     | `/items/[type]` page                        |
| `getItemTypes(userId)`                 | `ItemTypeInfo[]`           | Type picker in the create form              |
| `getItemsByType(userId, typeId)`       | `ItemSummary[]`            | `/items/[type]` list                        |
| `getItemById(userId, id)`              | `ItemDetail \| null`       | Drawer (`?item=<id>`) on any page           |

Types (in the same file, like `ItemSummary` today):

```ts
export interface ItemTypeInfo {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  contentType: ContentType;
  isProOnly: boolean;
}

export interface ItemDetail extends ItemSummary {
  contentType: ContentType;
  content: string | null;
  language: string | null;
  url: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  type: ItemTypeInfo;            // full type, so the drawer can pick a view
  collections: { id: string; name: string }[];
  updatedAt: Date;
}
```

Notes:

- **List queries stay light.** `getItemsByType` reuses `ITEM_SUMMARY_SELECT` and `RECENT_ORDER` (pinned first could be added with `{ isPinned: "desc" }`). It never selects `content`, which can be large.
- **Detail queries are complete.** `getItemById` selects every payload field plus tags and collection names ("See which collections an item belongs to").
- **Type access rule** (used by both queries and actions): `where: { OR: [{ userId: null }, { userId }] }`.
- **Pagination** can come later with `take` + cursor on `id`; the `(userId, typeId)` index already covers the filter.

---

## Mutations: `src/actions/items.ts`

One `"use server"` file. Every action follows the pattern already used in `src/actions/profile.ts`:

1. `auth()` → `{ success: false, error: "You must be signed in" }` if no user.
2. Zod `safeParse` of `unknown` input → friendly error on failure.
3. `try/catch` around Prisma, `console.error` on failure, friendly error back.
4. Return `ActionResult<T> = { success: boolean; data?: T; error?: string }`.
5. `revalidatePath` so the list, dashboard and sidebar counts refresh.

| Action                              | What it does                                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `createItem(input)`                 | Validates, loads the type (system or own), checks Pro and item limits, creates the item with tags.     |
| `updateItem(id, input)`             | Validates, checks ownership, updates fields and replaces tags.                                         |
| `deleteItem(id)`                    | Checks ownership and deletes. `ItemCollection` rows cascade. (R2 cleanup for files comes with uploads.) |
| `toggleItemFavorite(id)` / `toggleItemPinned(id)` | Small ownership-checked updates for card and drawer buttons.                             |

### What the actions own (and what they don't)

The actions handle rules that must hold no matter which UI calls them:

- **Ownership.** Updates and deletes use `where: { id, userId }` (`updateMany`/`deleteMany`, or a `findFirst` check first) so a guessed ID can't touch another user's item.
- **Type access.** `typeId` must be a system type or one of the user's own types.
- **`contentType` comes from the type.** The action sets `Item.contentType = type.contentType` and ignores any value sent by the client. This fixes the drift noted in `docs/item-types.md`.
- **Payload by content type.** Only the fields for that content type are written; the others are set to `null`:

  | `contentType` | Written                                         | Required        |
  | ------------- | ----------------------------------------------- | --------------- |
  | `TEXT`        | `content`, `language`                           | `content`       |
  | `URL`         | `url`                                           | `url` (http/https) |
  | `FILE`        | `fileUrl`, `fileName`, `fileSize`, `mimeType`   | all four, from a confirmed upload |

- **Plan limits.** `isProOnly` types and the 50-item free limit go through `canUsePro()` / `FREE_LIMITS`, a no-op while `ENFORCE_PLAN_LIMITS` is off.
- **Tags.** Tag names are trimmed, lowercased and de-duplicated, then connected with `connectOrCreate` on the `userId_name` unique key. Updates use `set: []` and reconnect.

The actions do **not** know about type names. There is no `if (type.name === "snippet")` anywhere in `src/actions/items.ts`.

### Validation: `src/lib/validations/items.ts`

```ts
const baseItemSchema = z.object({
  typeId: z.cuid(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(500).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
});

export const textPayloadSchema = z.object({
  content: z.string().min(1).max(100_000),
  language: z.string().max(40).optional(),
});
export const urlPayloadSchema = z.object({ url: z.url({ protocol: /^https?$/ }) });
export const filePayloadSchema = z.object({
  fileUrl: z.url(),
  fileName: z.string().min(1),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1),
});

export const itemInputSchema = baseItemSchema.extend({
  text: textPayloadSchema.optional(),
  link: urlPayloadSchema.optional(),
  file: filePayloadSchema.optional(),
});
```

The action parses `itemInputSchema`, loads the type, then requires the matching payload (`text` for `TEXT`, and so on). This two-step check is needed because the content type is only known after the type is loaded from the database. The same schemas are imported by `ItemForm` for client-side validation, as the auth forms do with `src/lib/validations/auth.ts`.

### Revalidation

After each mutation call `revalidatePath("/", "layout")`. Item changes affect the type list, dashboard stats, pinned/recent lists and sidebar counts, all of which render per request, so revalidating the whole signed-in tree is simplest and correct. It can be narrowed later if it becomes a measured cost.

---

## Where type-specific logic lives

All of it is in `src/components/items/`, in two lookup tables rather than scattered conditionals.

**1. Form fields, by content type** (in `ItemForm.tsx`):

```ts
const CONTENT_FIELDS: Record<ContentType, ComponentType<ContentFieldProps>> = {
  TEXT: TextContentField,
  URL: UrlField,
  FILE: FileField,
};
```

**2. Read-only views, by type name with a content-type fallback** (in `ItemDetail.tsx`):

```ts
const TYPE_VIEWS: Partial<Record<string, ComponentType<ItemViewProps>>> = {
  snippet: CodeView,
  command: CodeView,
  prompt: MarkdownView,
  note: MarkdownView,
  image: ImageView,
};

const CONTENT_VIEWS: Record<ContentType, ComponentType<ItemViewProps>> = {
  TEXT: MarkdownView,
  URL: LinkView,
  FILE: FileView,
};

const View = TYPE_VIEWS[item.type.name] ?? CONTENT_VIEWS[item.contentType];
```

The fallback means a future custom type ("SQL query", "Config") gets a sensible view from its content type with no code change.

Smaller per-type tweaks also live in components, driven by the same tables or by props:

| Concern                    | Where                    | Example                                                    |
| -------------------------- | ------------------------ | ---------------------------------------------------------- |
| Language select shown      | `TextContentField`       | Shown for snippet/command, hidden for note/prompt          |
| Default language           | `TextContentField`       | `bash` for command                                         |
| Copy button                | `CodeView`, `MarkdownView` | Copy content; command copies the one-liner              |
| Open in new tab            | `LinkView`               | `target="_blank" rel="noopener noreferrer"`                |
| Preview vs download        | `ImageView` / `FileView` | Decided by `mimeType` (`image/*` → preview)                |
| Colors and icons           | Every component          | `type.color`, `getTypeIcon(type.icon)`, as `ItemCard` does |

Syntax highlighting and Markdown rendering need libraries that aren't installed yet (for example `shiki` and `react-markdown`). Pick these when building the views; the architecture doesn't depend on the choice.

---

## Component responsibilities

| Component           | Kind   | Responsibility                                                                                                                      |
| ------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `items/[type]/page` | Server | Resolve slug → type, fetch list and selected item, render header, list and drawer. `notFound()` for unknown slugs.                  |
| `ItemListHeader`    | Server | Type icon and color, plural title (from the slug), item count, `NewItemButton` preset to this type.                                 |
| `ItemList`          | Server | Render `ItemCard`s linking to `?item=<id>`; empty state ("No snippets yet") with a create button.                                   |
| `ItemCard`          | Server | Existing card. Unchanged apart from becoming a link.                                                                                |
| `ItemDrawer`        | Client | shadcn `Sheet` on the right. Open when `item` is set or create mode is on. Switches between view, edit and create. Closing removes `?item` with `router.replace`. |
| `ItemDetail`        | Either | Header (icon, title, type badge, favorite/pin toggles), description, the chosen view, tags, collections, dates.                    |
| `ItemForm`          | Client | Title, description, tags, plus `CONTENT_FIELDS[type.contentType]`. Zod validation, calls `createItem`/`updateItem`, Sonner toast, then closes or returns to view mode. |
| `fields/*`          | Client | One input per content type. Controlled by `ItemForm`; no direct action calls.                                                        |
| `views/*`           | Either | One read-only renderer per display style. No data fetching, no actions.                                                              |
| `ItemDeleteButton`  | Client | `AlertDialog` confirmation, calls `deleteItem`, toast, closes the drawer.                                                           |
| `NewItemButton`     | Client | Opens the drawer in create mode. With a preset type it skips the type picker; from the top bar it shows the picker (`getItemTypes`). |

### The item drawer

- **View and edit** go through the URL: any page that renders items (`/items/[type]`, `/dashboard`) reads `?item=<id>`, calls `getItemById`, and passes the result to `ItemDrawer`. Pages that don't handle `?item` simply never open the drawer.
- **Create** is client state, since there's nothing to share yet. The top bar lives in the shared `AppShell` (a layout, which can't read `searchParams`), so its `NewItemButton` uses a small client context provider in `AppShell` to open one shared create drawer. Type buttons on `/items/[type]` pass their type so the picker is skipped.
- **After a mutation**, `revalidatePath` refreshes the server-rendered list behind the drawer, so no client cache needs updating.
- **"Recently used"**: opening an item could call a `markItemUsed(id)` action that sets `lastUsedAt`. This is optional and can be added with the drawer.

---

## Request flows

**Open an item**

1. User clicks an `ItemCard` → URL becomes `/items/snippets?item=abc`.
2. The page re-renders on the server, `getItemById(userId, "abc")` runs, and `ItemDrawer` opens with the data.
3. `ItemDetail` picks `CodeView` because the type is `snippet`.

**Create an item**

1. User clicks "New snippet" → drawer opens in create mode with the snippet type.
2. `ItemForm` renders `TextContentField` (`contentType: TEXT`) and validates on submit.
3. `createItem` checks auth, type access, payload and limits, writes the item and tags, and calls `revalidatePath`.
4. The form shows a success toast and opens the new item (`?item=<newId>`).

**Delete an item**

1. `ItemDeleteButton` confirms, calls `deleteItem(id)`.
2. The action deletes with `{ id, userId }` and revalidates.
3. The drawer closes (`?item` removed); the list no longer shows the item.

---

## Out of scope / follow-ups

- **File uploads.** `FileField` needs `/api/upload` (presigned R2 URLs, see the overview's upload flow). Until then, the file and image types can show a "coming soon" state in the form.
- **Plan helpers.** `src/lib/plan.ts` (`ENFORCE_PLAN_LIMITS`, `FREE_LIMITS`, `canUsePro`) doesn't exist yet; create it with the first action that needs it.
- **Collections in the form.** Adding an item to collections from the drawer is a separate feature but fits into `ItemForm` and the `create`/`update` payload as `collectionIds`.
- **Dashboard user scoping.** The dashboard queries still use `demoUserFilter()`. Moving them to the session user is a separate change, but new item queries should use `userId` from the start.
- **Search, export and AI features** reuse `getItemById` and the views but aren't part of CRUD.
