import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import {
  EMAIL_VERIFICATION_ENABLED,
  sendVerificationLink,
} from "@/lib/verification";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;
  const emailTaken = NextResponse.json(
    { success: false, error: "A user with this email already exists" },
    { status: 409 },
  );

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
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return emailTaken;
    }

    console.error("Registration failed:", error);
    return NextResponse.json(
      { success: false, error: "Registration failed" },
      { status: 500 },
    );
  }
}
