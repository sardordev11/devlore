"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type SubmitEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AuthField } from "@/components/auth/AuthField";
import { Button } from "@/components/ui/button";
import { registerSchema } from "@/lib/validations/auth";

type FieldErrors = Partial<
  Record<keyof z.input<typeof registerSchema>, string[]>
>;

interface RegisterResponse {
  success: boolean;
  data?: { requiresVerification: boolean };
  error?: string;
}

export function SignUpForm() {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));

    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }

    setFieldErrors({});
    setFormError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
        const result: RegisterResponse = await response.json();

        if (!response.ok || !result.success) {
          setFormError(result.error ?? "Registration failed");
          return;
        }
        toast.success(
          result.data?.requiresVerification === false
            ? "Account created successfully!"
            : "Check your email to verify your account",
        );
        router.push("/sign-in");
      } catch {
        setFormError("Something went wrong. Please try again.");
      }
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
          name="name"
          label="Name"
          autoComplete="name"
          placeholder="Ada Lovelace"
          errors={fieldErrors.name}
        />
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
          autoComplete="new-password"
          errors={fieldErrors.password}
        />
        <AuthField
          name="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          errors={fieldErrors.confirmPassword}
        />
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
