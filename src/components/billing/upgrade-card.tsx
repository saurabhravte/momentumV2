"use client";

import { Sparkles, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useRazorpay } from "@/components/billing/use-razorpay";
import { useSession } from "@/lib/auth-client";

/**
 * Compact upgrade promo — mirrors the "Upgrade to Premium" card from the
 * design. Dismissible, and only meaningful for free users (the dashboard +
 * sidebar render it conditionally). Clicking opens Razorpay checkout.
 */
export function UpgradeCard() {
  const { data } = useSession();
  const [dismissed, setDismissed] = useState(false);
  const { upgrade, loading, error } = useRazorpay();

  if (dismissed) return null;

  return (
    <div className="from-primary/12 relative overflow-hidden rounded-xl border bg-gradient-to-br to-transparent p-5">
      <button
        onClick={() => setDismissed(true)}
        className="text-muted-foreground hover:text-foreground absolute top-3 right-3"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>
      <span className="bg-primary/15 text-primary grid size-9 place-items-center rounded-lg">
        <Sparkles className="size-5" />
      </span>
      <p className="mt-3 font-medium">Upgrade to Pro</p>
      <p className="text-muted-foreground mt-1 text-xs">
        Unlock AI triage, the catch-me-up digest, and the ⌘K command agent.
      </p>
      {error && <p className="text-destructive mt-2 text-xs">{error}</p>}
      <Button
        size="sm"
        className="mt-4 w-full"
        disabled={loading}
        onClick={() =>
          upgrade({ name: data?.user?.name, email: data?.user?.email })
        }
      >
        {loading ? "Opening checkout…" : "Upgrade now · ₹499/mo"}
      </Button>
    </div>
  );
}
