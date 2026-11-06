"use client";

import { FolderIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useItemDrawer } from "@/components/items/ItemDrawerProvider";
import { SearchTrigger } from "@/components/search/SearchTrigger";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { scoreSearchMatch } from "@/lib/search-score";
import { getTypeIcon, getTypeTint } from "@/lib/type-icons";
import type { SearchData } from "@/types/search";

interface CommandPaletteProps {
  data: SearchData;
}

// Item values are ids, so match only against the keywords (title, type, preview).
function filterByKeywords(_value: string, search: string, keywords?: string[]) {
  const [title = "", typeName, preview] = keywords ?? [];
  return scoreSearchMatch(search, [title, typeName, preview]);
}

export function CommandPalette({ data }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { openItem } = useItemDrawer();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey)) {
        return;
      }
      event.preventDefault();
      setOpen((current) => !current);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function selectItem(itemId: string) {
    setOpen(false);
    openItem(itemId);
  }

  function selectCollection(collectionId: string) {
    setOpen(false);
    router.push(`/collections/${collectionId}`);
  }

  const hasItems = data.items.length > 0;
  const hasCollections = data.collections.length > 0;

  return (
    <>
      <SearchTrigger onClick={() => setOpen(true)} />
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description="Search your items and collections"
        className="sm:max-w-xl"
      >
        <Command filter={filterByKeywords}>
          <CommandInput placeholder="Search items and collections..." />
          <CommandList className="max-h-96">
            <CommandEmpty>No results found.</CommandEmpty>
            {hasItems && (
              <CommandGroup heading="Items">
                {data.items.map((item) => {
                  const Icon = getTypeIcon(item.type.icon);
                  return (
                    <CommandItem
                      key={item.id}
                      value={`item:${item.id}`}
                      keywords={[item.title, item.type.name, item.preview ?? ""]}
                      onSelect={() => selectItem(item.id)}
                    >
                      <span
                        className="flex size-7 shrink-0 items-center justify-center rounded-md"
                        style={getTypeTint(item.type.color)}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{item.title}</span>
                        {item.preview && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {item.preview}
                          </span>
                        )}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
            {hasItems && hasCollections && <CommandSeparator />}
            {hasCollections && (
              <CommandGroup heading="Collections">
                {data.collections.map((collection) => (
                  <CommandItem
                    key={collection.id}
                    value={`collection:${collection.id}`}
                    keywords={[collection.name]}
                    onSelect={() => selectCollection(collection.id)}
                  >
                    <FolderIcon className="text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{collection.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {collection.itemCount}{" "}
                      {collection.itemCount === 1 ? "item" : "items"}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
