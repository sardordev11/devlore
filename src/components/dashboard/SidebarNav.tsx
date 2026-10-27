import { ChevronDownIcon, FolderIcon, StarIcon } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";

import { SidebarNavItem } from "@/components/dashboard/SidebarNavItem";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { getSidebarCollections } from "@/lib/db/collections";
import { getSidebarItemTypes } from "@/lib/db/items";
import { getTypeIcon } from "@/lib/type-icons";

const SUBHEADING_CLASS =
  "px-2 pt-2 pb-1 text-xs font-medium text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden";

const GROUP_LABEL_CLASS = "tracking-wide uppercase";

const CHEVRON_CLASS = "ml-auto transition-transform in-data-panel-open:rotate-180";

export async function SidebarNav() {
  // User data must be fetched per request, not prerendered at build time.
  await connection();
  const [itemTypes, { favorites, recents }] = await Promise.all([
    getSidebarItemTypes(),
    getSidebarCollections(),
  ]);

  return (
    <>
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
                      isPro={type.isProOnly}
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
              {favorites.length > 0 && (
                <>
                  <p className={SUBHEADING_CLASS}>Favorites</p>
                  <SidebarMenu>
                    {favorites.map((collection) => (
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
                </>
              )}

              {recents.length > 0 && (
                <>
                  <p className={SUBHEADING_CLASS}>Recent</p>
                  <SidebarMenu>
                    {recents.map((collection) => (
                      <SidebarNavItem
                        key={collection.id}
                        href={`/collections/${collection.id}`}
                        label={collection.name}
                        // Types are ordered by item count, so the first one is the dominant type.
                        icon={
                          <span
                            className="m-1 size-2 shrink-0 rounded-full bg-muted-foreground"
                            style={{ backgroundColor: collection.types[0]?.color }}
                          />
                        }
                        badge={collection.itemCount}
                      />
                    ))}
                  </SidebarMenu>
                </>
              )}

              <Link
                href="/collections"
                className={`${SUBHEADING_CLASS} block transition-colors hover:text-sidebar-foreground`}
              >
                View all collections
              </Link>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    </>
  );
}
