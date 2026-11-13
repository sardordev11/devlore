import { Skeleton } from "@/components/ui/skeleton";

export default function BillingLoading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 *:max-w-4xl">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-5 w-64" />
      </header>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
