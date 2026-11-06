import { CodeIcon, FolderOpenIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { auth } from "@/auth";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { StatCard } from "@/components/dashboard/StatCard";
import { TypeBreakdown } from "@/components/profile/TypeBreakdown";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/user/UserAvatar";
import { getProfile } from "@/lib/db/profile";
import { formatDate } from "@/lib/format-date";

export default async function ProfilePage() {
  // User data must be fetched per request, not prerendered at build time.
  await connection();
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/profile");

  const profile = await getProfile(session.user.id);
  if (!profile) redirect("/sign-in");

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
      <header>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="mt-1 text-muted-foreground">Your account and usage</p>
      </header>

      <Card>
        <CardContent className="flex items-center gap-4">
          <UserAvatar
            name={profile.name}
            email={profile.email}
            image={profile.image}
            size="lg"
            className="size-16"
          />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">
              {profile.name || profile.email}
            </p>
            <p className="truncate text-muted-foreground">{profile.email}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Member since{" "}
              <time dateTime={profile.createdAt.toISOString()}>
                {formatDate(profile.createdAt, "long")}
              </time>
            </p>
          </div>
        </CardContent>
      </Card>

      <DashboardSection title="Usage">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard
              label="Total Items"
              value={profile.itemCount}
              icon={CodeIcon}
              iconClassName="bg-blue-500/20 text-blue-400 shadow-blue-500/30"
            />
            <StatCard
              label="Collections"
              value={profile.collectionCount}
              icon={FolderOpenIcon}
              iconClassName="bg-violet-500/20 text-violet-400 shadow-violet-500/30"
            />
          </div>
          <TypeBreakdown types={profile.types} />
        </div>
      </DashboardSection>
    </div>
  );
}
