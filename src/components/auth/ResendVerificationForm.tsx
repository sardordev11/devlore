"use client";

import Link from "next/link";
import { useState, useTransition, type SubmitEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { resendVerificationEmail } from "@/actions/auth";
import { AuthField } from "@/components/auth/AuthField";
import { Button } from "@/components/ui/button";
import { resendVerificationSchema } from "@/lib/validations/auth";

export function ResendVerificationForm() {
  const [emailErrors, setEmailErrors] = useState<string[]>();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));

    const parsed = resendVerificationSchema.safeParse(values);
    if (!parsed.success) {
      setEmailErrors(z.flattenError(parsed.error).fieldErrors.email);
      return;
    }

    setEmailErrors(undefined);
    startTransition(async () => {
      const result = await resendVerificationEmail(parsed.data);
      if (result.success) {
        toast.success("If your account needs verifying, a new link is on its way.");
      } else {
        toast.error(result.error ?? "Couldn't send the email");
      }
    });
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit} noValidate className="grid gap-4">
        <AuthField
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          errors={emailErrors}
        />
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Sending…" : "Send a new link"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already verified?{" "}
        <Link href="/sign-in" className="text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
