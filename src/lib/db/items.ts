import "server-only";

import { Prisma } from "@/generated/prisma/client";
import type { ContentType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { UpdateItemInput } from "@/lib/validations/items";

interface ItemSummaryType {
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

export interface ItemDetail {
  id: string;
  title: string;
  description: string | null;
  contentType: ContentType;
  content: string | null;
  language: string | null;
  url: string | null;
  fileUrl: string | null;
  fileName: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  type: ItemSummaryType & { slug: string };
  tags: string[];
  collections: { id: string; name: string }[];
}

export interface ItemTypeListing {
  type: {
    name: string;
    slug: string;
    icon: string;
    color: string;
  };
  items: ItemSummary[];
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

const ITEM_DETAIL_SELECT = {
  id: true,
  title: true,
  description: true,
  contentType: true,
  content: true,
  language: true,
  url: true,
  fileUrl: true,
  fileName: true,
  isFavorite: true,
  isPinned: true,
  createdAt: true,
  updatedAt: true,
  type: {
    select: { id: true, name: true, slug: true, icon: true, color: true },
  },
  tags: { select: { name: true }, orderBy: { name: "asc" } },
  collections: {
    select: { collection: { select: { id: true, name: true } } },
    orderBy: { collection: { name: "asc" } },
  },
} satisfies Prisma.ItemSelect;

type ItemRow = Prisma.ItemGetPayload<{ select: typeof ITEM_SUMMARY_SELECT }>;

type ItemDetailRow = Prisma.ItemGetPayload<{
  select: typeof ITEM_DETAIL_SELECT;
}>;

function toItemSummary({ tags, ...item }: ItemRow): ItemSummary {
  return { ...item, tags: tags.map((tag) => tag.name) };
}

function toItemDetail({ tags, collections, ...item }: ItemDetailRow): ItemDetail {
  return {
    ...item,
    tags: tags.map((tag) => tag.name),
    collections: collections.map(({ collection }) => collection),
  };
}

export async function getPinnedItems(userId: string): Promise<ItemSummary[]> {
  const items = await prisma.item.findMany({
    where: { userId, isPinned: true },
    orderBy: RECENT_ORDER,
    select: ITEM_SUMMARY_SELECT,
  });

  return items.map(toItemSummary);
}

export async function getRecentItems(
  userId: string,
  limit = 10,
): Promise<ItemSummary[]> {
  const items = await prisma.item.findMany({
    where: { userId },
    orderBy: RECENT_ORDER,
    take: limit,
    select: ITEM_SUMMARY_SELECT,
  });

  return items.map(toItemSummary);
}

// Returns null when no system type or custom type of this user has the slug.
export async function getItemsByTypeSlug(
  userId: string,
  slug: string,
): Promise<ItemTypeListing | null> {
  const found = await prisma.itemType.findFirst({
    where: { slug, OR: [{ isSystem: true }, { userId }] },
    // A system type wins if a custom type reuses its slug.
    orderBy: { isSystem: "desc" },
    select: { id: true, name: true, slug: true, icon: true, color: true },
  });
  if (!found) return null;

  const { id: typeId, ...type } = found;
  const items = await prisma.item.findMany({
    where: { userId, typeId },
    // Pinned items stay at the top.
    orderBy: [{ isPinned: "desc" }, ...RECENT_ORDER],
    select: ITEM_SUMMARY_SELECT,
  });

  return { type, items: items.map(toItemSummary) };
}

// Returns null when the item doesn't exist or belongs to another user.
export async function getItemDetail(
  userId: string,
  itemId: string,
): Promise<ItemDetail | null> {
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: ITEM_DETAIL_SELECT,
  });

  return item ? toItemDetail(item) : null;
}

// Replaces the item's tags with `data.tags`, creating any the user doesn't have yet.
// Returns null when the item doesn't exist or belongs to another user.
export async function updateItem(
  userId: string,
  itemId: string,
  { tags, ...fields }: UpdateItemInput,
): Promise<ItemDetail | null> {
  try {
    const item = await prisma.item.update({
      // userId in the where makes the ownership check part of the update.
      where: { id: itemId, userId },
      data: {
        ...fields,
        tags: {
          set: [],
          connectOrCreate: tags.map((name) => ({
            where: { userId_name: { userId, name } },
            create: { name, userId },
          })),
        },
      },
      select: ITEM_DETAIL_SELECT,
    });
    return toItemDetail(item);
  } catch (error) {
    // P2025: no record matched the where.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return null;
    }
    throw error;
  }
}

// Returns false when the item doesn't exist or belongs to another user.
// Collection links cascade; tags are left in place.
export async function deleteItem(
  userId: string,
  itemId: string,
): Promise<boolean> {
  try {
    await prisma.item.delete({
      where: { id: itemId, userId },
      select: { id: true },
    });
    return true;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return false;
    }
    throw error;
  }
}

export async function getItemStats(userId: string): Promise<ItemStats> {
  const groups = await prisma.item.groupBy({
    by: ["isFavorite"],
    where: { userId },
    _count: { _all: true },
  });

  return {
    items: groups.reduce((sum, group) => sum + group._count._all, 0),
    favoriteItems: groups.find((group) => group.isFavorite)?._count._all ?? 0,
  };
}

export async function getSidebarItemTypes(
  userId: string,
): Promise<SidebarItemType[]> {
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
      _count: { select: { items: { where: { userId } } } },
    },
  });

  return types.map(({ _count, ...type }) => ({
    ...type,
    itemCount: _count.items,
  }));
}
