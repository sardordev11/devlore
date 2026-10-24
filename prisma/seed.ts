// Run with: npm run db:seed (or npx prisma db seed)
// Upserts the system item types and the demo user, then recreates the demo
// user's collections and items. Safe to re-run.
import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import type { ContentType } from "../src/generated/prisma/client";

// src/lib/prisma.ts is "server-only", so the script builds its own client
const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

const DEMO_USER = {
  email: "demo@devlore.io",
  name: "Demo User",
  password: "12345678",
} as const;

const SYSTEM_TYPES = [
  { name: "snippet", slug: "snippets", icon: "Code", color: "#3b82f6", contentType: "TEXT", isProOnly: false },
  { name: "prompt", slug: "prompts", icon: "Sparkles", color: "#8b5cf6", contentType: "TEXT", isProOnly: false },
  { name: "command", slug: "commands", icon: "Terminal", color: "#f97316", contentType: "TEXT", isProOnly: false },
  { name: "note", slug: "notes", icon: "StickyNote", color: "#fde047", contentType: "TEXT", isProOnly: false },
  { name: "file", slug: "files", icon: "File", color: "#6b7280", contentType: "FILE", isProOnly: true },
  { name: "image", slug: "images", icon: "Image", color: "#ec4899", contentType: "FILE", isProOnly: true },
  { name: "link", slug: "links", icon: "Link", color: "#10b981", contentType: "URL", isProOnly: false },
] as const satisfies readonly {
  name: string;
  slug: string;
  icon: string;
  color: string;
  contentType: ContentType;
  isProOnly: boolean;
}[];

type SystemTypeName = (typeof SYSTEM_TYPES)[number]["name"];

interface SeedItem {
  type: SystemTypeName;
  title: string;
  description?: string;
  content?: string;
  language?: string;
  url?: string;
}

interface SeedCollection {
  name: string;
  description: string;
  items: SeedItem[];
}

const COLLECTIONS: SeedCollection[] = [
  {
    name: "React Patterns",
    description: "Reusable React patterns and hooks",
    items: [
      {
        type: "snippet",
        title: "useDebounce & useLocalStorage hooks",
        description: "Debounce a changing value and persist state to localStorage",
        language: "typescript",
        content: `import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}`,
      },
      {
        type: "snippet",
        title: "Context provider & compound components",
        description: "Typed context with a safe hook, used to build a compound Tabs component",
        language: "typescript",
        content: `import { createContext, useContext, useState, type ReactNode } from "react";

interface TabsContextValue {
  active: string;
  setActive: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs() {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Tabs.* must be used inside <Tabs>");
  return context;
}

export function Tabs({ defaultValue, children }: { defaultValue: string; children: ReactNode }) {
  const [active, setActive] = useState(defaultValue);
  return <TabsContext.Provider value={{ active, setActive }}>{children}</TabsContext.Provider>;
}

Tabs.Trigger = function TabsTrigger({ value, children }: { value: string; children: ReactNode }) {
  const { active, setActive } = useTabs();
  return (
    <button aria-selected={active === value} onClick={() => setActive(value)}>
      {children}
    </button>
  );
};

Tabs.Panel = function TabsPanel({ value, children }: { value: string; children: ReactNode }) {
  const { active } = useTabs();
  return active === value ? <div>{children}</div> : null;
};`,
      },
      {
        type: "snippet",
        title: "cn, formatDate & sleep utilities",
        description: "Small helpers used across React projects",
        language: "typescript",
        content: `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Merge Tailwind classes without conflicts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, locale = "en-US") {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));`,
      },
    ],
  },
  {
    name: "AI Workflows",
    description: "AI prompts and workflow automations",
    items: [
      {
        type: "prompt",
        title: "Code review prompt",
        description: "Thorough review focused on bugs, security and readability",
        content: `You are a senior software engineer reviewing a pull request.

Review the code below and report:
1. Bugs and logic errors, including unhandled edge cases
2. Security issues (input validation, auth checks, injection, secrets)
3. Performance problems (unnecessary work, N+1 queries, re-renders)
4. Readability and naming issues

For each finding, give the line, the problem, why it matters and a suggested fix.
Rank findings from most to least severe. Skip style nitpicks a linter would catch.

Code:
{{code}}`,
      },
      {
        type: "prompt",
        title: "Documentation generator",
        description: "Generate README-style docs for a module or function",
        content: `Write clear developer documentation for the code below.

Include:
- A one-paragraph overview of what it does and when to use it
- Installation or setup steps, if any
- The public API: each function/component with parameters, return values and types
- 2-3 realistic usage examples
- Known limitations or gotchas

Use Markdown with headings and fenced code blocks. Be concise; don't restate the code line by line.

Code:
{{code}}`,
      },
      {
        type: "prompt",
        title: "Refactoring assistant",
        description: "Refactor code for clarity without changing behavior",
        content: `Refactor the following code to improve readability and maintainability.

Rules:
- Do not change external behavior or the public API
- Prefer small, focused functions and descriptive names
- Remove duplication and dead code
- Keep the existing language, framework and code style

Return:
1. The refactored code
2. A short bullet list of each change and why it helps
3. Any behavior you were unsure about and left unchanged

Code:
{{code}}`,
      },
    ],
  },
  {
    name: "DevOps",
    description: "Infrastructure and deployment resources",
    items: [
      {
        type: "snippet",
        title: "Next.js multi-stage Dockerfile",
        description: "Small production image using Next.js standalone output",
        language: "dockerfile",
        content: `FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]`,
      },
      {
        type: "command",
        title: "Deploy with migrations",
        description: "Apply pending Prisma migrations, build and restart the app",
        language: "bash",
        content: `git pull origin main && npm ci && npx prisma migrate deploy && npm run build && pm2 restart devlore`,
      },
      {
        type: "link",
        title: "Docker documentation",
        description: "Official Docker docs: Dockerfiles, Compose and more",
        url: "https://docs.docker.com/",
      },
      {
        type: "link",
        title: "GitHub Actions documentation",
        description: "Workflows, runners and CI/CD with GitHub Actions",
        url: "https://docs.github.com/en/actions",
      },
    ],
  },
  {
    name: "Terminal Commands",
    description: "Useful shell commands for everyday development",
    items: [
      {
        type: "command",
        title: "Undo last commit, keep changes",
        description: "Move HEAD back one commit and keep the changes staged",
        language: "bash",
        content: `git reset --soft HEAD~1`,
      },
      {
        type: "command",
        title: "Remove unused Docker data",
        description: "Delete stopped containers, unused images, networks and volumes",
        language: "bash",
        content: `docker system prune -a --volumes`,
      },
      {
        type: "command",
        title: "Kill process on a port",
        description: "Free up a port held by a stuck dev server",
        language: "bash",
        content: `lsof -ti tcp:3000 | xargs kill -9`,
      },
      {
        type: "command",
        title: "Check outdated packages",
        description: "List dependencies with newer versions available",
        language: "bash",
        content: `npm outdated`,
      },
    ],
  },
  {
    name: "Design Resources",
    description: "UI/UX resources and references",
    items: [
      {
        type: "link",
        title: "Tailwind CSS documentation",
        description: "Utility classes, theming and v4 configuration",
        url: "https://tailwindcss.com/docs",
      },
      {
        type: "link",
        title: "shadcn/ui",
        description: "Accessible, copy-paste React components",
        url: "https://ui.shadcn.com",
      },
      {
        type: "link",
        title: "Material Design 3",
        description: "Google's open-source design system",
        url: "https://m3.material.io",
      },
      {
        type: "link",
        title: "Lucide Icons",
        description: "Open-source icon library used across DevLore",
        url: "https://lucide.dev/icons",
      },
    ],
  },
];

// System types have userId = null, which a compound unique upsert can't match on
async function seedSystemTypes() {
  const typeIds = new Map<SystemTypeName, string>();

  for (const { name, ...data } of SYSTEM_TYPES) {
    const existing = await prisma.itemType.findFirst({
      where: { userId: null, slug: data.slug },
    });
    const type = existing
      ? await prisma.itemType.update({
          where: { id: existing.id },
          data: { name, ...data, isSystem: true },
        })
      : await prisma.itemType.create({
          data: { name, ...data, isSystem: true },
        });
    typeIds.set(name, type.id);
  }

  return typeIds;
}

async function seedDemoUser() {
  const passwordHash = await bcrypt.hash(DEMO_USER.password, 12);
  const data = {
    name: DEMO_USER.name,
    passwordHash,
    isPro: false,
    emailVerified: new Date(),
  };

  return prisma.user.upsert({
    where: { email: DEMO_USER.email },
    update: data,
    create: { email: DEMO_USER.email, ...data },
  });
}

async function seedCollections(userId: string, typeIds: Map<SystemTypeName, string>) {
  // Start from a clean slate so re-running doesn't duplicate data
  await prisma.item.deleteMany({ where: { userId } });
  await prisma.collection.deleteMany({ where: { userId } });

  for (const { name, description, items } of COLLECTIONS) {
    const collection = await prisma.collection.create({
      data: { name, description, userId, defaultTypeId: typeIds.get(items[0].type) },
    });

    for (const { type, ...item } of items) {
      const typeId = typeIds.get(type);
      if (!typeId) throw new Error(`Unknown item type: ${type}`);

      await prisma.item.create({
        data: {
          ...item,
          contentType: item.url ? "URL" : "TEXT",
          userId,
          typeId,
          collections: { create: { collectionId: collection.id } },
        },
      });
    }
  }
}

async function main() {
  const typeIds = await seedSystemTypes();
  console.log(`✓ Seeded ${typeIds.size} system item types`);

  const user = await seedDemoUser();
  console.log(`✓ Seeded demo user ${user.email}`);

  await seedCollections(user.id, typeIds);
  const itemCount = COLLECTIONS.reduce((sum, c) => sum + c.items.length, 0);
  console.log(`✓ Seeded ${COLLECTIONS.length} collections with ${itemCount} items`);
}

main()
  .catch((error: unknown) => {
    console.error("✗ Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
