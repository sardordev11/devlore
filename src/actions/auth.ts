"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { signInSchema } from "@/lib/validations/auth";

const DEFAULT_REDIRECT = "/dashboard";

interface ActionResult {
  success: boolean;
  error?: string;
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

export async function signInWithGitHub(callbackUrl?: string) {
  await signIn("github", { redirectTo: safeRedirect(callbackUrl) });
}

export async function signOutUser() {
  await signOut({ redirectTo: "/sign-in" });
}
