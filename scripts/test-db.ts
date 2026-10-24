// Run with: npm run db:test
// Checks the connection, prints table counts and runs a create/read/delete
// round trip. All test data hangs off a temporary user and is removed at the end.
import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

// src/lib/prisma.ts is "server-only", so the script builds its own client
const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

async function checkConnection() {
  const [{ version }] = await prisma.$queryRaw<
    { version: string }[]
  >`SELECT version()`;
  console.log("✓ Connected:", version.split(" ").slice(0, 2).join(" "));
}

async function printCounts() {
  const [users, itemTypes, items, collections, tags] = await Promise.all([
    prisma.user.count(),
    prisma.itemType.count(),
    prisma.item.count(),
    prisma.collection.count(),
    prisma.tag.count(),
  ]);
  console.table({ users, itemTypes, items, collections, tags });
}

async function roundTrip() {
  const user = await prisma.user.create({
    data: { email: `test-db-${Date.now()}@devlore.test`, name: "DB Test" },
  });

  try {
    const type = await prisma.itemType.create({
      data: {
        name: "test",
        slug: "tests",
        icon: "Code",
        color: "#3b82f6",
        contentType: "TEXT",
        userId: user.id,
      },
    });

    const collection = await prisma.collection.create({
      data: { name: "Test Collection", userId: user.id },
    });

    const item = await prisma.item.create({
      data: {
        title: "Test snippet",
        contentType: "TEXT",
        content: "console.log('hello')",
        userId: user.id,
        typeId: type.id,
        tags: { create: { name: "test", userId: user.id } },
        collections: { create: { collectionId: collection.id } },
      },
      include: { type: true, tags: true, collections: true },
    });

    if (item.tags.length !== 1 || item.collections.length !== 1) {
      throw new Error("Item relations were not created");
    }
    console.log(`✓ Created item "${item.title}" (${item.type.name})`);
  } finally {
    await prisma.user.delete({ where: { id: user.id } });
  }

  const leftovers = await prisma.item.count({ where: { userId: user.id } });
  if (leftovers !== 0) throw new Error("Cascade delete left items behind");
  console.log("✓ Deleted test user, cascade removed its data");
}

async function main() {
  await checkConnection();
  await printCounts();
  await roundTrip();
  console.log("✓ Database test passed");
}

main()
  .catch((error: unknown) => {
    console.error("✗ Database test failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
