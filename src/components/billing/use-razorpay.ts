"use client";

import { useCallback, useState } from "react";

import { api } from "@/trpc/react";
import { env } from "@/env";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/**
 * Drives the full upgrade flow from the client:
 *  1. create a subscription on the server (returns subscriptionId)
 *  2. open Razorpay checkout
 *  3. on success, verify the signature server-side and refresh plan state
 */
export function useRazorpay({ onSuccess }: { onSuccess?: () => void } = {}) {
  const utils = api.useUtils();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSubscription = api.billing.createSubscription.useMutation();
  const verifyPayment = api.billing.verifyPayment.useMutation();

  const upgrade = useCallback(
    async (user?: { name?: string; email?: string }) => {
      setError(null);
      setLoading(true);
      try {
        if (!env.NEXT_PUBLIC_RAZORPAY_KEY_ID)
          throw new Error("Billing is not enabled on this deployment.");

        const ok = await loadScript();
        if (!ok || !window.Razorpay)
          throw new Error("Could not load Razorpay checkout.");

        const { subscriptionId } = await createSubscription.mutateAsync();

        await new Promise<void>((resolve, reject) => {
          const rzp = new window.Razorpay!({
            key: env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            subscription_id: subscriptionId,
            name: "Momentum Pro",
            description: "Monthly subscription — unlocks AI features",
            theme: { color: "#1aa6a6" },
            prefill: { name: user?.name ?? "", email: user?.email ?? "" },
            handler: async (resp: {
              razorpay_payment_id: string;
              razorpay_subscription_id: string;
              razorpay_signature: string;
            }) => {
              try {
                await verifyPayment.mutateAsync(resp);
                await utils.billing.status.invalidate();
                onSuccess?.();
                resolve();
              } catch (e) {
                reject(e instanceof Error ? e : new Error(String(e)));
              }
            },
            modal: { ondismiss: () => reject(new Error("Checkout closed.")) },
          });
          rzp.open();
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    },
    [createSubscription, verifyPayment, utils, onSuccess],
  );

  return { upgrade, loading, error };
}
