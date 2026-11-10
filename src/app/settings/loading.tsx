import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-5 w-56" />
      </header>
      <Skeleton className="h-80 rounded-xl" />
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-36 rounded-xl" />
    </div>
  );
}
