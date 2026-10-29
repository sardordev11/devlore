"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { resendVerificationEmail } from "@/actions/auth";
import { Button } from "@/components/ui/button";

interface ResendVerificationButtonProps {
  email: string;
}

export function ResendVerificationButton({ email }: ResendVerificationButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await resendVerificationEmail({ email });
      if (result.success) {
        toast.success("If your account needs verifying, a new link is on its way.");
      } else {
        toast.error(result.error ?? "Couldn't send the email");
      }
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={isPending}
      onClick={handleClick}
    >
      {isPending ? "Sending…" : "Resend verification email"}
    </Button>
  );
}
