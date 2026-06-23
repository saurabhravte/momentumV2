import { type NextRequest, NextResponse } from "next/server";

import {
  verifyWebhookSignature,
  activatePro,
  deactivatePro,
} from "@/server/lib/billing";

/**
 * Razorpay webhook. Register this URL in the Razorpay dashboard
 * (Settings → Webhooks) with the events:
 *   subscription.activated, subscription.charged,
 *   subscription.cancelled, subscription.completed, subscription.halted
 * and the secret you put in RAZORPAY_WEBHOOK_SECRET.
 *
 * This is the *durable* source of truth for plan state — the in-app
 * verifyPayment mutation only grants instant access optimistically.
 *
 * We resolve the user via the `userId` we stored in subscription notes when
 * creating it (see createProSubscription).
 */
export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  const raw = await req.text();

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(raw) as {
    event: string;
    payload?: {
      subscription?: {
        entity?: {
          id?: string;
          current_end?: number; // unix seconds
          notes?: { userId?: string };
        };
      };
    };
  };

  const sub = event.payload?.subscription?.entity;
  const userId = sub?.notes?.userId;

  if (!userId) {
    // Nothing we can map — ack so Razorpay stops retrying.
    return NextResponse.json({ received: true });
  }

  const periodEnd = sub?.current_end
    ? new Date(sub.current_end * 1000)
    : undefined;

  switch (event.event) {
    case "subscription.activated":
    case "subscription.charged":
      await activatePro(userId, {
        subscriptionId: sub?.id,
        periodEnd,
        status: "active",
      });
      break;

    case "subscription.halted":
    case "subscription.cancelled":
    case "subscription.completed":
    case "subscription.expired":
      await deactivatePro(userId, event.event.split(".")[1]);
      break;

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
