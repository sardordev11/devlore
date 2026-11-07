import { describe, expect, it } from "vitest";

import {
  getFavoriteSortCookie,
  getFavoriteSortHref,
  isFavoriteSort,
  parseFavoriteSort,
  resolveFavoriteSort,
  sortFavorites,
  type SortableFavorite,
} from "@/lib/favorites-sort";

function entry(
  title: string,
  typeName: string | null,
  updatedAt: string,
): SortableFavorite {
  return { title, typeName, updatedAt };
}

const titles = (entries: SortableFavorite[]) => entries.map((e) => e.title);

describe("sortFavorites", () => {
  const entries = [
    entry("beta", "snippet", "2026-01-02T00:00:00.000Z"),
    entry("Alpha", "prompt", "2026-01-01T00:00:00.000Z"),
    entry("gamma", "snippet", "2026-01-03T00:00:00.000Z"),
    entry("delta", null, "2026-01-04T00:00:00.000Z"),
  ];

  it("sorts by date, newest first", () => {
    expect(titles(sortFavorites(entries, "date"))).toEqual([
      "delta",
      "gamma",
      "beta",
      "Alpha",
    ]);
  });

  it("sorts by name A–Z, ignoring case", () => {
    expect(titles(sortFavorites(entries, "name"))).toEqual([
      "Alpha",
      "beta",
      "delta",
      "gamma",
    ]);
  });

  it("sorts numbers in names naturally", () => {
    const numbered = [
      entry("item 10", "note", "2026-01-01T00:00:00.000Z"),
      entry("item 2", "note", "2026-01-01T00:00:00.000Z"),
    ];
    expect(titles(sortFavorites(numbered, "name"))).toEqual(["item 2", "item 10"]);
  });

  it("breaks name ties by date, newest first", () => {
    const sameName = [
      entry("same", "note", "2026-01-01T00:00:00.000Z"),
      entry("Same", "link", "2026-02-01T00:00:00.000Z"),
    ];
    expect(sortFavorites(sameName, "name").map((e) => e.typeName)).toEqual([
      "link",
      "note",
    ]);
  });

  it("groups by type name, newest first within a type, untyped last", () => {
    expect(titles(sortFavorites(entries, "type"))).toEqual([
      "Alpha",
      "gamma",
      "beta",
      "delta",
    ]);
  });

  it("keeps the input order for full ties", () => {
    const tied = [
      entry("a", "note", "2026-01-01T00:00:00.000Z"),
      entry("b", "note", "2026-01-01T00:00:00.000Z"),
    ];
    expect(titles(sortFavorites(tied, "date"))).toEqual(["a", "b"]);
  });

  it("does not mutate the input", () => {
    const copy = [...entries];
    sortFavorites(entries, "name");
    expect(entries).toEqual(copy);
  });
});

describe("isFavoriteSort", () => {
  it("accepts the known sorts only", () => {
    expect(isFavoriteSort("date")).toBe(true);
    expect(isFavoriteSort("name")).toBe(true);
    expect(isFavoriteSort("type")).toBe(true);
    expect(isFavoriteSort("size")).toBe(false);
    expect(isFavoriteSort(null)).toBe(false);
  });
});

describe("parseFavoriteSort", () => {
  it("returns a known sort as is", () => {
    expect(parseFavoriteSort("name")).toBe("name");
    expect(parseFavoriteSort("type")).toBe("type");
  });

  it("falls back to date for missing, repeated or unknown values", () => {
    expect(parseFavoriteSort(undefined)).toBe("date");
    expect(parseFavoriteSort(["name", "type"])).toBe("date");
    expect(parseFavoriteSort("size")).toBe("date");
  });
});

describe("getFavoriteSortHref", () => {
  const base = "http://localhost:3000/favorites";

  it("sets the sort param", () => {
    expect(getFavoriteSortHref(base, "name")).toBe("/favorites?sort=name");
  });

  it("replaces an existing sort and keeps other params", () => {
    expect(getFavoriteSortHref(`${base}?sort=name&x=1`, "type")).toBe(
      "/favorites?sort=type&x=1",
    );
  });

  it("removes the param for the default sort", () => {
    expect(getFavoriteSortHref(`${base}?sort=name`, "date")).toBe("/favorites");
  });
});

describe("resolveFavoriteSort", () => {
  it("prefers a valid search param over the cookie", () => {
    expect(resolveFavoriteSort("name", "type")).toBe("name");
  });

  it("uses the cookie when the param is missing or invalid", () => {
    expect(resolveFavoriteSort(undefined, "type")).toBe("type");
    expect(resolveFavoriteSort("size", "type")).toBe("type");
  });

  it("falls back to date when neither is valid", () => {
    expect(resolveFavoriteSort(undefined, undefined)).toBe("date");
    expect(resolveFavoriteSort("size", "bogus")).toBe("date");
  });
});

describe("getFavoriteSortCookie", () => {
  it("saves the sort for a year on the favorites path", () => {
    expect(getFavoriteSortCookie("name")).toBe(
      "favorites-sort=name; path=/favorites; max-age=31536000; samesite=lax",
    );
  });
});
