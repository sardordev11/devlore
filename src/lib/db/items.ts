import "server-only";

import { Prisma } from "@/generated/prisma/client";
import type { ContentType } from "@/generated/prisma/client";
import { getCopyValue } from "@/lib/copy-value";
import { isPrismaError, PRISMA_ERROR } from "@/lib/db/prisma-errors";
import {
  DASHBOARD_RECENT_ITEMS_LIMIT,
  getPageOffset,
  ITEMS_PER_PAGE,
} from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { getFileUrl } from "@/lib/r2";
import { getContentPreview } from "@/lib/search";
import type { CreateItemInput, UpdateItemInput } from "@/lib/validations/items";
import type { SearchItem } from "@/types/search";

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
  // Public R2 URL, used for image thumbnails.
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  // What the card's quick copy button puts on the clipboard.
  copyValue: string | null;
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
  fileSize: number | null;
  mimeType: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  type: ItemSummaryType & { slug: string };
  tags: string[];
  collections: { id: string; name: string }[];
}

export interface ItemFile {
  fileUrl: string;
  fileName: string;
  mimeType: string | null;
}

export interface ItemTypeListing {
  type: {
    name: string;
    slug: string;
    icon: string;
    color: string;
  };
  items: ItemSummary[];
  // All of the type's items, not just this page.
  total: number;
}

export interface ItemPage {
  items: ItemSummary[];
  total: number;
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
  fileUrl: true,
  fileName: true,
  fileSize: true,
  contentType: true,
  content: true,
  url: true,
  type: { select: { id: true, name: true, icon: true, color: true } },
  tags: { select: { name: true }, orderBy: { name: "asc" } },
} satisfies Prisma.ItemSelect;

// Most recently used first; never-used items fall back to newest updates.
const RECENT_ORDER = [
  { lastUsedAt: { sort: "desc", nulls: "last" } },
  { updatedAt: "desc" },
] satisfies Prisma.ItemOrderByWithRelationInput[];

// Pinned items stay at the top; id breaks ties so pages never overlap or skip rows.
const LISTING_ORDER = [
  { isPinned: "desc" },
  ...RECENT_ORDER,
  { id: "asc" },
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
  fileSize: true,
  mimeType: true,
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

function toItemSummary({
  tags,
  contentType,
  content,
  url,
  ...item
}: ItemRow): ItemSummary {
  return {
    ...item,
    copyValue: getCopyValue({
      contentType,
      content,
      url,
      fileUrl: item.fileUrl,
    }),
    tags: tags.map((tag) => tag.name),
  };
}

function toItemDetail({
  tags,
  collections,
  ...item
}: ItemDetailRow): ItemDetail {
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
  limit = DASHBOARD_RECENT_ITEMS_LIMIT,
): Promise<ItemSummary[]> {
  const items = await prisma.item.findMany({
    where: { userId },
    orderBy: RECENT_ORDER,
    take: limit,
    select: ITEM_SUMMARY_SELECT,
  });

  return items.map(toItemSummary);
}

// One page of the user's items matching `where`, plus the total count.
async function getItemPage(
  where: Prisma.ItemWhereInput,
  page: number,
): Promise<ItemPage> {
  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where,
      orderBy: LISTING_ORDER,
      skip: getPageOffset(page, ITEMS_PER_PAGE),
      take: ITEMS_PER_PAGE,
      select: ITEM_SUMMARY_SELECT,
    }),
    prisma.item.count({ where }),
  ]);

  return { items: items.map(toItemSummary), total };
}

// One page of the user's items of a type, pinned first then most recently used.
// Returns null when no system type or custom type of this user has the slug.
export async function getItemsByTypeSlug(
  userId: string,
  slug: string,
  page = 1,
): Promise<ItemTypeListing | null> {
  const found = await prisma.itemType.findFirst({
    where: { slug, OR: [{ isSystem: true }, { userId }] },
    // A system type wins if a custom type reuses its slug.
    orderBy: { isSystem: "desc" },
    select: { id: true, name: true, slug: true, icon: true, color: true },
  });
  if (!found) return null;

  const { id: typeId, ...type } = found;
  return { type, ...(await getItemPage({ userId, typeId }, page)) };
}

// One page of the user's items in a collection, pinned first then most recently used.
export async function getItemsByCollection(
  userId: string,
  collectionId: string,
  page = 1,
): Promise<ItemPage> {
  return getItemPage(
    { userId, collections: { some: { collectionId } } },
    page,
  );
}

export interface FavoriteItem {
  id: string;
  title: string;
  updatedAt: Date;
  type: ItemSummaryType;
}

// Every favorite item of the user, most recently updated first (there's no favoritedAt).
export async function getFavoriteItems(userId: string): Promise<FavoriteItem[]> {
  return prisma.item.findMany({
    where: { userId, isFavorite: true },
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    select: {
      id: true,
      title: true,
      updatedAt: true,
      type: { select: { id: true, name: true, icon: true, color: true } },
    },
  });
}

// Every item of the user for the command palette, most recently used first.
export async function getSearchItems(userId: string): Promise<SearchItem[]> {
  const items = await prisma.item.findMany({
    where: { userId },
    orderBy: RECENT_ORDER,
    select: {
      id: true,
      title: true,
      contentType: true,
      content: true,
      url: true,
      fileName: true,
      type: { select: { name: true, icon: true, color: true } },
    },
  });

  return items.map(({ id, title, type, ...source }) => ({
    id,
    title,
    preview: getContentPreview(source),
    type,
  }));
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

// Returns null when the item has no file, doesn't exist or belongs to another user.
export async function getItemFile(
  userId: string,
  itemId: string,
): Promise<ItemFile | null> {
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId, contentType: "FILE" },
    select: { fileUrl: true, fileName: true, mimeType: true },
  });
  if (!item?.fileUrl || !item.fileName) return null;

  return {
    fileUrl: item.fileUrl,
    fileName: item.fileName,
    mimeType: item.mimeType,
  };
}

function connectOrCreateTags(userId: string, tags: string[]) {
  return tags.map((name) => ({
    where: { userId_name: { userId, name } },
    create: { name, userId },
  }));
}

// True when one of the user's items already stores this uploaded file.
export async function isFileKeyInUse(userId: string, key: string): Promise<boolean> {
  const item = await prisma.item.findFirst({
    where: { userId, fileUrl: getFileUrl(key) },
    select: { id: true },
  });
  return item !== null;
}

// Creates an item of a system type, connecting the user's existing tags or creating new ones.
// An uploaded file is stored by its public R2 URL. Returns null when no system type has the slug.
export async function createItem(
  userId: string,
  { type: slug, tags, file, collectionIds, ...fields }: CreateItemInput,
): Promise<ItemDetail | null> {
  const type = await prisma.itemType.findFirst({
    where: { slug, isSystem: true },
    select: { id: true, contentType: true },
  });
  if (!type) return null;

  const item = await prisma.item.create({
    data: {
      ...fields,
      ...(file && {
        fileUrl: getFileUrl(file.key),
        fileName: file.fileName,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
      }),
      contentType: type.contentType,
      userId,
      typeId: type.id,
      tags: { connectOrCreate: connectOrCreateTags(userId, tags) },
      collections: {
        create: collectionIds.map((collectionId) => ({ collectionId })),
      },
    },
    select: ITEM_DETAIL_SELECT,
  });
  return toItemDetail(item);
}

// Keeps links to collections still selected (and their addedAt), removes the rest
// and adds the new ones. The caller checks that the collections belong to the user.
function setItemCollections(itemId: string, collectionIds: string[]) {
  return {
    deleteMany: { collectionId: { notIn: collectionIds } },
    connectOrCreate: collectionIds.map((collectionId) => ({
      where: { itemId_collectionId: { itemId, collectionId } },
      create: { collectionId },
    })),
  } satisfies Prisma.ItemCollectionUpdateManyWithoutItemNestedInput;
}

// Replaces the item's tags with `data.tags`, creating any the user doesn't have yet,
// and its collections with `data.collectionIds` when given.
// Returns null when the item doesn't exist or belongs to another user.
export async function updateItem(
  userId: string,
  itemId: string,
  { tags, collectionIds, ...fields }: UpdateItemInput,
): Promise<ItemDetail | null> {
  try {
    const item = await prisma.item.update({
      // userId in the where makes the ownership check part of the update.
      where: { id: itemId, userId },
      data: {
        ...fields,
        tags: {
          set: [],
          connectOrCreate: connectOrCreateTags(userId, tags),
        },
        ...(collectionIds && {
          collections: setItemCollections(itemId, collectionIds),
        }),
      },
      select: ITEM_DETAIL_SELECT,
    });
    return toItemDetail(item);
  } catch (error) {
    if (isPrismaError(error, PRISMA_ERROR.notFound)) return null;
    throw error;
  }
}

// Sets an explicit value so repeated or out-of-order requests can't flip it the wrong way.
// Returns null when the item doesn't exist or belongs to another user.
export async function setItemFavorite(
  userId: string,
  itemId: string,
  isFavorite: boolean,
): Promise<{ id: string; isFavorite: boolean } | null> {
  try {
    return await prisma.item.update({
      where: { id: itemId, userId },
      data: { isFavorite },
      select: { id: true, isFavorite: true },
    });
  } catch (error) {
    if (isPrismaError(error, PRISMA_ERROR.notFound)) return null;
    throw error;
  }
}

// Returns the deleted item's file URL (if any) so the caller can remove the file,
// or null when the item doesn't exist or belongs to another user.
// Collection links cascade; tags are left in place.
export async function deleteItem(
  userId: string,
  itemId: string,
): Promise<{ fileUrl: string | null } | null> {
  try {
    return await prisma.item.delete({
      where: { id: itemId, userId },
      select: { fileUrl: true },
    });
  } catch (error) {
    if (isPrismaError(error, PRISMA_ERROR.notFound)) return null;
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
