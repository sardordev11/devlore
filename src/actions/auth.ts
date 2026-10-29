"use server";

import { AuthError, CredentialsSignin } from "next-auth";
import { EMAIL_NOT_VERIFIED, signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resendVerificationSchema, signInSchema } from "@/lib/validations/auth";
import {
  EMAIL_VERIFICATION_ENABLED,
  isInResendCooldown,
  sendVerificationLink,
} from "@/lib/verification";

const DEFAULT_REDIRECT = "/dashboard";

interface ActionResult {
  success: boolean;
  error?: string;
  needsVerification?: boolean;
}

// Only same-site paths, so a crafted callbackUrl can't redirect off-site
function safeRedirect(callbackUrl: unknown) {
  return typeof callbackUrl === "string" &&
    callbackUrl.startsWith("/") &&
    !callbackUrl.startsWith("//")
    ? callbackUrl
    : DEFAULT_REDIRECT;
}

export async function signInWithCredentials(
  input: unknown,
  callbackUrl?: string,
): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Enter a valid email and password" };
  }

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: safeRedirect(callbackUrl),
    });
    return { success: true };
  } catch (error) {
    // signIn throws a redirect on success, which must be rethrown
    if (
      error instanceof CredentialsSignin &&
      error.code === EMAIL_NOT_VERIFIED
    ) {
      return {
        success: false,
        needsVerification: true,
        error: "Please verify your email before signing in.",
      };
    }
    if (error instanceof AuthError) {
      return {
        success: false,
        error:
          error.type === "CredentialsSignin"
            ? "Invalid email or password"
            : "Sign in failed. Please try again.",
      };
    }
    throw error;
  }
}

// Same response whether or not the account exists, so emails can't be probed
export async function resendVerificationEmail(
  input: unknown,
): Promise<ActionResult> {
  const parsed = resendVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Enter a valid email address" };
  }

  if (!EMAIL_VERIFICATION_ENABLED) return { success: true };

  const { email } = parsed.data;
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { emailVerified: true, passwordHash: true },
    });
    const canResend =
      user?.passwordHash && !user.emailVerified && !(await isInResendCooldown(email));
    if (canResend) await sendVerificationLink(email);

    return { success: true };
  } catch (error) {
    console.error("Resend verification failed:", error);
    return { success: false, error: "Couldn't send the email. Please try again." };
  }
}

export async function signInWithGitHub(callbackUrl?: string) {
  await signIn("github", { redirectTo: safeRedirect(callbackUrl) });
}

export async function signOutUser() {
  await signOut({ redirectTo: "/sign-in" });
}
