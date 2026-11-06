import "server-only";

import { isPrismaError, PRISMA_ERROR } from "@/lib/db/prisma-errors";
import {
  parseEditorPreferences,
  type EditorPreferences,
} from "@/lib/editor-preferences";
import { prisma } from "@/lib/prisma";

export interface AccountSettings {
  // OAuth-only users have no password to change.
  hasPassword: boolean;
}

export async function getAccountSettings(
  userId: string,
): Promise<AccountSettings | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user) return null;

  return { hasPassword: user.passwordHash !== null };
}

// Defaults for a missing user too, so the editor always has settings to use.
export async function getEditorPreferences(
  userId: string,
): Promise<EditorPreferences> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { editorPreferences: true },
  });
  return parseEditorPreferences(user?.editorPreferences);
}

// Returns null when the user no longer exists.
export async function updateEditorPreferences(
  userId: string,
  preferences: EditorPreferences,
): Promise<EditorPreferences | null> {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { editorPreferences: preferences },
      select: { editorPreferences: true },
    });
    return parseEditorPreferences(user.editorPreferences);
  } catch (error) {
    if (isPrismaError(error, PRISMA_ERROR.notFound)) return null;
    throw error;
  }
}
