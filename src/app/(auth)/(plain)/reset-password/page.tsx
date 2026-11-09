import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { isValidResetToken } from "@/lib/password-reset";

export const metadata: Metadata = {
  title: "Reset password · DevLore",
};

type ResetPasswordPageProps = PageProps<"/reset-password">;

async function ResetPasswordContent({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;
  // The expiry check uses new Date(), so this must only run at request time
  await connection();
  const valid = typeof token === "string" && (await isValidResetToken(token));

  if (!valid) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reset link didn&apos;t work</CardTitle>
          <CardDescription>
            The link has expired, was already used or is invalid. Request a new one
            to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            nativeButton={false}
            render={<Link href="/forgot-password" />}
          >
            Request a new link
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose a new password</CardTitle>
        <CardDescription>Use at least 8 characters.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm token={token} />
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage(props: ResetPasswordPageProps) {
  return (
    // Reading searchParams and the database makes this dynamic
    <Suspense fallback={<Skeleton className="h-72 w-full rounded-xl" />}>
      <ResetPasswordContent {...props} />
    </Suspense>
  );
}
