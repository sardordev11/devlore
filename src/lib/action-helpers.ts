import "server-only";

import { z } from "zod";

import { auth } from "@/auth";

export const SIGNED_OUT_ERROR = "You must be signed in";
export const ITEM_NOT_FOUND = "Item not found";
export const COLLECTION_NOT_FOUND = "Collection not found";

// The signed-in user's id, or null. Callers return SIGNED_OUT_ERROR themselves,
// since each action has its own result type.
export async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

// A failed form validation: the first message plus per-field messages.
export function toValidationFailure<T>(error: z.ZodError<T>, fallback: string) {
  return {
    success: false as const,
    error: error.issues[0]?.message ?? fallback,
    fieldErrors: z.flattenError(error).fieldErrors,
  };
}
