"use client";

import Link from "next/link";
import { useState, useTransition, type SubmitEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { requestPasswordReset } from "@/actions/auth";
import { AUTH_SUBMIT_CLASS_NAME, AuthField } from "@/components/auth/AuthField";
import { FormAlert } from "@/components/auth/FormAlert";
import { Button } from "@/components/ui/button";
import { forgotPasswordSchema } from "@/lib/validations/auth";

export function ForgotPasswordForm() {
  const [emailErrors, setEmailErrors] = useState<string[]>();
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));

    const parsed = forgotPasswordSchema.safeParse(values);
    if (!parsed.success) {
      setEmailErrors(z.flattenError(parsed.error).fieldErrors.email);
      return;
    }

    setEmailErrors(undefined);
    setFormError(null);
    startTransition(async () => {
      const result = await requestPasswordReset(parsed.data);
      if (result.success) {
        setSent(true);
      } else if (result.rateLimited) {
        toast.error(result.error);
      } else {
        setFormError(result.error ?? "Couldn't send the email");
      }
    });
  }

  return (
    <div className="grid gap-6">
      {sent && (
        <FormAlert variant="success">
          If an account exists for that email, we&apos;ve sent a reset link.
        </FormAlert>
      )}

      {formError && <FormAlert variant="error">{formError}</FormAlert>}

      <form onSubmit={handleSubmit} noValidate className="grid gap-4">
        <AuthField
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          errors={emailErrors}
        />
        <Button type="submit" className={AUTH_SUBMIT_CLASS_NAME} disabled={isPending}>
          {isPending ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/sign-in" className="text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
