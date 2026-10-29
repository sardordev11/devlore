import { sendVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { createToken, hashToken, PASSWORD_RESET_PREFIX } from "@/lib/tokens";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const APP_URL = process.env.AUTH_URL ?? "http://localhost:3000";

// On unless explicitly "false", so a missing env var never drops the check
export const EMAIL_VERIFICATION_ENABLED =
  process.env.EMAIL_VERIFICATION_ENABLED !== "false";

export type VerifyResult = "verified" | "expired" | "invalid";

// Replaces any earlier token for this email and sends a fresh link
export async function sendVerificationLink(email: string) {
  const token = createToken();

  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier: email } }),
    prisma.verificationToken.create({
      data: {
        identifier: email,
        token: hashToken(token),
        expires: new Date(Date.now() + TOKEN_TTL_MS),
      },
    }),
  ]);

  const url = new URL("/api/auth/verify-email", APP_URL);
  url.searchParams.set("token", token);
  await sendVerificationEmail(email, url.toString());
}

// Tokens expire after 24h, so the newest one was created at expires - TTL
export async function isInResendCooldown(email: string) {
  const latest = await prisma.verificationToken.findFirst({
    where: { identifier: email },
    orderBy: { expires: "desc" },
    select: { expires: true },
  });
  if (!latest) return false;

  const createdAt = latest.expires.getTime() - TOKEN_TTL_MS;
  return Date.now() - createdAt < RESEND_COOLDOWN_MS;
}

export async function verifyEmailToken(token: string): Promise<VerifyResult> {
  // Password reset tokens live in the same table and must not verify here
  const record = await prisma.verificationToken.findFirst({
    where: {
      token: hashToken(token),
      NOT: { identifier: { startsWith: PASSWORD_RESET_PREFIX } },
    },
  });
  if (!record) return "invalid";

  if (record.expires < new Date()) {
    await prisma.verificationToken.deleteMany({
      where: { identifier: record.identifier, token: record.token },
    });
    return "expired";
  }

  await prisma.$transaction([
    prisma.user.updateMany({
      where: { email: record.identifier, emailVerified: null },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.deleteMany({
      where: { identifier: record.identifier },
    }),
  ]);
  return "verified";
}
