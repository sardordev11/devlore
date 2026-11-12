# AI Integration Plan: DevLore Pro AI Features

> Research output for `context/research/ai-integration-research.md` (2026-11-12).
> Covers auto-tagging, summaries, "Explain This Code" and the prompt optimizer, built on OpenAI `gpt-5-nano` in the Next.js 16 app.

---

## 0. Read this first

### 0.1 `gpt-5-nano` is deprecated

OpenAI's model page now marks `gpt-5-nano` as **Deprecated**. No shutdown date is listed yet. The recommended replacement for cheap, high-volume work is **GPT-5.6 Luna** (`gpt-5.6-luna`).

| | `gpt-5-nano` | `gpt-5.6-luna` |
| --- | --- | --- |
| Status | Deprecated, no shutdown date yet | Current |
| Input / cached input / output (per 1M tokens) | $0.05 / $0.005 / $0.40 | $0.20 / $0.02 / $1.20 |
| Context (max input) | 400K (272K) | 1.05M (922K) |
| Max output | 128K | 128K |
| Reasoning effort | `minimal`, `low`, `medium`, `high` (GPT-5 family) | `none`, `low`, `medium` (default), `high`, `xhigh`, `max` |
| Structured outputs, streaming, Responses API | Yes | Yes |

**Recommendation:** build on `gpt-5-nano` as the spec says, since it is about 4x cheaper on input and 3x on output, and these four features don't need a stronger model. Keep the model name in **one constant that an env var can override** (`OPENAI_MODEL`), so moving to Luna when nano is shut down is a config change. The only code that depends on the model is the reasoning-effort value (`minimal` on nano, `none` on Luna), so keep that next to the model constant too.

### 0.2 Decisions needed before implementation

1. ~~**Model:** stay on `gpt-5-nano` or start on `gpt-5.6-luna`.~~ **Decided (2026-11-12): stay on `gpt-5-nano`.** Switch to Luna (via `OPENAI_MODEL`, with `none` as the reasoning effort) when OpenAI announces a shutdown date.
2. **Daily AI caps:** already an open question in the project overview. This plan proposes per-user caps in section 5 (Pro: 100 calls per day, burst 10 per minute).
3. **Summaries are Pro:** the overview lists summaries under AI features but not in the pricing table. This plan treats all four features as Pro.
4. **Where summaries go:** shown and copyable only, or saved to `Item.description`. This plan saves into `description` on accept, so no migration is needed.

---

## 1. Current state

| Area | What exists | Relevant to AI |
| --- | --- | --- |
| OpenAI | `OPENAI_API_KEY=""` in `.env.example`; no `openai` package, no AI code | Everything is new |
| Server actions | `src/actions/*.ts`: `"use server"`, `auth()` session check, Zod `safeParse` on `unknown` input, `try/catch`, `{ success, data, error }`, `fieldErrors`, `upgrade: true` on plan-limit errors | AI actions follow the same shape |
| Plan gating | `src/lib/usage-limits.ts` (pure: `ENFORCE_PLAN_LIMITS`, `canUsePro`, `UPGRADE_MESSAGES`); `src/lib/plan-gate.ts` (server: `checkUploadAccess` etc. read the plan via `getUserPlan`, never `session.user.isPro`, and return `null` without a DB read while the flag is off) | Add `checkAiAccess` and an `ai` upgrade message |
| Client plan hints | `PlanAccessProvider` / `usePlanAccess()` (`isPro`, `proLocked`) from `loadPlanAccess()` in `AppShell`; `UpgradePrompt` and `toastUpgradeError` | Lock the AI buttons and show the upgrade toast |
| Rate limiting | `src/lib/rate-limit.ts`: Upstash sliding-window limiters by name, fails open without Upstash or after 2s, `rateLimitMessage(reset)` | Add `ai` limiters keyed by user id |
| Item UI | `ItemDrawerActions` (Favorite, Pin, Copy, Download, Edit, Delete), `ItemEditForm` and `CreateItemDialog` sharing `useItemFields` and `buildItemPayload`; comma-separated tags field; `MarkdownEditor` / `CodeEditor` (Monaco) | Where the AI buttons and suggestion panels go |
| Validation | `src/lib/validations/items.ts`: `itemIdSchema`, tag rules (trimmed, 1–50 chars, deduped) | Reuse for AI input and to clean AI tag output |
| External client pattern | `src/lib/toss.ts`: `server-only`, one module wraps the API, typed error class, timeout | Model for `src/lib/ai/client.ts` |
| Tests | Vitest for `src/actions/**` and `src/lib/**`, external boundaries mocked with `vi.mock` | Mock `@/lib/ai/client`; never call OpenAI in tests |

---

## 2. SDK setup and configuration

### 2.1 Package

```bash
npm install openai
```

- Latest is `openai@7.55.0` (published 2026-11-10). Its `zod` peer range is `^3.25 || ^4.0`, so it works with the project's `zod@^4.6.7`.
- Use the official SDK directly. The Vercel AI SDK adds a second abstraction (and its own hooks) for four small features. The project already wraps its other external APIs (Toss, R2) in one `src/lib` module, so the plain SDK keeps that pattern.

### 2.2 Environment

```bash
# .env.example
OPENAI_API_KEY=""
OPENAI_MODEL=""   # optional, defaults to gpt-5-nano
```

`OPENAI_API_KEY` must never get a `NEXT_PUBLIC_` prefix. Without the key, the AI features should fail cleanly ("AI features aren't configured") rather than throw at import time, the same way Upstash fails open.

### 2.3 Client module

```ts
// src/lib/ai/client.ts
import "server-only";

import OpenAI from "openai";

export const AI_MODEL = process.env.OPENAI_MODEL || "gpt-5-nano";

// gpt-5-nano accepts "minimal"; Luna and later use "none"
export const AI_REASONING_EFFORT = AI_MODEL.startsWith("gpt-5-") ? "minimal" : "none";

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  client ??= new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 30_000, // SDK default is 10 minutes, far too long for a drawer button
    maxRetries: 1,   // SDK retries 408/429/5xx with backoff; keep the wait short
  });
  return client;
}
```

- `server-only` makes the build fail if a client component imports it, which keeps the key off the client.
- Created lazily so tests and builds without the key still work.

### 2.4 Use the Responses API with structured outputs

Every feature returns a small, known shape, so use `responses.parse` with a Zod schema (`zodTextFormat`). The SDK sends a strict JSON schema and gives back a typed `output_parsed`, so there's no hand-written JSON parsing.

```ts
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

const TagSuggestions = z.object({ tags: z.array(z.string()) });

const response = await openai.responses.parse({
  model: AI_MODEL,
  reasoning: { effort: AI_REASONING_EFFORT },
  max_output_tokens: 300,
  instructions: TAG_INSTRUCTIONS,               // static, cacheable
  input: buildItemInput(item),                  // dynamic
  text: { format: zodTextFormat(TagSuggestions, "tag_suggestions") },
  safety_identifier: hashUserId(userId),
  store: false,
});
const result = response.output_parsed;          // { tags: string[] } | null
```

Notes:

- **`max_output_tokens` includes reasoning tokens.** If the limit is hit the response comes back with `status: "incomplete"` and `incomplete_details.reason: "max_output_tokens"`, sometimes with no visible text. Check for that and return an error. Low reasoning effort keeps this rare.
- Structured-output schemas are strict: every field required, no optional fields. Use `.nullable()` instead of `.optional()` in AI schemas.
- `store: false` so item content isn't kept as stored responses on OpenAI's side (DevLore doesn't use conversation state).
- `safety_identifier` is a stable per-user id. Send a hash (`hashToken(userId)` from `src/lib/tokens.ts`), never the email.

### 2.5 Suggested file layout

```
src/lib/ai/
  client.ts          getOpenAI, AI_MODEL, AI_REASONING_EFFORT (server-only)
  prompts.ts         instruction strings per feature (static)
  schemas.ts         Zod output schemas (TagSuggestions, Summary, Explanation, OptimizedPrompt)
  input.ts           buildItemInput, truncation, fencing of user content (pure, tested)
  run.ts             runStructured(): parse call, incomplete/refusal/error mapping to AiError
  features.ts        suggestTags, summarizeItem, explainCode, optimizePrompt
src/lib/validations/ai.ts   AI action input schemas, tag cleanup (pure, tested)
src/actions/ai.ts           server actions
src/components/ai/          AiButton, AiSuggestionPanel, TagSuggestions, …
src/hooks/use-ai-action.ts  pending/error/result state for one AI call
```

---

## 3. Feature design

All four run on the item the user is viewing or editing. Inputs are either an **item id** (the server loads the item scoped to the user, used from the drawer) or **unsaved form values** (title/content/language from `ItemEditForm` or `CreateItemDialog`, validated with Zod and length-capped). Supporting unsaved values matters most for tagging, since the useful time to suggest tags is while creating or editing.

| Feature | Applies to | Input | Output schema | Effort | `max_output_tokens` | Accept action |
| --- | --- | --- | --- | --- | --- | --- |
| Auto-tagging | All text and link types | title, description, content (or URL), type, language, the user's existing tag names (up to ~50) | `{ tags: string[] }` (3–6 tags) | minimal | 300 | Merge chosen tags into the tags field |
| Summary | notes, prompts, snippets, commands; files with text MIME types (txt, md, json, yaml, csv…) | title + content (or file text from R2, truncated) | `{ summary: string }` (1–3 sentences) | minimal | 400 | Put it into Description (editable before save) |
| Explain This Code | snippets, commands | content + language | `{ explanation: string }` (Markdown, short sections) | low | 1,200 | Display only, with Copy |
| Prompt optimizer | prompts | content | `{ optimized: string, changes: string[] }` | low | 1,500 | Replace content (editable before save), or copy |

Prompt notes:

- **Tags:** include the user's existing tag names so the model reuses them ("react" instead of creating "React.js"). Ask for lowercase, short tags. After parsing, clean the result with the same rules as the tag field (trim, lowercase, 1–50 chars, dedupe, drop tags already on the item), then cap at 6.
- **Summaries:** the File type already allows only text-like extensions (`src/lib/file-constraints.ts`), so `getFileStream` from `src/lib/r2.ts` can read the object. Read at most ~32 KB and skip images entirely.
- **Explain:** render with the existing `MarkdownEditor` in readonly Preview mode, so headings, lists and inline code look like the rest of the app.
- **Optimizer:** show original and optimized side by side (or stacked on mobile), plus the `changes` list so the user can see why.

---

## 4. Server action patterns

### 4.1 Server actions, not route handlers (for v1)

| | Server action | Route handler (`/api/ai/*`) |
| --- | --- | --- |
| Fits the codebase | Yes, all mutations are actions with `{ success, data, error }` | Used only for webhooks, uploads, downloads, cron |
| Auth and Zod | Same `auth()` + `safeParse` pattern | Same, plus manual `Response` handling |
| Streaming tokens | Not a natural fit | Yes (`ReadableStream`) |
| Unit tests | Covered by the Vitest include (`src/actions/**`) | Not covered today |

**Recommendation:** server actions for all four features in v1, returning complete results. Put the real logic in `src/lib/ai/features.ts` so a streaming route handler can reuse it later (see 4.3). This means the project overview's `/api/ai/*` route entry is not needed in v1. Update it if you agree.

### 4.2 Action shape

```ts
// src/actions/ai.ts
"use server";

type AiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; upgrade?: true; rateLimited?: true };

export async function suggestTags(input: unknown): Promise<AiResult<{ tags: string[] }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "You must be signed in" };
  const userId = session.user.id;

  const parsed = suggestTagsSchema.safeParse(input);           // itemId OR form values, length-capped
  if (!parsed.success) return { success: false, error: "Nothing to tag yet" };

  const upgradeMessage = await checkAiAccess(userId);          // plan first (no DB read with flag off)
  if (upgradeMessage) return { success: false, error: upgradeMessage, upgrade: true };

  const limit = await checkAiRateLimit(userId);                // burst + daily
  if (!limit.success) return { success: false, error: rateLimitMessage(limit.reset), rateLimited: true };

  try {
    const source = await resolveItemSource(userId, parsed.data); // loads by id with userId in the where
    if (!source) return { success: false, error: "Item not found" };
    const existingTags = await getUserTagNames(userId, 50);
    const tags = await suggestTagsForItem(userId, source, existingTags);
    return { success: true, data: { tags } };
  } catch (error) {
    return { success: false, error: toAiErrorMessage(error) };
  }
}
```

Rules carried over from the existing actions:

- Session check first. The user id comes only from the session, never from input.
- Input is `unknown` and goes through Zod. Item ids use `itemIdSchema`. Loads by id use `userId` in the `where`.
- `upgrade: true` reuses the client's existing `toastUpgradeError` path.
- **No `refresh()`.** AI actions only suggest. The database changes when the user accepts and saves through the existing `updateItem`/`createItem`, which already validate and refresh.

### 4.3 Streaming vs non-streaming

| Feature | Typical output | Streaming worth it? |
| --- | --- | --- |
| Tags | ~10–30 tokens of JSON | No. It's only usable once complete |
| Summary | 1–3 sentences | No |
| Optimizer | Structured `{ optimized, changes }` | No. The user compares the finished text |
| Explain | A few paragraphs | Maybe later |

With minimal or low reasoning effort and capped output, nano should answer these in a few seconds, so a good loading state is enough. If "Explain" feels slow in testing, add `POST /api/ai/explain` that calls `openai.responses.create({ …, stream: true })` and forwards `response.output_text.delta` events as a plain-text `ReadableStream` (switch to a text format instead of a JSON schema for that call). The route handler needs the same auth, Zod, plan and rate-limit checks as the action, and the client reads it with `fetch` + `getReader()` and an `AbortController` (the drawer provider already aborts stale fetches this way).

---

## 5. Error handling and rate limiting

### 5.1 Map OpenAI errors to friendly messages

Use the SDK's typed errors in one helper (`toAiErrorMessage`), and log the details server side with `console.error` as the other actions do:

| Error | User message |
| --- | --- |
| No API key (`getOpenAI()` is null) | "AI features aren't available right now." |
| `OpenAI.RateLimitError` (429, OpenAI side) | "AI is busy right now. Please try again in a minute." |
| `OpenAI.APIConnectionError` / timeout | "Couldn't reach the AI service. Please try again." |
| `OpenAI.APIError` 400 (e.g. context too long) | "This item is too long for AI." (shouldn't happen after truncation) |
| `OpenAI.APIError` 401/403 | Generic message; log loudly since it's a config problem |
| `status: "incomplete"` / `output_parsed` null / refusal | "The AI couldn't produce a result for this item." |
| Anything else | "Something went wrong. Please try again." |

Never pass OpenAI's raw error text to the client. It can include request details.

### 5.2 Per-user rate limits

Add limiters to `src/lib/rate-limit.ts`, keyed by **user id** (all AI actions require a session):

```ts
aiBurst: createLimiter("ai-burst", 10, "1 m"),
aiDaily: createLimiter("ai-daily", 100, "1 d"),
```

- Check burst first, then daily. Both fail open when Upstash isn't configured, which matches the rest of the app. Because AI calls cost money, consider failing closed for AI only in production. That's a choice to make, not a requirement.
- Apply limits even while `ENFORCE_PLAN_LIMITS` is off. Otherwise anyone signing up during development has unlimited paid calls.
- At $0.05 / $0.40 per 1M tokens, 100 calls a day at ~3K input + ~1K output tokens costs about $0.055 per user per day at most, so the daily cap is about protecting against abuse, not normal use.

### 5.3 Spend controls outside the code

- Set a **monthly budget and alert** on the OpenAI project, and use a key scoped to a dedicated project for DevLore.
- Optionally log `response.usage` (input, cached, output and reasoning tokens) per call with `console.info` to watch costs before deciding on a usage table. Don't add a usage-tracking table to the schema until there's a measured need.

---

## 6. Pro gating

Follow the existing split exactly:

```ts
// src/lib/usage-limits.ts (pure)
export const UPGRADE_MESSAGES = {
  …,
  ai: "AI features are part of Pro. Upgrade to Pro to use them.",
} as const;

// src/lib/plan-gate.ts (server)
export async function checkAiAccess(userId: string): Promise<string | null> {
  if (!ENFORCE_PLAN_LIMITS) return null;
  const plan = await loadPlan(userId);
  return canUsePro(plan) ? null : UPGRADE_MESSAGES.ai;
}
```

- **Server side is the real check:** every AI action and any future AI route calls `checkAiAccess` before calling OpenAI. It reads the plan from the database via `getUserPlan`, not `session.user.isPro`.
- **Client side is only a hint:** `usePlanAccess().proLocked` shows the AI buttons with a small "PRO" badge and a lock. Clicking a locked button shows `toastUpgradeError(UPGRADE_MESSAGES.ai)` without calling the server, the same as File/Image in `TypeSelector`.
- While `ENFORCE_PLAN_LIMITS` is off, everyone can use AI (per the project overview), but rate limits still apply (5.2).

---

## 7. Cost optimization

1. **Short reasoning:** `minimal` (nano) for tags and summaries, `low` for explain and optimize. Reasoning tokens are billed as output tokens, so effort is the main cost control.
2. **Cap output:** `max_output_tokens` per feature (section 3) and short prompts ("1–3 sentences", "3–6 tags").
3. **Cap input:** truncate content before sending (for example 12K characters for tags/summary, 24K for explain/optimize, 32 KB for file text) and say in the prompt when it was truncated. Validate lengths with Zod on unsaved form input.
4. **Static prefix first for prompt caching:** keep each feature's instructions identical and in `instructions`, with item content in `input`. Cached input is 10x cheaper ($0.005 vs $0.05 per 1M). Caching only applies to prefixes of at least ~1,024 tokens, so with short instructions it may not kick in. It costs nothing to set up the order correctly. Use a per-feature `prompt_cache_key` (e.g. `devlore-tags`); never include user data in the key.
5. **No calls on their own:** AI runs only when the user clicks. No auto-tagging on save and no background summaries.
6. **Don't re-ask for the same input:** the client keeps the last result per item/feature while the drawer is open. Server-side caching (a hash of the input in Redis) can wait until usage shows repeats.
7. **Batch API** (50% cheaper) only fits bulk jobs such as "tag all my items", which aren't in the spec.

---

## 8. UI patterns

### 8.1 Where the buttons go

| Place | Buttons |
| --- | --- |
| Item drawer action bar (`ItemDrawerActions`) | "Explain" (snippets/commands), "Summarize" (text types, text files), "Optimize" (prompts); group them under one **Sparkles "AI" dropdown** so the bar doesn't wrap more on mobile |
| `ItemEditForm` and `CreateItemDialog` | "Suggest tags" next to the Tags label; "Summarize" next to Description; "Optimize" in the prompt content header (`EditorFrame` `headerActions` slot) |

Use the Lucide `Sparkles` icon in the type-neutral accent blue, matching the Upgrade button.

### 8.2 Loading states

- Disable the button and show a spinner with a verb ("Suggesting…", "Summarizing…", "Explaining…", "Optimizing…"), like "Deleting…" and "Uploading…" elsewhere.
- For results that open a panel (Explain, Optimize, Summary), show a skeleton of the panel right away so the layout doesn't jump.
- Ignore extra clicks while pending (same as `useFavoriteToggle`). Drop a result if the drawer moved to another item or closed meanwhile (keep the item id with the request).

### 8.3 Accept/reject suggestions

Nothing AI-generated is saved without the user accepting it, and accepting only fills the form. The existing Save or Create still does the write.

| Feature | Suggestion UI | Accept | Reject |
| --- | --- | --- | --- |
| Tags | Chips under the Tags field, each with a "+" (dashed border, sparkles icon) | Click a chip to add it to the comma-separated field; "Add all" | "Dismiss", or just ignore |
| Summary | Inline card under Description showing the text | "Use as description" fills the field (still editable) | "Dismiss" |
| Optimizer | Panel with Original / Optimized and the list of changes | "Replace content" fills the editor (still editable); "Copy" | "Keep original" |
| Explain | Readonly Markdown panel in the drawer, below Content | Copy only | Close |

From the drawer (not in edit mode), "Summarize" and "Optimize" open the same panels, and accepting switches the drawer into edit mode with the value filled in. That way the save still goes through `updateItem`.

Toasts: errors via `toast.error`, plan limits via `toastUpgradeError`, no success toast for suggestions (the panel appearing is the feedback). Label AI text with a small "AI generated, check before saving" note.

### 8.4 Hook

```ts
// src/hooks/use-ai-action.ts
// Runs one AI server action: { run, result, error, isPending, reset }.
// Handles upgrade (toastUpgradeError) and plain errors (toast.error) in one place.
```

---

## 9. Security

| Risk | Mitigation |
| --- | --- |
| API key exposure | Only in `OPENAI_API_KEY` (no `NEXT_PUBLIC_`), read only in `src/lib/ai/client.ts` behind `server-only`. Never log it or send it to the client. Use a key from a dedicated OpenAI project with a budget. |
| Using AI on someone else's item | Load items by id with `userId` in the `where` (as `getItemDetail` does). The user id comes only from the session. File text only from keys that pass `isOwnedFileKey`. |
| Unbounded or malformed input | Zod on every action input: `itemIdSchema`, strings length-capped, `type`/`language` restricted to known values. Truncate content again before building the prompt. |
| Prompt injection from item content | Item content is untrusted data, not instructions. Put it only in `input`, never in `instructions`; wrap it in clear delimiters (`<item_content>…</item_content>`) and tell the model to treat it as data. Structured outputs limit what the model can return, and **the model has no tools**, so injected text can at worst produce odd suggestions, which the user must still accept. |
| Rendering AI output | Treat it like user content. Explanations go through `react-markdown` (no raw HTML, `rehype-raw` not enabled; links open in a new tab as today). Tags go through the normal tag validation. Never use `dangerouslySetInnerHTML`. |
| Cost abuse | Session required, Pro check, burst + daily per-user limits, output and input caps, budget alerts (sections 5–7). |
| Privacy | `store: false`; `safety_identifier` is a hash of the user id, never the email; mention AI processing by OpenAI in the privacy wording before launch. Don't send other users' data, and send only the fields a feature needs. |
| Leaking provider errors | Map errors to fixed messages (5.1); log details server side only. |

---

## 10. Testing

Following `context/ai-interaction.md` (Vitest, server actions and `src/lib` only, mock external boundaries):

- `src/lib/ai/input.test.ts`: truncation, delimiters, which fields each feature sends.
- `src/lib/validations/ai.test.ts`: input schemas and tag cleanup (case, length, dedupe, already-present tags).
- `src/lib/ai/run.test.ts`: with a mocked `getOpenAI`, maps `incomplete`, null `output_parsed`, `RateLimitError`, `APIConnectionError` and `APIError` to the right messages.
- `src/lib/plan-gate.test.ts`: `checkAiAccess` with the flag on and off (re-import per case, as the existing limit tests do).
- `src/actions/ai.test.ts`: signed out, invalid input, upgrade, rate limited, other user's item → "Item not found", success; `@/auth`, `@/lib/prisma`, `@/lib/rate-limit` and `@/lib/ai/client` mocked. No real OpenAI calls.

---

## 11. Suggested phases

1. **Foundation:** `openai` package, `src/lib/ai/client.ts` + `run.ts`, `checkAiAccess`, `ai` upgrade message, AI rate limiters, `OPENAI_MODEL` in `.env.example`, tests.
2. **Auto-tagging:** `suggestTags` action and tag chips in `ItemEditForm` and `CreateItemDialog`.
3. **Explain This Code** in the drawer (and decide whether it needs streaming after trying it).
4. **Prompt optimizer** with the compare panel.
5. **Summaries**, including text files from R2.

---

## Sources

- OpenAI model page, GPT-5 nano (status, pricing, limits): https://developers.openai.com/api/docs/models/gpt-5-nano
- OpenAI model page, GPT-5.6 Luna: https://developers.openai.com/api/docs/models/gpt-5.6-luna
- OpenAI model page, GPT-5 (reasoning effort levels): https://developers.openai.com/api/docs/models/gpt-5
- Structured outputs (`responses.parse`, `zodTextFormat`): https://developers.openai.com/api/docs/guides/structured-outputs
- Reasoning (`max_output_tokens`, incomplete responses): https://developers.openai.com/api/docs/guides/reasoning
- Streaming responses: https://developers.openai.com/api/docs/guides/streaming-responses
- Error codes and SDK error classes: https://developers.openai.com/api/docs/guides/error-codes
- Rate limits and retries: https://developers.openai.com/api/docs/guides/rate-limits
- Prompt caching: https://developers.openai.com/api/docs/guides/prompt-caching
- Safety identifiers: https://developers.openai.com/api/docs/guides/safety-checks
- `openai` on npm (version 7.55.0, zod peer range): `npm view openai`
- Codebase: `src/actions/items.ts`, `src/actions/collections.ts`, `src/lib/usage-limits.ts`, `src/lib/plan-gate.ts`, `src/lib/rate-limit.ts`, `src/components/billing/load-plan-access.ts`, `src/components/billing/UpgradePrompt.tsx`, `src/components/items/ItemDrawerActions.tsx`, `src/lib/validations/items.ts`, `src/lib/r2.ts`, `src/lib/toss.ts`
