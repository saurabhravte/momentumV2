/**
 * Manually grant (or revoke) Pro for a user — the "give access from my side"
 * switch. Bypasses Razorpay entirely, so it works even with billing disabled:
 * useful for yourself, teammates, beta testers, and support comps.
 *
 * Usage (tsx is already a dependency):
 *   pnpm tsx scripts/grant-pro.ts grant  user@example.com
 *   pnpm tsx scripts/grant-pro.ts grant  user@example.com 365   # days
 *   pnpm tsx scripts/grant-pro.ts revoke user@example.com
 *
 * It resolves the user by email against the Better Auth `user` table, then
 * writes the subscriptions row using the same activatePro/deactivatePro helpers
 * the webhook uses — so context/plan checks pick it up immediately.
 */
import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { user } from "@/server/db/auth-schema";
import { activatePro, deactivatePro } from "@/server/lib/billing";

async function main() {
  const [action, email, daysArg] = process.argv.slice(2);

  if (!action || !email || !["grant", "revoke"].includes(action)) {
    console.error(
      "Usage: pnpm tsx scripts/grant-pro.ts <grant|revoke> <email> [days]",
    );
    process.exit(1);
  }

  const [u] = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (!u) {
    console.error(`No user found with email ${email}.`);
    process.exit(1);
  }

  if (action === "grant") {
    const days = daysArg ? Number(daysArg) : 365;
    await activatePro(u.id, {
      status: "active",
      periodEnd: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
    });
    console.log(`✅ Granted Pro to ${u.email} for ${days} days.`);
  } else {
    await deactivatePro(u.id, "admin_revoked");
    console.log(`✅ Revoked Pro from ${u.email}.`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
