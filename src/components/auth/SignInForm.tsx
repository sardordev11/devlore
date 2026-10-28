"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useTransition, type SubmitEvent } from "react";
import { z } from "zod";

import { signInWithCredentials } from "@/actions/auth";
import { AuthField } from "@/components/auth/AuthField";
import { GitHubSignInButton } from "@/components/auth/GitHubSignInButton";
import { Button } from "@/components/ui/button";
import { signInSchema } from "@/lib/validations/auth";

type FieldErrors = Partial<Record<keyof z.input<typeof signInSchema>, string[]>>;

// Errors NextAuth sends back as ?error= (e.g. from the GitHub OAuth flow)
function getAuthErrorMessage(code: string | null) {
  if (!code) return null;
  if (code === "OAuthAccountNotLinked") {
    return "This email is already registered with a different sign-in method.";
  }
  return "Sign in failed. Please try again.";
}

export function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? undefined;

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState(() =>
    getAuthErrorMessage(searchParams.get("error")),
  );
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));

    const parsed = signInSchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }

    setFieldErrors({});
    setFormError(null);
    startTransition(async () => {
      const result = await signInWithCredentials(parsed.data, callbackUrl);
      if (!result.success) setFormError(result.error ?? "Sign in failed");
    });
  }

  return (
    <div className="grid gap-6">
      {formError && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {formError}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="grid gap-4">
        <AuthField
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          errors={fieldErrors.email}
        />
        <AuthField
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          errors={fieldErrors.password}
        />
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <GitHubSignInButton callbackUrl={callbackUrl} />

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="text-foreground underline-offset-4 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
