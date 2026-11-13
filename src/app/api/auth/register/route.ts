import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { apiError, rateLimitedResponse } from "@/lib/api-response";
import { isPrismaError, PRISMA_ERROR } from "@/lib/db/prisma-errors";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validations/auth";
import {
  EMAIL_VERIFICATION_ENABLED,
  sendVerificationLink,
} from "@/lib/verification";

export async function POST(request: Request) {
  const limit = await checkRateLimit("register", getClientIp(request.headers));
  if (!limit.success) return rateLimitedResponse(limit.reset);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 400);
  }

  const { name, email, password } = parsed.data;
  const emailTaken = apiError("A user with this email already exists", 409);

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) return emailTaken;

    const passwordHash = await bcrypt.hash(password, 12);
    // With verification off, users are marked verified so re-enabling it won't lock them out
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        emailVerified: EMAIL_VERIFICATION_ENABLED ? null : new Date(),
      },
      select: { id: true, name: true, email: true },
    });

    // The account exists either way; a failed send can be retried via resend
    if (EMAIL_VERIFICATION_ENABLED) {
      try {
        await sendVerificationLink(user.email);
      } catch (error) {
        console.error("Verification email failed:", error);
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: { ...user, requiresVerification: EMAIL_VERIFICATION_ENABLED },
      },
      { status: 201 },
    );
  } catch (error) {
    // A concurrent registration won the race for the unique email
    if (isPrismaError(error, PRISMA_ERROR.uniqueConstraint)) return emailTaken;

    console.error("Registration failed:", error);
    return apiError("Registration failed", 500);
  }
}
