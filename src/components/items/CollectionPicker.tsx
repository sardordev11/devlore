"use client";

import { ChevronsUpDownIcon, FolderIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCollectionOptions } from "@/hooks/use-collection-options";
import { cn } from "@/lib/utils";

interface CollectionPickerProps {
  id: string;
  value: string[];
  onChange: (collectionIds: string[]) => void;
  disabled?: boolean;
  error?: string;
}

// Multi-select of the user's collections. Loads them when it mounts.
export function CollectionPicker({
  id,
  value,
  onChange,
  disabled,
  error,
}: CollectionPickerProps) {
  const options = useCollectionOptions();
  const collections = options.status === "ready" ? options.collections : [];
  const selectedNames = collections
    .filter((collection) => value.includes(collection.id))
    .map((collection) => collection.name);

  function toggle(collectionId: string, checked: boolean) {
    onChange(
      checked
        ? [...value, collectionId]
        : value.filter((selected) => selected !== collectionId),
    );
  }

  const label =
    options.status === "loading"
      ? "Loading collections…"
      : options.status === "error"
        ? options.error
        : selectedNames.length > 0
          ? selectedNames.join(", ")
          : collections.length > 0
            ? "Select collections"
            : "No collections";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled || options.status !== "ready"}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className="w-full justify-between font-normal"
          />
        }
      >
        <span className="flex min-w-0 items-center gap-2">
          <FolderIcon className="text-muted-foreground" />
          <span
            className={cn(
              "truncate",
              selectedNames.length === 0 && "text-muted-foreground",
            )}
          >
            {label}
          </span>
        </span>
        <ChevronsUpDownIcon className="text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-64">
        {collections.length === 0 ? (
          <DropdownMenuItem disabled>
            No collections yet. Create one with New Collection.
          </DropdownMenuItem>
        ) : (
          collections.map((collection) => (
            <DropdownMenuCheckboxItem
              key={collection.id}
              checked={value.includes(collection.id)}
              onCheckedChange={(checked) => toggle(collection.id, checked)}
            >
              <span className="truncate">{collection.name}</span>
            </DropdownMenuCheckboxItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
