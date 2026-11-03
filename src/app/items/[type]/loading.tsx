import { Skeleton } from "@/components/ui/skeleton";

export default function ItemsByTypeLoading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-lg" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
        <Skeleton className="h-8 w-32 rounded-lg" />
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
