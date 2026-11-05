import { describe, expect, it, vi } from "vitest";

import { createCollection } from "@/lib/db/collections";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: { collection: { create: vi.fn() } },
}));

const mockPrisma = vi.mocked(prisma, { deep: true });

describe("createCollection", () => {
  it("creates the collection for the given user", async () => {
    const created = { id: "col-1", name: "React Patterns", description: null };
    mockPrisma.collection.create.mockResolvedValue(created as never);

    const result = await createCollection("user-1", {
      name: "React Patterns",
      description: null,
    });

    expect(result).toEqual(created);
    expect(mockPrisma.collection.create).toHaveBeenCalledWith({
      data: { userId: "user-1", name: "React Patterns", description: null },
      select: { id: true, name: true, description: true },
    });
  });
});
