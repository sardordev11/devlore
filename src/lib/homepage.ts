// Content and link rules for the marketing homepage (`/`).

export interface HomeType {
  label: string;
  icon: string; // Lucide icon name, resolved with getTypeIcon
  color: string;
}

// Matches the seeded system types, so the homepage looks like the product.
export const HOME_TYPES = {
  snippet: { label: "Snippets", icon: "Code", color: "#3b82f6" },
  prompt: { label: "Prompts", icon: "Sparkles", color: "#8b5cf6" },
  command: { label: "Commands", icon: "Terminal", color: "#f97316" },
  note: { label: "Notes", icon: "StickyNote", color: "#fde047" },
  file: { label: "Files", icon: "File", color: "#6b7280" },
  image: { label: "Images", icon: "Image", color: "#ec4899" },
  link: { label: "Links", icon: "Link", color: "#10b981" },
} as const satisfies Record<string, HomeType>;

export type HomeTypeKey = keyof typeof HOME_TYPES;

export const PREVIEW_SIDEBAR_TYPES: HomeTypeKey[] = [
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "link",
];

export const PREVIEW_CARDS: { title: string; type: HomeTypeKey }[] = [
  { title: "useDebounce", type: "snippet" },
  { title: "Code review", type: "prompt" },
  { title: "docker up", type: "command" },
  { title: "Auth notes", type: "note" },
  { title: "Next.js docs", type: "link" },
  { title: "Diagram", type: "image" },
];

export interface HomeFeature {
  title: string;
  description: string;
  type: HomeTypeKey;
  // Overrides the type's own icon (features that aren't an item type).
  icon?: "Search" | "Folder";
}

export const FEATURES: HomeFeature[] = [
  {
    title: "Code Snippets",
    description: "Save reusable code with syntax highlighting in a VS Code-style editor.",
    type: "snippet",
  },
  {
    title: "AI Prompts",
    description: "Keep your best prompts and system messages out of old chat threads.",
    type: "prompt",
  },
  {
    title: "Instant Search",
    description: "Hit ⌘K and find anything by title, content, tag or type.",
    type: "link",
    icon: "Search",
  },
  {
    title: "Commands",
    description: "Stop digging through bash history. Copy the command you need in one click.",
    type: "command",
  },
  {
    title: "Files & Docs",
    description: "Upload context files, configs, images and docs, then download them anywhere.",
    type: "file",
  },
  {
    title: "Collections",
    description: "Group items of any type. One snippet can live in as many collections as you like.",
    type: "note",
    icon: "Folder",
  },
];

export const AI_FEATURES = [
  "Auto-tagging based on item content",
  "Short summaries of notes, files and prompts",
  '"Explain This Code" in plain English',
  "Prompt optimizer for clearer, sharper prompts",
];

export const AI_TAGS = ["react", "hooks", "typescript", "debounce", "performance"];

// ─────────────────────────────────────────────
// Pricing
// ─────────────────────────────────────────────

export type BillingPeriod = "monthly" | "yearly";

// Pro plan prices in US dollars.
export const PLAN_PRICES = { monthly: 8, yearly: 72 } as const;

export const YEARLY_SAVINGS_PERCENT = Math.round(
  (1 - PLAN_PRICES.yearly / (PLAN_PRICES.monthly * 12)) * 100,
);

export interface PriceDisplay {
  amount: string;
  period: string;
  note: string;
}

function formatDollars(value: number) {
  return `$${Number.isInteger(value) ? value : value.toFixed(2)}`;
}

export function getProPrice(period: BillingPeriod): PriceDisplay {
  if (period === "yearly") {
    return {
      amount: formatDollars(PLAN_PRICES.yearly),
      period: "/year",
      note: `${formatDollars(PLAN_PRICES.yearly / 12)}/month, billed yearly`,
    };
  }
  return {
    amount: formatDollars(PLAN_PRICES.monthly),
    period: "/month",
    note: "Billed monthly",
  };
}

export interface HomePlan {
  id: "free" | "pro";
  name: string;
  description: string;
  features: string[];
  cta: string;
  featured: boolean;
}

export const PLANS: HomePlan[] = [
  {
    id: "free",
    name: "Free",
    description: "For trying DevLore out.",
    features: [
      "50 items",
      "3 collections",
      "All system types except File & Image",
      "Instant search",
    ],
    cta: "Get Started",
    featured: false,
  },
  {
    id: "pro",
    name: "Pro",
    description: "For developers who live in their knowledge base.",
    features: [
      "Unlimited items & collections",
      "File & image uploads",
      "AI tagging, summaries & code explanations",
      "AI prompt optimizer",
      "Export to JSON / ZIP",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    featured: true,
  },
];

// ─────────────────────────────────────────────
// Links
// ─────────────────────────────────────────────

export interface HomeLink {
  label: string;
  href: string;
}

export const SECTION_LINKS: HomeLink[] = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
];

export const FOOTER_COLUMNS: { title: string; links: HomeLink[] }[] = [
  { title: "Product", links: SECTION_LINKS },
  {
    title: "Account",
    links: [
      { label: "Sign In", href: "/sign-in" },
      { label: "Sign Up", href: "/sign-up" },
    ],
  },
];

// Top-right nav buttons, the same whether or not the visitor is signed in.
export const NAV_SIGN_IN: HomeLink = { label: "Sign In", href: "/sign-in" };
export const NAV_GET_STARTED: HomeLink = { label: "Get Started", href: "/sign-up" };

// Hero and bottom CTA button.
export const GET_STARTED_FREE: HomeLink = { label: "Get Started Free", href: "/sign-up" };

// Where the Free and Pro plan buttons go (billing isn't built yet).
export function getPlanHref(isSignedIn: boolean): string {
  return isSignedIn ? "/dashboard" : "/sign-up";
}
