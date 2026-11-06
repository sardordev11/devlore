import "server-only";

import { connection } from "next/server";

import { auth } from "@/auth";
import { getEditorPreferences } from "@/lib/db/settings";
import {
  DEFAULT_EDITOR_PREFERENCES,
  type EditorPreferences,
} from "@/lib/editor-preferences";

// Signed-in user's editor preferences, or the defaults when signed out.
export async function loadEditorPreferences(): Promise<EditorPreferences> {
  // User data must be fetched per request, not prerendered at build time.
  await connection();
  const session = await auth();
  if (!session?.user?.id) return DEFAULT_EDITOR_PREFERENCES;
  return getEditorPreferences(session.user.id);
}
