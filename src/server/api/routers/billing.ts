import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { subscriptions } from "@/server/db/schema";
import {
  createProSubscription,
  verifySubscriptionSignature,
  activatePro,
  deactivatePro,
  getRazorpay,
  billingEnabled,
  PRO_PLAN,
} from "@/server/lib/billing";

export const billingRouter = createTRPCRouter({
  /** Current plan + subscription state for the signed-in user. */
  status: protectedProcedure.query(async ({ ctx }) => {
    const [sub] = await ctx.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, ctx.user.id))
      .limit(1);

    return {
      plan: ctx.plan, // already validated (period-aware) in context
      status: sub?.status ?? null,
      currentPeriodEnd: sub?.currentPeriodEnd ?? null,
      proPlan: PRO_PLAN,
      billingEnabled: billingEnabled(),
    };
  }),

  /** Start a Pro subscription; returns the id the browser checkout opens with. */
  createSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    if (!billingEnabled()) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Billing is not enabled on this deployment.",
      });
    }
    if (ctx.plan === "pro") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Already on Pro." });
    }
    const sub = await createProSubscription(ctx.user.id, ctx.user.email);
    return { subscriptionId: sub.id };
  }),

  /**
   * Called by the checkout success handler. We verify the signature *server
   * side* before granting Pro — never trust the client's word that it paid.
   * The webhook is still the durable source of truth; this just gives instant
   * access without waiting for the webhook round-trip.
   */
  verifyPayment: protectedProcedure
    .input(
      z.object({
        razorpay_payment_id: z.string(),
        razorpay_subscription_id: z.string(),
        razorpay_signature: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ok = verifySubscriptionSignature({
        paymentId: input.razorpay_payment_id,
        subscriptionId: input.razorpay_subscription_id,
        signature: input.razorpay_signature,
      });
      if (!ok) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Payment signature verification failed.",
        });
      }
      await activatePro(ctx.user.id, {
        subscriptionId: input.razorpay_subscription_id,
        status: "active",
      });
      return { plan: "pro" as const };
    }),

  /** Cancel at period end via Razorpay, then reflect locally. */
  cancel: protectedProcedure.mutation(async ({ ctx }) => {
    const [sub] = await ctx.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, ctx.user.id))
      .limit(1);

    if (!sub?.razorpaySubscriptionId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No active subscription.",
      });
    }
    // cancel_at_cycle_end = 1 keeps access until the paid period ends.
    await getRazorpay().subscriptions.cancel(sub.razorpaySubscriptionId, true);
    await deactivatePro(ctx.user.id, "cancelled");
    return { ok: true };
  }),
});
