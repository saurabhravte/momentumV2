import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { SettingsClient } from "@/components/app/settings/settings-client";

export const metadata = { title: "Settings — Momentum" };

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <SettingsClient
      initialName={session.user.name ?? ""}
      email={session.user.email ?? ""}
    />
  );
}
