import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { CatchUpClient } from "@/components/app/catch-up/catch-up-client";

export const metadata = { title: "Catch Me Up — Momentum" };

export default async function CatchUpPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return <CatchUpClient />;
}
