"use server";

import bcrypt from "bcryptjs";

import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
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

export async function changePassword(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in" };
  }

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Enter a valid new password" };
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
  } catch (error) {
    console.error("Delete account failed:", error);
    return { success: false, error: "Couldn't delete your account. Please try again." };
  }

  // signOut throws a redirect, so it must stay outside the try/catch
  await signOut({ redirectTo: "/sign-in" });
  return { success: true };
}
