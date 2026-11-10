import { LockIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

interface ProTypeUpgradeProps {
  // Plural type slug, e.g. "files"
  slug: string;
}

// Shown on /items/files and /items/images to free users
export function ProTypeUpgrade({ slug }: ProTypeUpgradeProps) {
  const title = slug.charAt(0).toUpperCase() + slug.slice(1);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 rounded-xl border border-dashed px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
        <LockIcon className="size-6" aria-hidden />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{title} are a Pro feature</h1>
        <p className="text-muted-foreground">
          Upgrade to Pro to upload and browse {slug}, along with unlimited items and
          collections.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button nativeButton={false} render={<Link href="/settings/billing" />}>
          <SparklesIcon aria-hidden />
          Upgrade to Pro
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/dashboard" />}>
          Back to dashboard
        </Button>
      </div>
    </div>
  );
}
