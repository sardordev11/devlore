export const ITEMS_PER_PAGE = 21;
export const COLLECTIONS_PER_PAGE = 21;
export const DASHBOARD_COLLECTIONS_LIMIT = 6;
export const DASHBOARD_RECENT_ITEMS_LIMIT = 10;

// Keeps the offset well inside Postgres/Prisma integer range for absurd ?page= values.
// Out-of-range pages are redirected to the last page by the caller anyway.
export const MAX_PAGE = 10_000;

export type PageToken = number | "ellipsis";

// Reads a 1-based page number from a search param. Anything that isn't a
// positive whole number falls back to page 1.
export function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d+$/.test(raw)) return 1;
  const page = Number(raw);
  if (page < 1) return 1;
  return Math.min(page, MAX_PAGE);
}

// Always at least one page, so an empty list still has a valid page 1.
export function getPageCount(total: number, perPage: number): number {
  return Math.max(1, Math.ceil(total / perPage));
}

export function getPageOffset(page: number, perPage: number): number {
  return (page - 1) * perPage;
}

// First, last and the pages around the current one, with ellipses for gaps.
// A gap of a single page shows that page instead of an ellipsis.
export function getPageNumbers(
  current: number,
  pageCount: number,
  siblings = 1,
): PageToken[] {
  const pages = new Set([1, pageCount]);
  for (let page = current - siblings; page <= current + siblings; page++) {
    if (page >= 1 && page <= pageCount) pages.add(page);
  }

  const tokens: PageToken[] = [];
  let previous = 0;
  for (const page of [...pages].sort((a, b) => a - b)) {
    if (page - previous === 2) tokens.push(previous + 1);
    else if (page - previous > 2) tokens.push("ellipsis");
    tokens.push(page);
    previous = page;
  }
  return tokens;
}

// Page 1 is the bare path so it matches the links that already point there.
export function getPageHref(pathname: string, page: number): string {
  return page <= 1 ? pathname : `${pathname}?page=${page}`;
}
