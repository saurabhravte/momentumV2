import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { Sidebar } from "@/components/app/sidebar";
import { CommandPalette } from "@/components/app/command-palette";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Real session validation (middleware only does the optimistic cookie check).
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <div className="app-canvas flex min-h-screen">
      <Sidebar user={session.user} />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <CommandPalette />
    </div>
  );
}
