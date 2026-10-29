// Run with: npm run db:delete-users            (dry run, prints what would go)
//           npm run db:delete-users -- --confirm (actually deletes)
// Deletes every user except the demo user, along with their items, custom
// types, collections, tags, accounts, sessions and verification tokens.
// System item types and the demo user's data are left untouched.
import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

// src/lib/prisma.ts is "server-only", so the script builds its own client
const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

const DEMO_EMAIL = "demo@devlore.io";
const CONFIRM = process.argv.includes("--confirm");

function databaseHost() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return new URL(url).host;
}

async function main() {
  console.log(`Database: ${databaseHost()}`);

  const demo = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    select: { id: true },
  });
  if (!demo) throw new Error(`Demo user ${DEMO_EMAIL} not found, aborting`);

  const users = await prisma.user.findMany({
    where: { id: { not: demo.id } },
    select: {
      id: true,
      email: true,
      name: true,
      _count: {
        select: { items: true, collections: true, itemTypes: true, tags: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  const tokens = await prisma.verificationToken.count({
    where: { identifier: { not: DEMO_EMAIL } },
  });

  if (users.length === 0 && tokens === 0) {
    console.log("✓ Nothing to delete, only the demo user exists");
    return;
  }

  console.table(
    users.map(({ email, name, _count }) => ({ email, name, ..._count })),
  );
  console.log(`Verification tokens: ${tokens}`);

  if (!CONFIRM) {
    console.log("\nDry run. Re-run with --confirm to delete the above.");
    return;
  }

  const userIds = users.map((user) => user.id);
  // Items go first: Item.typeId is ON DELETE RESTRICT, so cascading a user's
  // custom types before their items could fail
  const [deletedTokens, deletedItems, deletedUsers] = await prisma.$transaction([
    prisma.verificationToken.deleteMany({
      where: { identifier: { not: DEMO_EMAIL } },
    }),
    prisma.item.deleteMany({ where: { userId: { in: userIds } } }),
    prisma.user.deleteMany({ where: { id: { in: userIds } } }),
  ]);

  console.log(
    `✓ Deleted ${deletedUsers.count} users, ${deletedItems.count} items ` +
      `and ${deletedTokens.count} verification tokens`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("✗ Delete users failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
