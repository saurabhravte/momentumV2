import "server-only";
import crypto from "node:crypto";
import Razorpay from "razorpay";
import { eq } from "drizzle-orm";

import { env } from "@/env";
import { db } from "@/server/db";
import { subscriptions } from "@/server/db/schema";

/**
 * Whether billing is configured. When false the app runs in free-only mode:
 * upgrade flows return a clear error and webhooks/signature checks short-circuit
 * instead of crashing. Enable by setting all four RAZORPAY_* env vars.
 */
export function billingEnabled(): boolean {
  return Boolean(
    env.RAZORPAY_KEY_ID &&
      env.RAZORPAY_KEY_SECRET &&
      env.RAZORPAY_PLAN_ID &&
      env.RAZORPAY_WEBHOOK_SECRET,
  );
}

/**
 * Lazily-instantiated Razorpay client. Built on first use so the module can be
 * imported (and the app can boot/build) without billing configured. Throws a
 * clear error if a billing operation is attempted while disabled.
 */
let _razorpay: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new Error(
      "Billing is not configured. Set RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET to enable payments.",
    );
  }
  _razorpay ??= new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
  return _razorpay;
}

export const PRO_PLAN = {
  id: "pro",
  name: "Momentum Pro",
  priceLabel: "₹499",
  period: "month",
  // Everything below the AI line is what free users miss out on.
  aiFeatures: [
    "AI priority triage (Urgent / Reply / Waiting / FYI)",
    "Catch-me-up digest across all tools",
    "⌘K natural-language command agent",
  ],
} as const;

/**
 * Create a Razorpay subscription for a user against the configured plan.
 * Returns the subscription id the browser checkout needs.
 */
export async function createProSubscription(userId: string, email?: string) {
  if (!env.RAZORPAY_PLAN_ID) {
    throw new Error("Billing is not configured (missing RAZORPAY_PLAN_ID).");
  }
  const sub = await getRazorpay().subscriptions.create({
    plan_id: env.RAZORPAY_PLAN_ID,
    total_count: 12, // 12 billing cycles; Razorpay auto-renews per plan period
    customer_notify: 1,
    notes: { userId, email: email ?? "" },
  });

  await upsertSubscription(userId, {
    razorpaySubscriptionId: sub.id,
    status: String(sub.status),
    plan: "free", // stays free until payment is verified / webhook activates
  });

  return sub;
}

/**
 * Verify the signature Razorpay sends back to the checkout success handler.
 * For subscriptions the signed payload is `payment_id|subscription_id`.
 */
export function verifySubscriptionSignature(args: {
  paymentId: string;
  subscriptionId: string;
  signature: string;
}) {
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET ?? "")
    .update(`${args.paymentId}|${args.subscriptionId}`)
    .digest("hex");
  return Boolean(env.RAZORPAY_KEY_SECRET) && timingSafeEqual(expected, args.signature);
}

/** Verify a webhook body against the X-Razorpay-Signature header. */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  if (!env.RAZORPAY_WEBHOOK_SECRET) return false;
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/** Idempotent upsert of a user's subscription row. */
export async function upsertSubscription(
  userId: string,
  values: Partial<typeof subscriptions.$inferInsert>,
) {
  await db
    .insert(subscriptions)
    .values({ userId, ...values })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: { ...values, updatedAt: new Date() },
    });
}

/** Mark a user as Pro until `currentPeriodEnd`. Called from webhook + verify. */
export async function activatePro(
  userId: string,
  opts: { subscriptionId?: string; periodEnd?: Date; status?: string } = {},
) {
  await upsertSubscription(userId, {
    plan: "pro",
    status: opts.status ?? "active",
    razorpaySubscriptionId: opts.subscriptionId,
    currentPeriodEnd:
      opts.periodEnd ?? new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
  });
}

/** Downgrade a user to free (cancellation / expiry / failed charge). */
export async function deactivatePro(userId: string, status = "cancelled") {
  await db
    .update(subscriptions)
    .set({ plan: "free", status, updatedAt: new Date() })
    .where(eq(subscriptions.userId, userId));
}
