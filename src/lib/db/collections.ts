import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { isPrismaError, PRISMA_ERROR } from "@/lib/db/prisma-errors";
import {
  COLLECTIONS_PER_PAGE,
  DASHBOARD_COLLECTIONS_LIMIT,
  getPageOffset,
} from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import type {
  CreateCollectionInput,
  UpdateCollectionInput,
} from "@/lib/validations/collections";

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

export interface CollectionPage {
  collections: CollectionSummary[];
  total: number;
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
  userId: string,
  limit = DASHBOARD_COLLECTIONS_LIMIT,
): Promise<CollectionSummary[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: COLLECTION_SUMMARY_INCLUDE,
  });

  const [recents] = await toCollectionSummaries(collections);
  return recents;
}

export async function getSidebarCollections(
  userId: string,
  recentLimit = 5,
): Promise<SidebarCollections> {
  const [favoriteRows, recentRows] = await Promise.all([
    prisma.collection.findMany({
      where: { userId, isFavorite: true },
      orderBy: { name: "asc" },
      include: COLLECTION_SUMMARY_INCLUDE,
    }),
    prisma.collection.findMany({
      where: { userId, isFavorite: false },
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

// Favorites first, then most recently updated; id breaks ties so pages never overlap.
const LISTING_ORDER = [
  { isFavorite: "desc" },
  { updatedAt: "desc" },
  { id: "asc" },
] satisfies Prisma.CollectionOrderByWithRelationInput[];

// Every collection of the user for the command palette, favorites first.
export async function getAllCollections(
  userId: string,
): Promise<CollectionSummary[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: LISTING_ORDER,
    include: COLLECTION_SUMMARY_INCLUDE,
  });

  const [all] = await toCollectionSummaries(collections);
  return all;
}

// One page of the user's collections for /collections, plus the total count.
export async function getCollectionsPage(
  userId: string,
  page = 1,
): Promise<CollectionPage> {
  const where = { userId };
  const [rows, total] = await Promise.all([
    prisma.collection.findMany({
      where,
      orderBy: LISTING_ORDER,
      skip: getPageOffset(page, COLLECTIONS_PER_PAGE),
      take: COLLECTIONS_PER_PAGE,
      include: COLLECTION_SUMMARY_INCLUDE,
    }),
    prisma.collection.count({ where }),
  ]);

  const [collections] = await toCollectionSummaries(rows);
  return { collections, total };
}

// Returns null when the collection doesn't exist or belongs to another user.
export async function getCollection(
  userId: string,
  collectionId: string,
): Promise<CollectionSummary | null> {
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    include: COLLECTION_SUMMARY_INCLUDE,
  });
  if (!collection) return null;

  const [[summary]] = await toCollectionSummaries([collection]);
  return summary;
}

export interface CreatedCollection {
  id: string;
  name: string;
  description: string | null;
}

export async function createCollection(
  userId: string,
  input: CreateCollectionInput,
): Promise<CreatedCollection> {
  return prisma.collection.create({
    data: { userId, name: input.name, description: input.description },
    select: { id: true, name: true, description: true },
  });
}

// Returns null when the collection doesn't exist or belongs to another user.
export async function updateCollection(
  userId: string,
  collectionId: string,
  input: UpdateCollectionInput,
): Promise<CreatedCollection | null> {
  try {
    return await prisma.collection.update({
      where: { id: collectionId, userId },
      data: { name: input.name, description: input.description },
      select: { id: true, name: true, description: true },
    });
  } catch (error) {
    if (isPrismaError(error, PRISMA_ERROR.notFound)) return null;
    throw error;
  }
}

// Deletes only the collection. Its ItemCollection links cascade, the items stay.
// Returns null when the collection doesn't exist or belongs to another user.
export async function deleteCollection(
  userId: string,
  collectionId: string,
): Promise<{ id: string } | null> {
  try {
    return await prisma.collection.delete({
      where: { id: collectionId, userId },
      select: { id: true },
    });
  } catch (error) {
    if (isPrismaError(error, PRISMA_ERROR.notFound)) return null;
    throw error;
  }
}

export interface CollectionOption {
  id: string;
  name: string;
}

// The user's collections for the item form's collection picker.
export async function getCollectionOptions(
  userId: string,
): Promise<CollectionOption[]> {
  return prisma.collection.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

// True when every id is one of the user's collections. Expects deduped ids.
export async function ownsCollections(
  userId: string,
  collectionIds: string[],
): Promise<boolean> {
  if (collectionIds.length === 0) return true;
  const owned = await prisma.collection.count({
    where: { userId, id: { in: collectionIds } },
  });
  return owned === collectionIds.length;
}

export async function getCollectionStats(
  userId: string,
): Promise<CollectionStats> {
  const groups = await prisma.collection.groupBy({
    by: ["isFavorite"],
    where: { userId },
    _count: { _all: true },
  });

  return {
    collections: groups.reduce((sum, group) => sum + group._count._all, 0),
    favoriteCollections:
      groups.find((group) => group.isFavorite)?._count._all ?? 0,
  };
}
