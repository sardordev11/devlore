import "server-only";

import { prisma } from "@/lib/prisma";

// No auth yet, so dashboard data is scoped to the seeded demo user.
const DEMO_USER_EMAIL = "demo@devlore.io";

export interface DemoUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

export function demoUserFilter() {
  return { user: { email: DEMO_USER_EMAIL } };
}

export async function getDemoUser(): Promise<DemoUser | null> {
  return prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
    select: { id: true, name: true, email: true, image: true },
  });
}
