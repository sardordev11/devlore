"use server";

import { getSessionUserId, SIGNED_OUT_ERROR } from "@/lib/action-helpers";
import { updateEditorPreferences as updateEditorPreferencesQuery } from "@/lib/db/settings";
import {
  editorPreferencesSchema,
  type EditorPreferences,
} from "@/lib/editor-preferences";
import type { ActionResult } from "@/types/actions";

type UpdateEditorPreferencesResult = ActionResult<EditorPreferences>;

export async function updateEditorPreferences(
  input: unknown,
): Promise<UpdateEditorPreferencesResult> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: SIGNED_OUT_ERROR };

  const parsed = editorPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid editor preferences" };
  }

  try {
    const preferences = await updateEditorPreferencesQuery(userId, parsed.data);
    if (!preferences) {
      return { success: false, error: "User not found" };
    }
    return { success: true, data: preferences };
  } catch (error) {
    console.error("Update editor preferences failed:", error);
    return {
      success: false,
      error: "Couldn't save your editor preferences. Please try again.",
    };
  }
}
