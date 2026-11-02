import { vi } from "vitest";

// "server-only" throws outside a React Server Components build
vi.mock("server-only", () => ({}));
