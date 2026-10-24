import "dotenv/config";
import { defineConfig } from "prisma/config";

// The CLI (migrate, studio) needs Neon's direct (non-pooled) connection.
// Use DIRECT_URL if set, otherwise derive it from the pooled DATABASE_URL:
// Neon's direct host is the pooled host without "-pooler".
// process.env instead of env() so `prisma generate` works without a database URL.
const directUrl =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL?.replace("-pooler.", ".") ??
  "";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: directUrl },
});
