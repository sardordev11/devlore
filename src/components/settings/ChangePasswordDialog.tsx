"use client";

import { KeyRoundIcon } from "lucide-react";
import { useState, useTransition, type SubmitEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { changePassword } from "@/actions/profile";
import { AuthField } from "@/components/auth/AuthField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { changePasswordSchema } from "@/lib/validations/auth";

type FieldErrors = Partial<
  Record<keyof z.input<typeof changePasswordSchema>, string[]>
>;

export function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    if (isPending) return;
    setOpen(nextOpen);
    setFieldErrors({});
    setFormError(null);
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));

    const parsed = changePasswordSchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }

    setFieldErrors({});
    setFormError(null);
    startTransition(async () => {
      const result = await changePassword(parsed.data);
      if (result.success) {
        setOpen(false);
        toast.success("Password updated");
        return;
      }
      if (result.wrongPassword) {
        setFieldErrors({ currentPassword: [result.error ?? "Incorrect password"] });
        return;
      }
      setFormError(result.error ?? "Couldn't change your password");
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" />}>
        <KeyRoundIcon />
        Change password
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>
            Enter your current password, then choose a new one.
          </DialogDescription>
        </DialogHeader>

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
            name="currentPassword"
            label="Current password"
            type="password"
            autoComplete="current-password"
            errors={fieldErrors.currentPassword}
          />
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
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />} disabled={isPending}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Updating…" : "Update password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
