export type FavoriteSort = "date" | "name" | "type";

export const DEFAULT_FAVORITE_SORT: FavoriteSort = "date";

export const FAVORITE_SORT_OPTIONS = [
  { value: "date", label: "Date" },
  { value: "name", label: "Name" },
  { value: "type", label: "Type" },
] as const satisfies readonly { value: FavoriteSort; label: string }[];

export interface SortableFavorite {
  title: string;
  // null for an empty collection, which has no dominant type.
  typeName: string | null;
  // ISO date string.
  updatedAt: string;
}

// Case-insensitive, locale-aware and "item 2" before "item 10".
const collator = new Intl.Collator(undefined, {
  sensitivity: "base",
  numeric: true,
});

function byDateDesc(a: SortableFavorite, b: SortableFavorite) {
  return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
}

function byName(a: SortableFavorite, b: SortableFavorite) {
  return collator.compare(a.title, b.title);
}

// Entries without a type go last.
function byType(a: SortableFavorite, b: SortableFavorite) {
  if (a.typeName === b.typeName) return 0;
  if (a.typeName === null) return 1;
  if (b.typeName === null) return -1;
  return collator.compare(a.typeName, b.typeName);
}

const COMPARATORS: Record<
  FavoriteSort,
  (a: SortableFavorite, b: SortableFavorite) => number
> = {
  date: byDateDesc,
  name: (a, b) => byName(a, b) || byDateDesc(a, b),
  type: (a, b) => byType(a, b) || byDateDesc(a, b),
};

// Returns a new sorted array; ties keep their input order (Array#sort is stable).
export function sortFavorites<T extends SortableFavorite>(
  entries: readonly T[],
  sort: FavoriteSort,
): T[] {
  return [...entries].sort(COMPARATORS[sort]);
}

export function isFavoriteSort(value: unknown): value is FavoriteSort {
  return FAVORITE_SORT_OPTIONS.some((option) => option.value === value);
}

// Reads the `?sort=` search param; missing, repeated or unknown values give the default.
export function parseFavoriteSort(value: unknown): FavoriteSort {
  return isFavoriteSort(value) ? value : DEFAULT_FAVORITE_SORT;
}

// Remembers the last chosen sort, so links to a bare /favorites keep it.
export const FAVORITE_SORT_COOKIE = "favorites-sort";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// `document.cookie` value that saves the sort for a year.
export function getFavoriteSortCookie(sort: FavoriteSort): string {
  return `${FAVORITE_SORT_COOKIE}=${sort}; path=/favorites; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
}

// A valid `?sort=` wins, then the saved cookie, then the default.
export function resolveFavoriteSort(
  param: unknown,
  cookie: unknown,
): FavoriteSort {
  return isFavoriteSort(param) ? param : parseFavoriteSort(cookie);
}

// The same URL with `?sort=` set, or removed for the default sort.
export function getFavoriteSortHref(href: string, sort: FavoriteSort): string {
  const url = new URL(href);
  if (sort === DEFAULT_FAVORITE_SORT) {
    url.searchParams.delete("sort");
  } else {
    url.searchParams.set("sort", sort);
  }
  return `${url.pathname}${url.search}${url.hash}`;
}
