import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";

// Edge-compatible config: no adapter, so the proxy can import it.
// Credentials is a placeholder here; auth.ts overrides it with the real check.
export default {
  providers: [
    GitHub,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: () => null,
    }),
  ],
} satisfies NextAuthConfig;
