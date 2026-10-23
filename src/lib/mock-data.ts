// Mock data for the dashboard UI. Replace with Prisma queries once the database is in place.

export type ContentType = "TEXT" | "FILE" | "URL";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  isPro: boolean;
}

export interface MockItemType {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  contentType: ContentType;
  isProOnly: boolean;
  itemCount: number;
}

export interface MockCollection {
  id: string;
  name: string;
  description: string;
  isFavorite: boolean;
  itemCount: number;
  typeIds: string[];
}

export interface MockItem {
  id: string;
  title: string;
  description: string;
  contentType: ContentType;
  content: string | null;
  language: string | null;
  url: string | null;
  fileName: string | null;
  typeId: string;
  collectionIds: string[];
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

export const currentUser: MockUser = {
  id: "user_1",
  name: "John Doe",
  email: "john@example.com",
  image: null,
  isPro: true,
};

export const itemTypes: MockItemType[] = [
  { id: "type_snippet", name: "snippet", slug: "snippets", icon: "Code", color: "#3b82f6", contentType: "TEXT", isProOnly: false, itemCount: 24 },
  { id: "type_prompt", name: "prompt", slug: "prompts", icon: "Sparkles", color: "#8b5cf6", contentType: "TEXT", isProOnly: false, itemCount: 18 },
  { id: "type_command", name: "command", slug: "commands", icon: "Terminal", color: "#f97316", contentType: "TEXT", isProOnly: false, itemCount: 15 },
  { id: "type_note", name: "note", slug: "notes", icon: "StickyNote", color: "#fde047", contentType: "TEXT", isProOnly: false, itemCount: 12 },
  { id: "type_file", name: "file", slug: "files", icon: "File", color: "#6b7280", contentType: "FILE", isProOnly: true, itemCount: 5 },
  { id: "type_image", name: "image", slug: "images", icon: "Image", color: "#ec4899", contentType: "FILE", isProOnly: true, itemCount: 3 },
  { id: "type_link", name: "link", slug: "links", icon: "Link", color: "#10b981", contentType: "URL", isProOnly: false, itemCount: 8 },
];

export const collections: MockCollection[] = [
  {
    id: "col_react",
    name: "React Patterns",
    description: "Common React patterns and hooks",
    isFavorite: true,
    itemCount: 12,
    typeIds: ["type_snippet", "type_note", "type_link"],
  },
  {
    id: "col_python",
    name: "Python Snippets",
    description: "Useful Python code snippets",
    isFavorite: false,
    itemCount: 8,
    typeIds: ["type_snippet", "type_note"],
  },
  {
    id: "col_context",
    name: "Context Files",
    description: "AI context files for projects",
    isFavorite: true,
    itemCount: 5,
    typeIds: ["type_file", "type_note"],
  },
  {
    id: "col_interview",
    name: "Interview Prep",
    description: "Technical interview preparation",
    isFavorite: false,
    itemCount: 24,
    typeIds: ["type_note", "type_snippet", "type_link", "type_prompt"],
  },
  {
    id: "col_git",
    name: "Git Commands",
    description: "Frequently used git commands",
    isFavorite: true,
    itemCount: 15,
    typeIds: ["type_command", "type_note"],
  },
  {
    id: "col_ai",
    name: "AI Prompts",
    description: "Curated AI prompts for coding",
    isFavorite: false,
    itemCount: 18,
    typeIds: ["type_prompt", "type_snippet", "type_note"],
  },
];

export const items: MockItem[] = [
  {
    id: "item_1",
    title: "useAuth Hook",
    description: "Custom authentication hook for React applications",
    contentType: "TEXT",
    content:
      "export function useAuth() {\n  const [user, setUser] = useState<User | null>(null);\n  // ...\n  return { user, setUser };\n}",
    language: "typescript",
    url: null,
    fileName: null,
    typeId: "type_snippet",
    collectionIds: ["col_react", "col_interview"],
    tags: ["react", "auth", "hooks"],
    isFavorite: true,
    isPinned: true,
    lastUsedAt: "2026-01-15T10:00:00.000Z",
    createdAt: "2026-01-15T09:00:00.000Z",
  },
  {
    id: "item_2",
    title: "API Error Handling Pattern",
    description: "Fetch wrapper with exponential backoff retry logic",
    contentType: "TEXT",
    content:
      "async function fetchWithRetry(url: string, retries = 3) {\n  for (let i = 0; i < retries; i++) {\n    try {\n      return await fetch(url);\n    } catch {\n      await new Promise((r) => setTimeout(r, 2 ** i * 1000));\n    }\n  }\n  throw new Error(\"Request failed\");\n}",
    language: "typescript",
    url: null,
    fileName: null,
    typeId: "type_snippet",
    collectionIds: ["col_react"],
    tags: ["fetch", "error-handling", "api"],
    isFavorite: false,
    isPinned: true,
    lastUsedAt: "2026-01-12T14:30:00.000Z",
    createdAt: "2026-01-12T14:00:00.000Z",
  },
  {
    id: "item_3",
    title: "Code Review Prompt",
    description: "Thorough code review focusing on bugs and readability",
    contentType: "TEXT",
    content:
      "Review the following code for bugs, security issues and readability. Suggest concrete improvements.",
    language: null,
    url: null,
    fileName: null,
    typeId: "type_prompt",
    collectionIds: ["col_ai"],
    tags: ["ai", "review"],
    isFavorite: true,
    isPinned: false,
    lastUsedAt: "2026-01-14T08:00:00.000Z",
    createdAt: "2026-01-10T12:00:00.000Z",
  },
  {
    id: "item_4",
    title: "Docker Compose Up",
    description: "Start all services in detached mode",
    contentType: "TEXT",
    content: "docker compose up -d",
    language: "bash",
    url: null,
    fileName: null,
    typeId: "type_command",
    collectionIds: [],
    tags: ["docker", "devops"],
    isFavorite: false,
    isPinned: false,
    lastUsedAt: "2026-01-13T16:00:00.000Z",
    createdAt: "2026-01-08T10:00:00.000Z",
  },
  {
    id: "item_5",
    title: "Undo Last Commit",
    description: "Reset the last commit but keep the changes staged",
    contentType: "TEXT",
    content: "git reset --soft HEAD~1",
    language: "bash",
    url: null,
    fileName: null,
    typeId: "type_command",
    collectionIds: ["col_git"],
    tags: ["git"],
    isFavorite: false,
    isPinned: false,
    lastUsedAt: "2026-01-11T09:00:00.000Z",
    createdAt: "2026-01-05T11:00:00.000Z",
  },
  {
    id: "item_6",
    title: "List Comprehension Cheatsheet",
    description: "Common Python list comprehension patterns",
    contentType: "TEXT",
    content: "squares = [x ** 2 for x in range(10)]\nevens = [x for x in nums if x % 2 == 0]",
    language: "python",
    url: null,
    fileName: null,
    typeId: "type_snippet",
    collectionIds: ["col_python"],
    tags: ["python"],
    isFavorite: false,
    isPinned: false,
    lastUsedAt: "2026-01-10T15:00:00.000Z",
    createdAt: "2026-01-03T13:00:00.000Z",
  },
  {
    id: "item_7",
    title: "Big-O Notes",
    description: "Time complexity of common data structure operations",
    contentType: "TEXT",
    content: "# Big-O\n\n- Array access: O(1)\n- Hash map lookup: O(1) average\n- Binary search: O(log n)",
    language: "markdown",
    url: null,
    fileName: null,
    typeId: "type_note",
    collectionIds: ["col_interview"],
    tags: ["algorithms", "interview"],
    isFavorite: false,
    isPinned: false,
    lastUsedAt: "2026-01-09T18:00:00.000Z",
    createdAt: "2026-01-02T10:00:00.000Z",
  },
  {
    id: "item_8",
    title: "React Docs",
    description: "Official React documentation",
    contentType: "URL",
    content: null,
    language: null,
    url: "https://react.dev",
    fileName: null,
    typeId: "type_link",
    collectionIds: ["col_react", "col_interview"],
    tags: ["react", "docs"],
    isFavorite: false,
    isPinned: false,
    lastUsedAt: "2026-01-08T12:00:00.000Z",
    createdAt: "2026-01-01T09:00:00.000Z",
  },
  {
    id: "item_9",
    title: "Project CLAUDE.md",
    description: "AI context file for the DevLore project",
    contentType: "FILE",
    content: null,
    language: null,
    url: null,
    fileName: "CLAUDE.md",
    typeId: "type_file",
    collectionIds: ["col_context"],
    tags: ["ai", "context"],
    isFavorite: true,
    isPinned: false,
    lastUsedAt: "2026-01-07T10:00:00.000Z",
    createdAt: "2025-12-28T10:00:00.000Z",
  },
];
