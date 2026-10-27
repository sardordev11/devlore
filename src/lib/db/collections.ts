import "server-only";

import { Prisma } from "@/generated/prisma/client";
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
  // Color of the dominant type, used for card borders and sidebar dots.
  accentColor: string | null;
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
  _count: { select: { items: true } },
} satisfies Prisma.CollectionInclude;

type CollectionRow = Prisma.CollectionGetPayload<{
  include: typeof COLLECTION_SUMMARY_INCLUDE;
}>;

interface CollectionTypeCountRow extends CollectionType {
  collectionId: string;
}

// Per-collection type counts in one grouped query, ordered by item count.
async function getCollectionTypes(
  collectionIds: string[],
): Promise<Map<string, CollectionType[]>> {
  const typesByCollection = new Map<string, CollectionType[]>();
  if (collectionIds.length === 0) return typesByCollection;

  const rows = await prisma.$queryRaw<CollectionTypeCountRow[]>`
    SELECT ic."collectionId", t."id", t."name", t."icon", t."color",
      COUNT(*)::int AS "itemCount"
    FROM "ItemCollection" ic
    JOIN "Item" i ON i."id" = ic."itemId"
    JOIN "ItemType" t ON t."id" = i."typeId"
    WHERE ic."collectionId" IN (${Prisma.join(collectionIds)})
    GROUP BY ic."collectionId", t."id"
    ORDER BY "itemCount" DESC, t."name" ASC
  `;

  for (const { collectionId, ...type } of rows) {
    const types = typesByCollection.get(collectionId) ?? [];
    types.push(type);
    typesByCollection.set(collectionId, types);
  }

  return typesByCollection;
}

function toCollectionSummary(
  collection: CollectionRow,
  typesByCollection: Map<string, CollectionType[]>,
): CollectionSummary {
  const types = typesByCollection.get(collection.id) ?? [];
  // Empty collections fall back to their default type for styling.
  if (types.length === 0 && collection.defaultType) {
    types.push({ ...collection.defaultType, itemCount: 0 });
  }

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    isFavorite: collection.isFavorite,
    itemCount: collection._count.items,
    accentColor: types[0]?.color ?? null,
    types,
  };
}

async function toCollectionSummaries(
  ...groups: CollectionRow[][]
): Promise<CollectionSummary[][]> {
  const typesByCollection = await getCollectionTypes(
    groups.flat().map((collection) => collection.id),
  );

  return groups.map((collections) =>
    collections.map((collection) =>
      toCollectionSummary(collection, typesByCollection),
    ),
  );
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

  const [recents] = await toCollectionSummaries(collections);
  return recents;
}

export async function getSidebarCollections(
  recentLimit = 5,
): Promise<SidebarCollections> {
  const where = demoUserFilter();
  const [favoriteRows, recentRows] = await Promise.all([
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

  const [favorites, recents] = await toCollectionSummaries(
    favoriteRows,
    recentRows,
  );
  return { favorites, recents };
}

export async function getCollectionStats(): Promise<CollectionStats> {
  const groups = await prisma.collection.groupBy({
    by: ["isFavorite"],
    where: demoUserFilter(),
    _count: { _all: true },
  });

  return {
    collections: groups.reduce((sum, group) => sum + group._count._all, 0),
    favoriteCollections:
      groups.find((group) => group.isFavorite)?._count._all ?? 0,
  };
}
