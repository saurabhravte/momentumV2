import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { ConnectionsClient } from "@/components/app/connections/connections-client";

export const metadata = { title: "Connections — Momentum" };

export default async function ConnectionsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return <ConnectionsClient />;
}
