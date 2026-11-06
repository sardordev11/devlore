import "server-only";

import { prisma } from "@/lib/prisma";

export interface AccountSettings {
  // OAuth-only users have no password to change.
  hasPassword: boolean;
}

export async function getAccountSettings(
  userId: string,
): Promise<AccountSettings | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user) return null;

  return { hasPassword: user.passwordHash !== null };
}
