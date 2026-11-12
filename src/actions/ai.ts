"use server";

import OpenAI from "openai";

import { auth } from "@/auth";
import { AI_MODEL, getOpenAI } from "@/lib/ai/client";
import {
  buildDescriptionInput,
  DESCRIPTION_INSTRUCTIONS,
  generateDescriptionSchema,
  parseDescriptionResponse,
} from "@/lib/ai/description";
import {
  buildTagInput,
  generateAutoTagsSchema,
  parseTagResponse,
  TAG_INSTRUCTIONS,
} from "@/lib/ai/tags";
import { checkAiAccess } from "@/lib/plan-gate";
import { checkRateLimit, rateLimitMessage } from "@/lib/rate-limit";

export type AiResult<T> =
  | { success: true; data: T }
  // upgrade: Pro-only, so the client offers the upgrade link
  | { success: false; error: string; upgrade?: true };

const AI_ERRORS = {
  unavailable: "AI features aren't available right now.",
  busy: "AI is busy right now. Please try again in a minute.",
  connection: "Couldn't reach the AI service. Please try again.",
  noTags: "Couldn't suggest tags for this item. Try adding more content.",
  generic: "Couldn't suggest tags. Please try again.",
  noDescription: "Couldn't write a description for this item. Try adding more content.",
  genericDescription: "Couldn't generate a description. Please try again.",
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
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in" };
  }
  const userId = session.user.id;

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
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in" };
  }
  const userId = session.user.id;

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
