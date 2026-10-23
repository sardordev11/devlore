import {
  ClockIcon,
  CodeIcon,
  FolderOpenIcon,
  HeartIcon,
  PinIcon,
  StarIcon,
} from "lucide-react";

import { CollectionCard } from "@/components/dashboard/CollectionCard";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { ItemCard } from "@/components/dashboard/ItemCard";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  dashboardStats,
  pinnedItems,
  recentCollections,
  recentItems,
} from "@/lib/dashboard";

const STATS = [
  {
    label: "Total Items",
    value: dashboardStats.items,
    icon: CodeIcon,
    iconClassName: "bg-blue-500/20 text-blue-400 shadow-blue-500/30",
  },
  {
    label: "Collections",
    value: dashboardStats.collections,
    icon: FolderOpenIcon,
    iconClassName: "bg-violet-500/20 text-violet-400 shadow-violet-500/30",
  },
  {
    label: "Favorite Items",
    value: dashboardStats.favoriteItems,
    icon: StarIcon,
    iconClassName: "bg-orange-500/20 text-orange-400 shadow-orange-500/30",
  },
  {
    label: "Favorite Collections",
    value: dashboardStats.favoriteCollections,
    icon: HeartIcon,
    iconClassName: "bg-pink-500/20 text-pink-400 shadow-pink-500/30",
  },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">
      <header>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Your developer knowledge hub</p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <DashboardSection title="Collections" viewAllHref="/collections">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recentCollections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      </DashboardSection>

      {pinnedItems.length > 0 && (
        <DashboardSection title="Pinned" icon={PinIcon}>
          <div className="flex flex-col gap-3">
            {pinnedItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </DashboardSection>
      )}

      <DashboardSection title="Recent Items" icon={ClockIcon}>
        <div className="flex flex-col gap-3">
          {recentItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </DashboardSection>
    </div>
  );
}
