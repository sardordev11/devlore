import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // Only server actions and utilities are unit tested, not components
    include: ["src/actions/**/*.test.ts", "src/lib/**/*.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
    // Fresh mocks per test, so calls and return values never leak between tests
    mockReset: true,
    restoreMocks: true,
  },
});
