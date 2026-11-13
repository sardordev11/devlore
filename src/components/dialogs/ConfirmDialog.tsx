"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ActionResult } from "@/types/actions";

interface ConfirmDialogProps {
  // An <AlertDialogTrigger>; leave out and pass open/onOpenChange to control it.
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  cancelLabel?: string;
  confirmLabel: string;
  pendingLabel: string;
  onConfirm: () => Promise<ActionResult<unknown>>;
  successMessage: string;
  // Runs after the dialog closes, e.g. closing the drawer or refreshing.
  onSuccess?: () => void;
}

// Destructive confirmation that runs a server action. It can't be closed while
// the action is pending, shows an error toast on failure and stays open.
export function ConfirmDialog({
  trigger,
  open: controlledOpen,
  onOpenChange,
  title,
  description,
  cancelLabel = "Cancel",
  confirmLabel,
  pendingLabel,
  onConfirm,
  successMessage,
  onSuccess,
}: ConfirmDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const open = controlledOpen ?? uncontrolledOpen;

  function setOpen(nextOpen: boolean) {
    setUncontrolledOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isPending) return;
    setOpen(nextOpen);
  }

  function handleConfirm() {
    startTransition(async () => {
      const result = await onConfirm();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setOpen(false);
      onSuccess?.();
      toast.success(successMessage);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      {trigger}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? pendingLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
