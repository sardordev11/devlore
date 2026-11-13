"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { createItem } from "@/actions/items";
import { toastUpgradeError } from "@/components/billing/UpgradePrompt";
import { useFileUpload } from "@/hooks/use-file-upload";
import type { ItemFieldErrors } from "@/hooks/use-item-fields";
import { isFileTypeSlug } from "@/lib/file-constraints";
import type { buildItemPayload } from "@/lib/item-form";
import type { CreatableTypeSlug } from "@/lib/validations/items";

interface CreateItemInput {
  type: CreatableTypeSlug;
  fields: ReturnType<typeof buildItemPayload>;
  collectionIds: string[];
  // Required for files and images, ignored otherwise.
  file: File | null;
}

interface CreateItemHandlers {
  onFieldErrors: (errors: ItemFieldErrors) => void;
  onSuccess: () => void;
}

// Creates an item from the New Item dialog. Files go to R2 first and the item
// then references the stored key; upgrade errors show the upgrade toast.
export function useCreateItem() {
  const [isPending, startTransition] = useTransition();
  const { upload, progress } = useFileUpload();

  function submit(input: CreateItemInput, handlers: CreateItemHandlers) {
    const { type, fields, collectionIds, file } = input;

    startTransition(async () => {
      let uploaded = null;
      if (isFileTypeSlug(type)) {
        if (!file) return;
        const uploadResult = await upload(file, type);
        if (!uploadResult.success) {
          if (uploadResult.upgrade) {
            toastUpgradeError(uploadResult.error);
            return;
          }
          handlers.onFieldErrors({ file: [uploadResult.error] });
          toast.error(uploadResult.error);
          return;
        }
        uploaded = uploadResult.data;
      }

      const result = await createItem({ type, ...fields, collectionIds, file: uploaded });
      if (!result.success) {
        if ("upgrade" in result) {
          toastUpgradeError(result.error);
          return;
        }
        handlers.onFieldErrors("fieldErrors" in result ? result.fieldErrors : {});
        toast.error(result.error);
        return;
      }
      toast.success("Item created");
      handlers.onSuccess();
    });
  }

  return { submit, isPending, progress };
}
