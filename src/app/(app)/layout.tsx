import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";
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
      <main className="flex min-h-screen flex-1 flex-col overflow-y-auto">
        <Topbar />
        <div className="flex-1">{children}</div>
      </main>
      <CommandPalette />
    </div>
  );
}
