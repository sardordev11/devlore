"use server";

import bcrypt from "bcryptjs";

import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteFile, getFileKey } from "@/lib/r2";
import { checkRateLimit, rateLimitMessage } from "@/lib/rate-limit";
import { PASSWORD_RESET_PREFIX } from "@/lib/tokens";
import {
  changePasswordSchema,
  DELETE_CONFIRMATION,
  isDeleteConfirmed,
} from "@/lib/validations/auth";

interface ActionResult {
  success: boolean;
  error?: string;
  wrongPassword?: boolean;
}

// Best effort: the account is already gone, so a failed delete only leaves an orphaned object.
async function removeFiles(fileUrls: (string | null)[]) {
  const keys = fileUrls.flatMap((url) => {
    const key = url ? getFileKey(url) : null;
    return key ? [key] : [];
  });
  const results = await Promise.allSettled(keys.map((key) => deleteFile(key)));
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("R2 delete failed:", result.reason);
    }
  }
}

export async function changePassword(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in" };
  }

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Enter a valid new password" };
  }

  // Keyed by user so a hijacked session can't brute-force the current password
  const limit = await checkRateLimit("changePassword", session.user.id);
  if (!limit.success) {
    return { success: false, error: rateLimitMessage(limit.reset) };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });
    if (!user?.passwordHash) {
      return { success: false, error: "This account has no password to change" };
    }

    const valid = await bcrypt.compare(
      parsed.data.currentPassword,
      user.passwordHash,
    );
    if (!valid) {
      return {
        success: false,
        wrongPassword: true,
        error: "Current password is incorrect",
      };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: await bcrypt.hash(parsed.data.password, 12) },
    });
    return { success: true };
  } catch (error) {
    console.error("Change password failed:", error);
    return { success: false, error: "Couldn't change your password. Please try again." };
  }
}

export async function deleteAccount(confirmation: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in" };
  }

  if (!isDeleteConfirmed(confirmation)) {
    return { success: false, error: `Type "${DELETE_CONFIRMATION}" to confirm` };
  }

  try {
    // Uploaded files live in R2, so collect their keys before the items cascade away
    const files = await prisma.item.findMany({
      where: { userId: session.user.id, fileUrl: { not: null } },
      select: { fileUrl: true },
    });

    // Items, collections, tags, accounts and sessions cascade with the user.
    // Verification and reset tokens are keyed by email, so they go separately.
    const user = await prisma.user.delete({
      where: { id: session.user.id },
      select: { email: true },
    });
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: { in: [user.email, `${PASSWORD_RESET_PREFIX}${user.email}`] },
      },
    });

    await removeFiles(files.map((file) => file.fileUrl));
  } catch (error) {
    console.error("Delete account failed:", error);
    return { success: false, error: "Couldn't delete your account. Please try again." };
  }

  // signOut throws a redirect, so it must stay outside the try/catch
  await signOut({ redirectTo: "/sign-in" });
  return { success: true };
}
