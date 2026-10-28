import GitHub from "next-auth/providers/github";
import type { NextAuthConfig } from "next-auth";

// Edge-compatible config: no adapter, so the proxy can import it
export default {
  providers: [GitHub],
} satisfies NextAuthConfig;
