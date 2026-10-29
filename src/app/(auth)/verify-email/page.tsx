import type { Metadata } from "next";

import { ResendVerificationForm } from "@/components/auth/ResendVerificationForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Verify email · DevLore",
};

export default function VerifyEmailPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Verification link didn&apos;t work</CardTitle>
        <CardDescription>
          The link has expired, was already used or is invalid. Enter your email and
          we&apos;ll send you a new one.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResendVerificationForm />
      </CardContent>
    </Card>
  );
}
