import "server-only";

import OpenAI from "openai";

export const AI_MODEL = "gpt-5-nano";

let client: OpenAI | null = null;

// Created lazily so builds and tests without OPENAI_API_KEY still work.
// Null when the key is missing, so callers can fail with a friendly message.
export function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  client ??= new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    // The SDK default is 10 minutes, far too long for a button click
    timeout: 30_000,
    maxRetries: 1,
  });
  return client;
}
