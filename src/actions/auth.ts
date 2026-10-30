"use server";

import { AuthError, CredentialsSignin } from "next-auth";
import {
  EMAIL_NOT_VERIFIED,
  LoginRateLimited,
  signIn,
  signOut,
} from "@/auth";
import {
  isInResetCooldown,
  resetPasswordWithToken,
  sendPasswordResetLink,
} from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  getRequestIp,
  rateLimitMessage,
  type RateLimitName,
} from "@/lib/rate-limit";
import {
  forgotPasswordSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  signInSchema,
} from "@/lib/validations/auth";
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
  invalidToken?: boolean;
  rateLimited?: boolean;
}

function rateLimited(reset: number): ActionResult {
  return { success: false, rateLimited: true, error: rateLimitMessage(reset) };
}

// Returns a rate-limited result when over the limit, otherwise null
async function enforceRateLimit(name: RateLimitName, email?: string) {
  const ip = await getRequestIp();
  const limit = await checkRateLimit(name, email ? `${ip}:${email}` : ip);
  return limit.success ? null : rateLimited(limit.reset);
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
    if (error instanceof LoginRateLimited) return rateLimited(error.reset);
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
  const limited = await enforceRateLimit("resendVerification", email);
  if (limited) return limited;

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

// Same response whether or not the account exists, so emails can't be probed.
// OAuth-only users have no password to reset, so they get no email.
export async function requestPasswordReset(
  input: unknown,
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Enter a valid email address" };
  }

  const limited = await enforceRateLimit("forgotPassword");
  if (limited) return limited;

  const { email } = parsed.data;
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { passwordHash: true },
    });
    if (user?.passwordHash && !(await isInResetCooldown(email))) {
      await sendPasswordResetLink(email);
    }

    return { success: true };
  } catch (error) {
    console.error("Password reset request failed:", error);
    return { success: false, error: "Couldn't send the email. Please try again." };
  }
}

export async function resetPassword(input: unknown): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Enter a valid new password" };
  }

  const limited = await enforceRateLimit("resetPassword");
  if (limited) return limited;

  try {
    const result = await resetPasswordWithToken(
      parsed.data.token,
      parsed.data.password,
    );
    if (result === "invalid") {
      return {
        success: false,
        invalidToken: true,
        error: "This reset link has expired or was already used.",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Password reset failed:", error);
    return { success: false, error: "Couldn't reset your password. Please try again." };
  }
}

export async function signInWithGitHub(callbackUrl?: string) {
  await signIn("github", { redirectTo: safeRedirect(callbackUrl) });
}

export async function signOutUser() {
  await signOut({ redirectTo: "/sign-in" });
}
