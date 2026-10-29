import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signInSchema } from "@/lib/validations/auth";
import { EMAIL_VERIFICATION_ENABLED } from "@/lib/verification";
import authConfig from "@/auth.config";

export const EMAIL_NOT_VERIFIED = "email_not_verified";

// Thrown only after the password checks out, so it doesn't reveal accounts
class EmailNotVerified extends CredentialsSignin {
  code = EMAIL_NOT_VERIFIED;
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
        async authorize(credentials) {
          const parsed = signInSchema.safeParse(credentials);
          if (!parsed.success) return null;

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
