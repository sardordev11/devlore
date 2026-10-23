import { ChevronDownIcon, FolderIcon, StarIcon } from "lucide-react";

import { SidebarNavItem } from "@/components/dashboard/SidebarNavItem";
import { SidebarUser } from "@/components/dashboard/SidebarUser";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { collections, currentUser, items, itemTypes } from "@/lib/mock-data";
import { getTypeIcon } from "@/lib/type-icons";

const RECENT_COLLECTIONS_LIMIT = 5;

// Latest lastUsedAt among a collection's items, as an ISO string ("" if none).
function getLastUsedAt(collectionId: string) {
  return items
    .filter((item) => item.collectionIds.includes(collectionId))
    .reduce(
      (latest, item) =>
        item.lastUsedAt && item.lastUsedAt > latest ? item.lastUsedAt : latest,
      "",
    );
}

const favoriteCollections = collections.filter((c) => c.isFavorite);

const recentCollections = collections
  .filter((c) => !c.isFavorite)
  .sort((a, b) => getLastUsedAt(b.id).localeCompare(getLastUsedAt(a.id)))
  .slice(0, RECENT_COLLECTIONS_LIMIT);

const SUBHEADING_CLASS =
  "px-2 pt-2 pb-1 text-xs font-medium tracking-wide text-sidebar-foreground/50 uppercase group-data-[collapsible=icon]:hidden";

const GROUP_LABEL_CLASS = "tracking-wide uppercase";

const CHEVRON_CLASS = "ml-auto transition-transform in-data-panel-open:rotate-180";

export function AppSidebar() {
  return (
    // Positioned inside the area below the top bar instead of the full viewport height.
    <Sidebar collapsible="icon" className="absolute h-full">
      <SidebarHeader className="h-12 flex-row items-center justify-between border-b border-sidebar-border group-data-[collapsible=icon]:justify-center">
        <span className="px-2 text-sm font-medium text-muted-foreground group-data-[collapsible=icon]:hidden">
          Navigation
        </span>
        <SidebarTrigger className="text-muted-foreground" />
      </SidebarHeader>

      <SidebarContent>
        <Collapsible defaultOpen>
          <SidebarGroup>
            <SidebarGroupLabel
              render={<CollapsibleTrigger />}
              className={GROUP_LABEL_CLASS}
            >
              Types
              <ChevronDownIcon className={CHEVRON_CLASS} />
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {itemTypes.map((type) => {
                    const Icon = getTypeIcon(type.icon);
                    const label =
                      type.slug.charAt(0).toUpperCase() + type.slug.slice(1);
                    return (
                      <SidebarNavItem
                        key={type.id}
                        href={`/items/${type.slug}`}
                        label={label}
                        // Type colors are dynamic data, so they can't be static Tailwind classes.
                        icon={<Icon style={{ color: type.color }} />}
                        badge={type.itemCount}
                      />
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <SidebarSeparator />

        <Collapsible defaultOpen>
          <SidebarGroup>
            <SidebarGroupLabel
              render={<CollapsibleTrigger />}
              className={GROUP_LABEL_CLASS}
            >
              Collections
              <ChevronDownIcon className={CHEVRON_CLASS} />
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <p className={SUBHEADING_CLASS}>Favorites</p>
                <SidebarMenu>
                  {favoriteCollections.map((collection) => (
                    <SidebarNavItem
                      key={collection.id}
                      href={`/collections/${collection.id}`}
                      label={collection.name}
                      icon={<FolderIcon />}
                      badge={
                        <StarIcon className="size-3.5 fill-yellow-400 text-yellow-400" />
                      }
                    />
                  ))}
                </SidebarMenu>

                <p className={SUBHEADING_CLASS}>Recent</p>
                <SidebarMenu>
                  {recentCollections.map((collection) => (
                    <SidebarNavItem
                      key={collection.id}
                      href={`/collections/${collection.id}`}
                      label={collection.name}
                      icon={<FolderIcon />}
                      badge={collection.itemCount}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarUser user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
