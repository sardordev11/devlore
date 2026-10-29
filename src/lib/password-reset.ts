import bcrypt from "bcryptjs";

import { sendPasswordResetEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { createToken, hashToken, PASSWORD_RESET_PREFIX } from "@/lib/tokens";

const TOKEN_TTL_MS = 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const APP_URL = process.env.AUTH_URL ?? "http://localhost:3000";

export type ResetResult = "reset" | "invalid";

function resetIdentifier(email: string) {
  return `${PASSWORD_RESET_PREFIX}${email}`;
}

// Replaces any earlier reset token for this email and sends a fresh link
export async function sendPasswordResetLink(email: string) {
  const token = createToken();
  const identifier = resetIdentifier(email);

  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier } }),
    prisma.verificationToken.create({
      data: {
        identifier,
        token: hashToken(token),
        expires: new Date(Date.now() + TOKEN_TTL_MS),
      },
    }),
  ]);

  const url = new URL("/reset-password", APP_URL);
  url.searchParams.set("token", token);
  await sendPasswordResetEmail(email, url.toString());
}

// Tokens expire after 1h, so the newest one was created at expires - TTL
export async function isInResetCooldown(email: string) {
  const latest = await prisma.verificationToken.findFirst({
    where: { identifier: resetIdentifier(email) },
    orderBy: { expires: "desc" },
    select: { expires: true },
  });
  if (!latest) return false;

  const createdAt = latest.expires.getTime() - TOKEN_TTL_MS;
  return Date.now() - createdAt < RESEND_COOLDOWN_MS;
}

function validTokenWhere(token: string) {
  return {
    token: hashToken(token),
    identifier: { startsWith: PASSWORD_RESET_PREFIX },
    expires: { gt: new Date() },
  };
}

export async function isValidResetToken(token: string) {
  const record = await prisma.verificationToken.findFirst({
    where: validTokenWhere(token),
    select: { identifier: true },
  });
  return record !== null;
}

export async function resetPasswordWithToken(
  token: string,
  password: string,
): Promise<ResetResult> {
  const passwordHash = await bcrypt.hash(password, 12);

  return prisma.$transaction(async (tx) => {
    const record = await tx.verificationToken.findFirst({
      where: validTokenWhere(token),
      select: { identifier: true },
    });
    if (!record) return "invalid";

    // Deleting every reset token first means a second concurrent submit finds none
    const { count } = await tx.verificationToken.deleteMany({
      where: { identifier: record.identifier },
    });
    if (count === 0) return "invalid";

    const email = record.identifier.slice(PASSWORD_RESET_PREFIX.length);
    const user = await tx.user.findUnique({
      where: { email },
      select: { emailVerified: true },
    });
    if (!user) return "invalid";

    // Opening the reset link proves inbox ownership, so it also verifies the email
    await tx.user.update({
      where: { email },
      data: { passwordHash, emailVerified: user.emailVerified ?? new Date() },
    });
    return "reset";
  });
}
