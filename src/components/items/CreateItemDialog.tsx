"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type SubmitEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { createItem } from "@/actions/items";
import { EditField } from "@/components/items/ItemEditForm";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getTypeIcon } from "@/lib/type-icons";
import { cn } from "@/lib/utils";
import {
  getCreateFields,
  parseTags,
  type createItemSchema,
  type CreatableTypeSlug,
} from "@/lib/validations/items";

// Matches the seeded system types.
const TYPE_OPTIONS: {
  slug: CreatableTypeSlug;
  label: string;
  icon: string;
  color: string;
}[] = [
  { slug: "snippets", label: "Snippet", icon: "Code", color: "#3b82f6" },
  { slug: "prompts", label: "Prompt", icon: "Sparkles", color: "#8b5cf6" },
  { slug: "commands", label: "Command", icon: "Terminal", color: "#f97316" },
  { slug: "notes", label: "Note", icon: "StickyNote", color: "#fde047" },
  { slug: "links", label: "Link", icon: "Link", color: "#10b981" },
];

type FieldName = "title" | "description" | "content" | "language" | "url" | "tags";

type FieldErrors = Partial<
  Record<keyof z.input<typeof createItemSchema>, string[]>
>;

const EMPTY_VALUES: Record<FieldName, string> = {
  title: "",
  description: "",
  content: "",
  language: "",
  url: "",
  tags: "",
};

interface TypeSelectorProps {
  value: CreatableTypeSlug;
  onChange: (slug: CreatableTypeSlug) => void;
  disabled: boolean;
}

function TypeSelector({ value, onChange, disabled }: TypeSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Item type"
      className="grid grid-cols-3 gap-2 sm:grid-cols-5"
    >
      {TYPE_OPTIONS.map((option) => {
        const Icon = getTypeIcon(option.icon);
        const selected = option.slug === value;
        return (
          <button
            key={option.slug}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(option.slug)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-xs font-medium transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50",
              selected
                ? "border-foreground/40 bg-muted"
                : "border-border text-muted-foreground",
            )}
          >
            <Icon className="size-4" style={{ color: option.color }} />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function CreateItemDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<CreatableTypeSlug>("snippets");
  const [values, setValues] = useState(EMPTY_VALUES);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const fields = getCreateFields(type);
  const showUrl = fields.url;

  function handleOpenChange(nextOpen: boolean) {
    if (isPending) return;
    setOpen(nextOpen);
    if (!nextOpen) {
      setType("snippets");
      setValues(EMPTY_VALUES);
      setFieldErrors({});
    }
  }

  function fieldProps(name: FieldName) {
    const error = fieldErrors[name]?.[0];
    return {
      id: `new-item-${name}`,
      value: values[name],
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setValues((current) => ({ ...current, [name]: event.target.value })),
      disabled: isPending,
      "aria-invalid": error ? true : undefined,
      "aria-describedby": error ? `new-item-${name}-error` : undefined,
    };
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      type,
      title: values.title,
      description: values.description,
      tags: parseTags(values.tags),
      ...(fields.content && { content: values.content }),
      ...(fields.language && { language: values.language }),
      ...(fields.url && { url: values.url }),
    };

    startTransition(async () => {
      const result = await createItem(payload);
      if (!result.success) {
        setFieldErrors("fieldErrors" in result ? result.fieldErrors : {});
        toast.error(result.error);
        return;
      }
      toast.success("Item created");
      setOpen(false);
      setType("snippets");
      setValues(EMPTY_VALUES);
      setFieldErrors({});
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button aria-label="New Item" />}>
        <Plus data-icon="inline-start" />
        <span className="hidden sm:inline">New Item</span>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New item</DialogTitle>
          <DialogDescription>
            Choose a type, then fill in the details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="grid gap-4">
          <TypeSelector
            value={type}
            onChange={(slug) => {
              setType(slug);
              setFieldErrors({});
            }}
            disabled={isPending}
          />

          <EditField id="new-item-title" label="Title" error={fieldErrors.title?.[0]}>
            <Input {...fieldProps("title")} required autoFocus />
          </EditField>

          {showUrl && (
            <EditField id="new-item-url" label="URL" error={fieldErrors.url?.[0]}>
              <Input
                {...fieldProps("url")}
                type="url"
                required
                placeholder="https://example.com"
              />
            </EditField>
          )}

          <EditField
            id="new-item-description"
            label="Description"
            error={fieldErrors.description?.[0]}
          >
            <Textarea {...fieldProps("description")} rows={2} />
          </EditField>

          {fields.content && (
            <EditField
              id="new-item-content"
              label="Content"
              error={fieldErrors.content?.[0]}
            >
              <Textarea
                {...fieldProps("content")}
                rows={8}
                className="max-h-72 font-mono text-xs leading-relaxed md:text-xs"
              />
            </EditField>
          )}

          {fields.language && (
            <EditField
              id="new-item-language"
              label="Language"
              error={fieldErrors.language?.[0]}
            >
              <Input {...fieldProps("language")} placeholder="typescript" />
            </EditField>
          )}

          <EditField id="new-item-tags" label="Tags" error={fieldErrors.tags?.[0]}>
            <Input {...fieldProps("tags")} placeholder="react, hooks, auth" />
          </EditField>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />} disabled={isPending}>
              Cancel
            </DialogClose>
            <Button
              type="submit"
              disabled={
                isPending || !values.title.trim() || (showUrl && !values.url.trim())
              }
            >
              {isPending ? "Creating…" : "Create item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
