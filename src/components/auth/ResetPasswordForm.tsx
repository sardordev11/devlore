"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type SubmitEvent } from "react";
import { z } from "zod";

import { resetPassword } from "@/actions/auth";
import { AuthField } from "@/components/auth/AuthField";
import { Button } from "@/components/ui/button";
import { resetPasswordSchema } from "@/lib/validations/auth";

type FieldErrors = Partial<
  Record<keyof z.input<typeof resetPasswordSchema>, string[]>
>;

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [invalidToken, setInvalidToken] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));

    const parsed = resetPasswordSchema.safeParse({ ...values, token });
    if (!parsed.success) {
      setFieldErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }

    setFieldErrors({});
    setFormError(null);
    startTransition(async () => {
      const result = await resetPassword(parsed.data);
      if (result.success) {
        router.push("/sign-in?reset=1");
        return;
      }
      setFormError(result.error ?? "Couldn't reset your password");
      setInvalidToken(result.invalidToken ?? false);
    });
  }

  return (
    <div className="grid gap-6">
      {formError && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {formError}{" "}
          {invalidToken && (
            <Link href="/forgot-password" className="font-medium underline underline-offset-4">
              Request a new link
            </Link>
          )}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="grid gap-4">
        <AuthField
          name="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          errors={fieldErrors.password}
        />
        <AuthField
          name="confirmPassword"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          errors={fieldErrors.confirmPassword}
        />
        <Button type="submit" className="w-full" disabled={isPending || invalidToken}>
          {isPending ? "Updating…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}
