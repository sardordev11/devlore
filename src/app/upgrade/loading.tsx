import { Skeleton } from "@/components/ui/skeleton";

export default function UpgradeLoading() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-10 py-4">
      <header className="flex flex-col items-center gap-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </header>
      <Skeleton className="h-6 w-56" />
      <div className="grid w-full max-w-[784px] gap-6 md:grid-cols-2">
        <Skeleton className="h-[30rem] rounded-[14px]" />
        <Skeleton className="h-[30rem] rounded-[14px]" />
      </div>
    </div>
  );
}
