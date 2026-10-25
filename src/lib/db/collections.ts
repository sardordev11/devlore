import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { demoUserFilter } from "@/lib/db/demo-user";
import { prisma } from "@/lib/prisma";

export interface CollectionType {
  id: string;
  name: string;
  icon: string;
  color: string;
  itemCount: number;
}

export interface CollectionSummary {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  itemCount: number;
  // Ordered by item count, so the first one is the dominant type.
  types: CollectionType[];
}

export interface CollectionStats {
  collections: number;
  favoriteCollections: number;
}

export interface SidebarCollections {
  favorites: CollectionSummary[];
  recents: CollectionSummary[];
}

const TYPE_SELECT = {
  select: { id: true, name: true, icon: true, color: true },
} satisfies Prisma.ItemTypeDefaultArgs;

const COLLECTION_SUMMARY_INCLUDE = {
  defaultType: TYPE_SELECT,
  items: { select: { item: { select: { type: TYPE_SELECT } } } },
} satisfies Prisma.CollectionInclude;

type CollectionRow = Prisma.CollectionGetPayload<{
  include: typeof COLLECTION_SUMMARY_INCLUDE;
}>;

function toCollectionSummary(collection: CollectionRow): CollectionSummary {
  const typesById = new Map<string, CollectionType>();
  for (const { item } of collection.items) {
    const existing = typesById.get(item.type.id);
    if (existing) {
      existing.itemCount += 1;
    } else {
      typesById.set(item.type.id, { ...item.type, itemCount: 1 });
    }
  }

  const types = [...typesById.values()].sort(
    (a, b) => b.itemCount - a.itemCount,
  );
  // Empty collections fall back to their default type for styling.
  if (types.length === 0 && collection.defaultType) {
    types.push({ ...collection.defaultType, itemCount: 0 });
  }

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    isFavorite: collection.isFavorite,
    itemCount: collection.items.length,
    types,
  };
}

export async function getRecentCollections(
  limit = 6,
): Promise<CollectionSummary[]> {
  const collections = await prisma.collection.findMany({
    where: demoUserFilter(),
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: COLLECTION_SUMMARY_INCLUDE,
  });

  return collections.map(toCollectionSummary);
}

export async function getSidebarCollections(
  recentLimit = 5,
): Promise<SidebarCollections> {
  const where = demoUserFilter();
  const [favorites, recents] = await Promise.all([
    prisma.collection.findMany({
      where: { ...where, isFavorite: true },
      orderBy: { name: "asc" },
      include: COLLECTION_SUMMARY_INCLUDE,
    }),
    prisma.collection.findMany({
      where: { ...where, isFavorite: false },
      orderBy: { updatedAt: "desc" },
      take: recentLimit,
      include: COLLECTION_SUMMARY_INCLUDE,
    }),
  ]);

  return {
    favorites: favorites.map(toCollectionSummary),
    recents: recents.map(toCollectionSummary),
  };
}

export async function getCollectionStats(): Promise<CollectionStats> {
  const where = demoUserFilter();
  const [collections, favoriteCollections] = await Promise.all([
    prisma.collection.count({ where }),
    prisma.collection.count({ where: { ...where, isFavorite: true } }),
  ]);

  return { collections, favoriteCollections };
}
