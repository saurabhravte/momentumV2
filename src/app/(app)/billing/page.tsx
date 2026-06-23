import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { BillingClient } from "@/components/billing/billing-client";

export const metadata = { title: "Billing — Momentum" };

export default async function BillingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return <BillingClient />;
}
