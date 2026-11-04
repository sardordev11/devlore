import { Prisma } from "@/generated/prisma/client";

export const PRISMA_ERROR = {
  // A unique constraint failed, e.g. a duplicate email.
  uniqueConstraint: "P2002",
  // No record matched the where of an update or delete.
  notFound: "P2025",
} as const;

type PrismaErrorCode = (typeof PRISMA_ERROR)[keyof typeof PRISMA_ERROR];

export function isPrismaError(error: unknown, code: PrismaErrorCode): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
  );
}
