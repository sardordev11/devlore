"use server";

import OpenAI from "openai";

import { getSessionUserId, ITEM_NOT_FOUND, SIGNED_OUT_ERROR } from "@/lib/action-helpers";
import { AI_MODEL, getOpenAI } from "@/lib/ai/client";
import {
  buildDescriptionInput,
  DESCRIPTION_INSTRUCTIONS,
  generateDescriptionSchema,
  parseDescriptionResponse,
} from "@/lib/ai/description";
import {
  buildExplainInput,
  canExplainType,
  EXPLAIN_INSTRUCTIONS,
  explainCodeSchema,
  parseExplainResponse,
} from "@/lib/ai/explain";
import {
  AI_OPTIMIZE_CONTENT_MAX,
  buildOptimizeInput,
  canOptimizeType,
  OPTIMIZE_INSTRUCTIONS,
  optimizePromptSchema,
  parseOptimizeResponse,
} from "@/lib/ai/optimize";
import {
  buildTagInput,
  generateAutoTagsSchema,
  parseTagResponse,
  TAG_INSTRUCTIONS,
} from "@/lib/ai/tags";
import { getItemDetail } from "@/lib/db/items";
import { checkAiAccess } from "@/lib/plan-gate";
import { checkRateLimit, rateLimitMessage } from "@/lib/rate-limit";
import type { ActionFailure } from "@/types/actions";

export type AiResult<T> =
  | { success: true; data: T }
  // upgrade: Pro-only, so the client offers the upgrade link
  | (ActionFailure & { upgrade?: true });

const AI_ERRORS = {
  unavailable: "AI features aren't available right now.",
  busy: "AI is busy right now. Please try again in a minute.",
  connection: "Couldn't reach the AI service. Please try again.",
  noTags: "Couldn't suggest tags for this item. Try adding more content.",
  generic: "Couldn't suggest tags. Please try again.",
  noDescription: "Couldn't write a description for this item. Try adding more content.",
  genericDescription: "Couldn't generate a description. Please try again.",
  notExplainable: "Only snippets and commands can be explained.",
  noExplanation: "Couldn't explain this item. Please try again.",
  genericExplanation: "Couldn't explain this code. Please try again.",
  notOptimizable: "Only prompts can be optimized.",
  promptTooLong: "This prompt is too long to optimize.",
  noOptimization: "Couldn't optimize this prompt. Please try again.",
} as const;

// 429s that won't clear by waiting (account out of credit or quota)
const BILLING_ERROR_CODES = new Set(["insufficient_quota", "credit_balance_exhausted"]);

// Never pass OpenAI's own error text to the client
function toAiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof OpenAI.RateLimitError) {
    return BILLING_ERROR_CODES.has(error.code ?? "") ? AI_ERRORS.unavailable : AI_ERRORS.busy;
  }
  if (error instanceof OpenAI.APIConnectionError) return AI_ERRORS.connection;
  return fallback;
}

type AiFailure = Extract<AiResult<never>, { success: false }>;

// Pro gate, rate limit and client, shared by every AI action
async function getAiClient(userId: string): Promise<{ openai: OpenAI } | AiFailure> {
  const upgradeMessage = await checkAiAccess(userId);
  if (upgradeMessage) return { success: false, error: upgradeMessage, upgrade: true };

  const limit = await checkRateLimit("ai", userId);
  if (!limit.success) return { success: false, error: rateLimitMessage(limit.reset) };

  const openai = getOpenAI();
  if (!openai) return { success: false, error: AI_ERRORS.unavailable };
  return { openai };
}

// Suggests tags from unsaved form values. Nothing is saved: accepted tags go
// through the normal createItem/updateItem save.
export async function generateAutoTags(
  input: unknown,
): Promise<AiResult<{ tags: string[] }>> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: SIGNED_OUT_ERROR };

  const parsed = generateAutoTagsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid item" };
  }

  try {
    const client = await getAiClient(userId);
    if (!("openai" in client)) return client;
    const { openai } = client;

    // Responses API: gpt-5-nano returns empty content from Chat Completions
    const response = await openai.responses.create({
      model: AI_MODEL,
      instructions: TAG_INSTRUCTIONS,
      input: buildTagInput(parsed.data),
      text: { format: { type: "json_object" } },
      store: false,
    });

    const tags = parseTagResponse(response.output_text);
    if (tags.length === 0) return { success: false, error: AI_ERRORS.noTags };
    return { success: true, data: { tags } };
  } catch (error) {
    console.error("AI tag suggestion failed:", error);
    return { success: false, error: toAiErrorMessage(error, AI_ERRORS.generic) };
  }
}

// Writes a 1-2 sentence description from unsaved form values. Nothing is
// saved: the text goes into the Description field for the normal save.
export async function generateDescription(
  input: unknown,
): Promise<AiResult<{ description: string }>> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: SIGNED_OUT_ERROR };

  const parsed = generateDescriptionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid item" };
  }

  try {
    const client = await getAiClient(userId);
    if (!("openai" in client)) return client;

    const response = await client.openai.responses.create({
      model: AI_MODEL,
      instructions: DESCRIPTION_INSTRUCTIONS,
      input: buildDescriptionInput(parsed.data),
      store: false,
    });

    const description = parseDescriptionResponse(response.output_text);
    if (!description) return { success: false, error: AI_ERRORS.noDescription };
    return { success: true, data: { description } };
  } catch (error) {
    console.error("AI description failed:", error);
    return { success: false, error: toAiErrorMessage(error, AI_ERRORS.genericDescription) };
  }
}

// Explains a saved snippet or command for the drawer. The item is loaded on the
// server, scoped to the user. Nothing is saved: each click asks again.
export async function explainCode(
  input: unknown,
): Promise<AiResult<{ explanation: string }>> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: SIGNED_OUT_ERROR };

  const parsed = explainCodeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid item" };
  }

  try {
    const item = await getItemDetail(userId, parsed.data.itemId);
    if (!item) return { success: false, error: ITEM_NOT_FOUND };
    if (!canExplainType(item.type.slug) || !item.content?.trim()) {
      return { success: false, error: AI_ERRORS.notExplainable };
    }

    const client = await getAiClient(userId);
    if (!("openai" in client)) return client;

    const response = await client.openai.responses.create({
      model: AI_MODEL,
      instructions: EXPLAIN_INSTRUCTIONS,
      input: buildExplainInput({
        title: item.title,
        typeSlug: item.type.slug,
        content: item.content,
        language: item.language || parsed.data.language,
      }),
      store: false,
    });

    const explanation = parseExplainResponse(response.output_text);
    if (!explanation) return { success: false, error: AI_ERRORS.noExplanation };
    return { success: true, data: { explanation } };
  } catch (error) {
    console.error("AI code explanation failed:", error);
    return { success: false, error: toAiErrorMessage(error, AI_ERRORS.genericExplanation) };
  }
}

// Reviews a saved prompt for the drawer and returns a refined version, or
// optimized: null when it's already good. Nothing is saved: accepting opens
// the edit form with the new text, which goes through the normal updateItem save.
export async function optimizePrompt(
  input: unknown,
): Promise<AiResult<{ optimized: string | null; changes: string[] }>> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: SIGNED_OUT_ERROR };

  const parsed = optimizePromptSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid item" };
  }

  try {
    const item = await getItemDetail(userId, parsed.data.itemId);
    if (!item) return { success: false, error: ITEM_NOT_FOUND };
    const content = item.content?.trim() ?? "";
    if (!canOptimizeType(item.type.slug) || !content) {
      return { success: false, error: AI_ERRORS.notOptimizable };
    }
    if (content.length > AI_OPTIMIZE_CONTENT_MAX) {
      return { success: false, error: AI_ERRORS.promptTooLong };
    }

    const client = await getAiClient(userId);
    if (!("openai" in client)) return client;

    const source = { title: item.title, content };
    const response = await client.openai.responses.create({
      model: AI_MODEL,
      instructions: OPTIMIZE_INSTRUCTIONS,
      input: buildOptimizeInput(source),
      text: { format: { type: "json_object" } },
      store: false,
    });

    const outcome = parseOptimizeResponse(response.output_text, source);
    if (!outcome) return { success: false, error: AI_ERRORS.noOptimization };
    if (!outcome.improved) return { success: true, data: { optimized: null, changes: [] } };
    return { success: true, data: { optimized: outcome.optimized, changes: outcome.changes } };
  } catch (error) {
    console.error("AI prompt optimization failed:", error);
    return { success: false, error: toAiErrorMessage(error, AI_ERRORS.noOptimization) };
  }
}
