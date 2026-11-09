import type { Metadata } from "next";
import { Suspense } from "react";

import { SignInForm } from "@/components/auth/SignInForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Sign in · DevLore",
};

export default function SignInPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Welcome back to your developer knowledge hub</CardDescription>
      </CardHeader>
      <CardContent>
        {/* useSearchParams in the form needs a Suspense boundary */}
        <Suspense fallback={<Skeleton className="h-80 w-full" />}>
          <SignInForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
