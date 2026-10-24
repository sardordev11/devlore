// Derived dashboard data from the mock data. Replace with Prisma queries once the database is in place.

import {
  items,
  itemTypes,
  type MockItem,
  type MockItemType,
} from "@/lib/mock-data";

const RECENT_ITEMS_LIMIT = 10;

const itemTypesById = new Map(itemTypes.map((type) => [type.id, type]));

export function getItemType(typeId: string): MockItemType | undefined {
  return itemTypesById.get(typeId);
}

function byLastUsedDesc(a: MockItem, b: MockItem) {
  return (b.lastUsedAt ?? "").localeCompare(a.lastUsedAt ?? "");
}

export const dashboardStats = {
  // Type counts reflect the full item total; the mock items list is only a sample.
  items: itemTypes.reduce((total, type) => total + type.itemCount, 0),
  favoriteItems: items.filter((item) => item.isFavorite).length,
};

export const pinnedItems = items.filter((item) => item.isPinned).sort(byLastUsedDesc);

export const recentItems = [...items].sort(byLastUsedDesc).slice(0, RECENT_ITEMS_LIMIT);
