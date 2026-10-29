import { createHash, randomBytes } from "node:crypto";

import { sendVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const APP_URL = process.env.AUTH_URL ?? "http://localhost:3000";

export type VerifyResult = "verified" | "expired" | "invalid";

// Only the hash is stored, so a leaked database can't be used to verify accounts
function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// Replaces any earlier token for this email and sends a fresh link
export async function sendVerificationLink(email: string) {
  const token = randomBytes(32).toString("base64url");

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
  const record = await prisma.verificationToken.findFirst({
    where: { token: hashToken(token) },
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
