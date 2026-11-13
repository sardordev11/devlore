"use server";

import bcrypt from "bcryptjs";

import { signOut } from "@/auth";
import { getSessionUserId, SIGNED_OUT_ERROR } from "@/lib/action-helpers";
import { decryptBillingKey } from "@/lib/billing-key-crypto";
import { deleteFilesByUrl } from "@/lib/file-cleanup";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitMessage } from "@/lib/rate-limit";
import { deleteBillingKey } from "@/lib/toss";
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

// Best effort, like the files: a key left at Toss can't be charged without
// our secret key, and Toss failing mustn't block the account deletion.
async function removeBillingKey(encrypted: string | null | undefined) {
  if (!encrypted) return;
  try {
    await deleteBillingKey(decryptBillingKey(encrypted));
  } catch (error) {
    console.error("Toss billing key delete failed:", error);
  }
}

export async function changePassword(input: unknown): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: SIGNED_OUT_ERROR };

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Enter a valid new password" };
  }

  // Keyed by user so a hijacked session can't brute-force the current password
  const limit = await checkRateLimit("changePassword", userId);
  if (!limit.success) {
    return { success: false, error: rateLimitMessage(limit.reset) };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(parsed.data.password, 12) },
    });
    return { success: true };
  } catch (error) {
    console.error("Change password failed:", error);
    return { success: false, error: "Couldn't change your password. Please try again." };
  }
}

export async function deleteAccount(confirmation: unknown): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: SIGNED_OUT_ERROR };

  if (!isDeleteConfirmed(confirmation)) {
    return { success: false, error: `Type "${DELETE_CONFIRMATION}" to confirm` };
  }

  try {
    // Uploaded files live in R2, so collect their keys before the items cascade away
    const files = await prisma.item.findMany({
      where: { userId: userId, fileUrl: { not: null } },
      select: { fileUrl: true },
    });
    // The subscription cascades too, so read its billing key first
    const subscription = await prisma.subscription.findUnique({
      where: { userId: userId },
      select: { billingKey: true },
    });

    // Items, collections, tags, accounts and sessions cascade with the user.
    // Verification and reset tokens are keyed by email, so they go separately.
    const user = await prisma.user.delete({
      where: { id: userId },
      select: { email: true },
    });
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: { in: [user.email, `${PASSWORD_RESET_PREFIX}${user.email}`] },
      },
    });

    // Best effort: the account is already gone, so a failed delete only leaves an orphaned object
    await deleteFilesByUrl(files.map((file) => file.fileUrl));
    await removeBillingKey(subscription?.billingKey);
  } catch (error) {
    console.error("Delete account failed:", error);
    return { success: false, error: "Couldn't delete your account. Please try again." };
  }

  // signOut throws a redirect, so it must stay outside the try/catch
  await signOut({ redirectTo: "/sign-in" });
  return { success: true };
}
