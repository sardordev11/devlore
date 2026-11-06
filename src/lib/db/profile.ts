import "server-only";

import { prisma } from "@/lib/prisma";

export interface ProfileTypeCount {
  id: string;
  name: string;
  icon: string;
  color: string;
  itemCount: number;
}

export interface Profile {
  name: string | null;
  email: string;
  image: string | null;
  createdAt: Date;
  itemCount: number;
  collectionCount: number;
  types: ProfileTypeCount[];
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const [user, types] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        image: true,
        createdAt: true,
        _count: { select: { items: true, collections: true } },
      },
    }),
    prisma.itemType.findMany({
      where: { isSystem: true },
      // Seeded in display order.
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        icon: true,
        color: true,
        _count: { select: { items: { where: { userId } } } },
      },
    }),
  ]);
  if (!user) return null;

  const { _count, ...info } = user;
  return {
    ...info,
    itemCount: _count.items,
    collectionCount: _count.collections,
    types: types.map(({ _count, ...type }) => ({
      ...type,
      itemCount: _count.items,
    })),
  };
}
