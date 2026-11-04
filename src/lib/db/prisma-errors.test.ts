import { describe, expect, it } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import { isPrismaError, PRISMA_ERROR } from "@/lib/db/prisma-errors";

function knownError(code: string) {
  return new Prisma.PrismaClientKnownRequestError("failed", {
    code,
    clientVersion: "7.0.0",
  });
}

describe("isPrismaError", () => {
  it("matches a known request error with the same code", () => {
    expect(isPrismaError(knownError("P2025"), PRISMA_ERROR.notFound)).toBe(true);
    expect(isPrismaError(knownError("P2002"), PRISMA_ERROR.uniqueConstraint)).toBe(
      true,
    );
  });

  it("rejects a different code", () => {
    expect(isPrismaError(knownError("P2002"), PRISMA_ERROR.notFound)).toBe(false);
  });

  it("rejects other errors and values", () => {
    expect(isPrismaError(new Error("P2025"), PRISMA_ERROR.notFound)).toBe(false);
    expect(isPrismaError({ code: "P2025" }, PRISMA_ERROR.notFound)).toBe(false);
    expect(isPrismaError(null, PRISMA_ERROR.notFound)).toBe(false);
  });
});
