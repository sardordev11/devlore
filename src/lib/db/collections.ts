import "server-only";

import { prisma } from "@/lib/prisma";

// No auth yet, so dashboard data is scoped to the seeded demo user.
const DEMO_USER_EMAIL = "demo@devlore.io";

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

function demoUserFilter() {
  return { user: { email: DEMO_USER_EMAIL } };
}

export async function getRecentCollections(
  limit = 6,
): Promise<CollectionSummary[]> {
  const collections = await prisma.collection.findMany({
    where: demoUserFilter(),
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      defaultType: true,
      items: {
        select: {
          item: {
            select: {
              type: {
                select: { id: true, name: true, icon: true, color: true },
              },
            },
          },
        },
      },
    },
  });

  return collections.map((collection) => {
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
      const { id, name, icon, color } = collection.defaultType;
      types.push({ id, name, icon, color, itemCount: 0 });
    }

    return {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      isFavorite: collection.isFavorite,
      itemCount: collection.items.length,
      types,
    };
  });
}

export async function getCollectionStats(): Promise<CollectionStats> {
  const where = demoUserFilter();
  const [collections, favoriteCollections] = await Promise.all([
    prisma.collection.count({ where }),
    prisma.collection.count({ where: { ...where, isFavorite: true } }),
  ]);

  return { collections, favoriteCollections };
}
