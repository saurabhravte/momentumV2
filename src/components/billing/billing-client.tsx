"use client";

import { Check, Sparkles, Lock } from "lucide-react";

import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRazorpay } from "@/components/billing/use-razorpay";
import { useSession } from "@/lib/auth-client";

const FREE = [
  "Unified inbox across all sources",
  "Email → calendar scheduling",
  "Instant local search",
  "Slack & GitHub in the queue",
];
const PRO = [
  "Everything in Free",
  "AI priority triage",
  "Catch-me-up digest",
  "⌘K command agent",
];

export function BillingClient() {
  const { data } = useSession();
  const status = api.billing.status.useQuery();
  const utils = api.useUtils();
  const cancel = api.billing.cancel.useMutation({
    onSuccess: () => utils.billing.status.invalidate(),
  });
  const { upgrade, loading, error } = useRazorpay();

  const plan = status.data?.plan ?? "free";
  const isPro = plan === "pro";
  // When the deployment has no Razorpay keys, billing is off. Show a clear
  // disabled state instead of an "Upgrade" button that errors on click.
  const billingEnabled = status.data?.billingEnabled ?? false;

  return (
    <div className="mx-auto max-w-3xl p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Billing &amp; plan
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          You&apos;re on the{" "}
          <Badge
            variant={isPro ? "default" : "secondary"}
            className="align-middle"
          >
            {isPro ? "Pro" : "Free"}
          </Badge>{" "}
          plan.
          {isPro && status.data?.currentPeriodEnd && (
            <>
              {" "}
              Renews{" "}
              {new Date(status.data.currentPeriodEnd).toLocaleDateString()}.
            </>
          )}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Free */}
        <div className="bg-card rounded-2xl border p-6">
          <h2 className="font-medium">Free</h2>
          <p className="mt-1 text-3xl font-semibold">
            ₹0
            <span className="text-muted-foreground text-base font-normal">
              /mo
            </span>
          </p>
          <ul className="mt-5 space-y-2.5 text-sm">
            {FREE.map((p) => (
              <li key={p} className="flex items-start gap-2">
                <Check className="text-done mt-0.5 size-4 shrink-0" /> {p}
              </li>
            ))}
            <li className="text-muted-foreground flex items-start gap-2">
              <Lock className="mt-0.5 size-4 shrink-0" /> No AI features
            </li>
          </ul>
        </div>

        {/* Pro */}
        <div className="border-primary bg-card relative overflow-hidden rounded-2xl border-2 p-6">
          <Badge className="absolute top-4 right-4">AI included</Badge>
          <h2 className="font-medium">Pro</h2>
          <p className="mt-1 text-3xl font-semibold">
            ₹499
            <span className="text-muted-foreground text-base font-normal">
              /mo
            </span>
          </p>
          <ul className="mt-5 space-y-2.5 text-sm">
            {PRO.map((p) => (
              <li key={p} className="flex items-start gap-2">
                <Sparkles className="text-primary mt-0.5 size-4 shrink-0" /> {p}
              </li>
            ))}
          </ul>

          {error && <p className="text-destructive mt-4 text-xs">{error}</p>}

          {isPro ? (
            <Button
              variant="outline"
              className="mt-6 w-full"
              disabled={cancel.isPending}
              onClick={() => cancel.mutate()}
            >
              {cancel.isPending ? "Cancelling…" : "Cancel at period end"}
            </Button>
          ) : billingEnabled ? (
            <Button
              className="mt-6 w-full"
              disabled={loading}
              onClick={() =>
                upgrade({ name: data?.user?.name, email: data?.user?.email })
              }
            >
              {loading ? "Opening checkout…" : "Upgrade to Pro"}
            </Button>
          ) : (
            <>
              <Button className="mt-6 w-full" disabled>
                Billing not available
              </Button>
              <p className="text-muted-foreground mt-2 text-center text-xs">
                Payments aren&apos;t configured on this deployment yet. Set the
                RAZORPAY_* environment variables to enable Pro upgrades.
              </p>
            </>
          )}
          <p className="text-muted-foreground mt-3 text-center text-xs">
            Payments secured by Razorpay
          </p>
        </div>
      </div>
    </div>
  );
}
