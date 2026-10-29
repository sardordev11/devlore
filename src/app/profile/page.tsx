import { CodeIcon, FolderOpenIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { auth } from "@/auth";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChangePasswordDialog } from "@/components/profile/ChangePasswordDialog";
import { DeleteAccountDialog } from "@/components/profile/DeleteAccountDialog";
import { TypeBreakdown } from "@/components/profile/TypeBreakdown";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/user/UserAvatar";
import { getProfile } from "@/lib/db/profile";

// UTC keeps the server-rendered date stable regardless of the server's time zone.
const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

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
                {DATE_FORMAT.format(profile.createdAt)}
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

      <DashboardSection title="Account">
        <Card>
          <CardContent className="flex flex-col divide-y">
            {profile.hasPassword && (
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
                <div>
                  <p className="font-medium">Password</p>
                  <p className="text-sm text-muted-foreground">
                    Change the password you use to sign in.
                  </p>
                </div>
                <ChangePasswordDialog />
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 first:pt-0">
              <div>
                <p className="font-medium">Delete account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently remove your account and all of its data.
                </p>
              </div>
              <DeleteAccountDialog />
            </div>
          </CardContent>
        </Card>
      </DashboardSection>
    </div>
  );
}
