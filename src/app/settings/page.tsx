import { redirect } from "next/navigation";
import { connection } from "next/server";

import { auth } from "@/auth";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { ChangePasswordDialog } from "@/components/settings/ChangePasswordDialog";
import { DeleteAccountDialog } from "@/components/settings/DeleteAccountDialog";
import { EditorPreferencesForm } from "@/components/settings/EditorPreferencesForm";
import { Card, CardContent } from "@/components/ui/card";
import { getAccountSettings } from "@/lib/db/settings";

export default async function SettingsPage() {
  // User data must be fetched per request, not prerendered at build time.
  await connection();
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/settings");

  const settings = await getAccountSettings(session.user.id);
  if (!settings) redirect("/sign-in");

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
      <header>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your editor and account</p>
      </header>

      <DashboardSection title="Editor">
        <Card>
          <CardContent>
            <EditorPreferencesForm />
          </CardContent>
        </Card>
      </DashboardSection>

      <DashboardSection title="Account">
        <Card>
          <CardContent className="flex flex-col divide-y">
            {settings.hasPassword && (
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
