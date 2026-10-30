import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { signInSchema } from "@/lib/validations/auth";
import { EMAIL_VERIFICATION_ENABLED } from "@/lib/verification";
import authConfig from "@/auth.config";

export const EMAIL_NOT_VERIFIED = "email_not_verified";
export const RATE_LIMITED = "rate_limited";

// Thrown only after the password checks out, so it doesn't reveal accounts
class EmailNotVerified extends CredentialsSignin {
  code = EMAIL_NOT_VERIFIED;
}

// NextAuth rethrows this instance to signIn callers, so `reset` reaches the action
export class LoginRateLimited extends CredentialsSignin {
  code = RATE_LIMITED;

  constructor(readonly reset: number) {
    super();
  }
}

// Replace the edge-safe Credentials placeholder with the real bcrypt check
const providers = authConfig.providers.map((provider) =>
  typeof provider === "function" || provider.id !== "credentials"
    ? provider
    : Credentials({
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials, request) {
          const parsed = signInSchema.safeParse(credentials);
          if (!parsed.success) return null;

          // Checked here so direct POSTs to the credentials callback are limited too
          const limit = await checkRateLimit(
            "login",
            `${getClientIp(request.headers)}:${parsed.data.email}`,
          );
          if (!limit.success) throw new LoginRateLimited(limit.reset);

          const user = await prisma.user.findUnique({
            where: { email: parsed.data.email },
          });
          if (!user?.passwordHash) return null;

          const valid = await bcrypt.compare(
            parsed.data.password,
            user.passwordHash,
          );
          if (!valid) return null;
          if (EMAIL_VERIFICATION_ENABLED && !user.emailVerified) {
            throw new EmailNotVerified();
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          };
        },
      }),
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  ...authConfig,
  providers,
});
