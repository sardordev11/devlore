import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { demoUserFilter } from "@/lib/db/demo-user";
import { prisma } from "@/lib/prisma";

export interface ItemSummaryType {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface ItemSummary {
  id: string;
  title: string;
  description: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  type: ItemSummaryType;
  tags: string[];
}

export interface ItemStats {
  items: number;
  favoriteItems: number;
}

export interface SidebarItemType {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  isProOnly: boolean;
  itemCount: number;
}

const ITEM_SUMMARY_SELECT = {
  id: true,
  title: true,
  description: true,
  isFavorite: true,
  isPinned: true,
  lastUsedAt: true,
  createdAt: true,
  type: { select: { id: true, name: true, icon: true, color: true } },
  tags: { select: { name: true }, orderBy: { name: "asc" } },
} satisfies Prisma.ItemSelect;

// Most recently used first; never-used items fall back to newest updates.
const RECENT_ORDER = [
  { lastUsedAt: { sort: "desc", nulls: "last" } },
  { updatedAt: "desc" },
] satisfies Prisma.ItemOrderByWithRelationInput[];

type ItemRow = Prisma.ItemGetPayload<{ select: typeof ITEM_SUMMARY_SELECT }>;

function toItemSummary({ tags, ...item }: ItemRow): ItemSummary {
  return { ...item, tags: tags.map((tag) => tag.name) };
}

export async function getPinnedItems(): Promise<ItemSummary[]> {
  const items = await prisma.item.findMany({
    where: { ...demoUserFilter(), isPinned: true },
    orderBy: RECENT_ORDER,
    select: ITEM_SUMMARY_SELECT,
  });

  return items.map(toItemSummary);
}

export async function getRecentItems(limit = 10): Promise<ItemSummary[]> {
  const items = await prisma.item.findMany({
    where: demoUserFilter(),
    orderBy: RECENT_ORDER,
    take: limit,
    select: ITEM_SUMMARY_SELECT,
  });

  return items.map(toItemSummary);
}

export async function getItemStats(): Promise<ItemStats> {
  const where = demoUserFilter();
  const [items, favoriteItems] = await Promise.all([
    prisma.item.count({ where }),
    prisma.item.count({ where: { ...where, isFavorite: true } }),
  ]);

  return { items, favoriteItems };
}

export async function getSidebarItemTypes(): Promise<SidebarItemType[]> {
  const types = await prisma.itemType.findMany({
    where: { isSystem: true },
    // Seeded in display order.
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      color: true,
      isProOnly: true,
      _count: { select: { items: { where: demoUserFilter() } } },
    },
  });

  return types.map(({ _count, ...type }) => ({
    ...type,
    itemCount: _count.items,
  }));
}
