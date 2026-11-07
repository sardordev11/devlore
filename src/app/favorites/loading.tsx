import { Skeleton } from "@/components/ui/skeleton";

export default function FavoritesLoading() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <header className="flex flex-col gap-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-5 w-44" />
        </header>
        <Skeleton className="h-7 w-36" />
      </div>

      {[6, 3].map((rows, section) => (
        <div key={section} className="flex flex-col gap-2">
          <Skeleton className="mx-2 h-4 w-24" />
          <div className="flex flex-col gap-1 border-y border-border/60 py-1">
            {Array.from({ length: rows }, (_, i) => (
              <Skeleton key={i} className="h-6" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
