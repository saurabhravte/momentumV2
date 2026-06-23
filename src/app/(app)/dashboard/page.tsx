import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import { DashboardClient } from "@/components/app/dashboard/dashboard-client";

export const metadata = { title: "Dashboard — Momentum" };

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  // Plan drives the upgrade card + AI widget gating on the dashboard.
  const billing = await api.billing.status();

  return (
    <DashboardClient name={session.user.name ?? "there"} plan={billing.plan} />
  );
}
