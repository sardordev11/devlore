"use server";

import { auth } from "@/auth";
import { updateEditorPreferences as updateEditorPreferencesQuery } from "@/lib/db/settings";
import {
  editorPreferencesSchema,
  type EditorPreferences,
} from "@/lib/editor-preferences";

type UpdateEditorPreferencesResult =
  | { success: true; data: EditorPreferences }
  | { success: false; error: string };

export async function updateEditorPreferences(
  input: unknown,
): Promise<UpdateEditorPreferencesResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in" };
  }

  const parsed = editorPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid editor preferences" };
  }

  try {
    const preferences = await updateEditorPreferencesQuery(
      session.user.id,
      parsed.data,
    );
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
