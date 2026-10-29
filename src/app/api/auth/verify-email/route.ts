import { NextResponse, type NextRequest } from "next/server";

import { verifyEmailToken } from "@/lib/verification";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  let result: Awaited<ReturnType<typeof verifyEmailToken>> = "invalid";
  if (token) {
    try {
      result = await verifyEmailToken(token);
    } catch (error) {
      console.error("Email verification failed:", error);
      result = "invalid";
    }
  }

  const destination =
    result === "verified"
      ? "/sign-in?verified=1"
      : `/verify-email?error=${result}`;
  return NextResponse.redirect(new URL(destination, request.url));
}
