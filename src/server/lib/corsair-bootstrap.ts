import "server-only";
import { and, eq } from "drizzle-orm";
import { setupCorsair } from "corsair";

import { env } from "@/env";
import { db } from "@/server/db";
import { account } from "@/server/db/auth-schema";
import { corsair } from "@/server/corsair";

/**
 * Corsair bootstrap — the missing link that made Gmail & Calendar never connect.
 *
 * Better Auth completes the Google sign-in (offline + consent, with the
 * gmail.modify + calendar scopes) and stores the resulting access/refresh
 * tokens in its own `account` table. Nothing, however, ever handed that grant
 * to Corsair — so `corsair.withTenant(userId).gmail.api.*` had no credentials
 * and every refresh threw. The "Connect & sync" button looked wired but could
 * never succeed.
 *
 * Because Corsair refreshes Google tokens using the SAME OAuth client
 * (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET), we can reuse the single sign-in
 * grant instead of forcing a second consent screen:
 *
 *   1. Provision the tenant's integration + account rows (idempotent).
 *   2. Set the shared, integration-level Google client id/secret so Corsair can
 *      refresh expired access tokens on its own.
 *   3. Copy the user's access/refresh tokens into the per-tenant gmail &
 *      googlecalendar accounts.
 *
 * Safe to call on every connect / sync — every step is idempotent.
 */

let integrationCredsSet = false;

/** Set the shared Google OAuth client id/secret once per process. */
async function ensureGoogleIntegrationCreds() {
  if (integrationCredsSet) return;
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return;

  // Integration-level creds are global (no tenant) on a multi-tenant instance.
  await corsair.keys.gmail.set_client_id(env.GOOGLE_CLIENT_ID);
  await corsair.keys.gmail.set_client_secret(env.GOOGLE_CLIENT_SECRET);
  await corsair.keys.googlecalendar.set_client_id(env.GOOGLE_CLIENT_ID);
  await corsair.keys.googlecalendar.set_client_secret(env.GOOGLE_CLIENT_SECRET);

  integrationCredsSet = true;
}

/**
 * Returns the Google access/refresh tokens Better Auth stored for this user,
 * or null if they haven't signed in with Google (yet).
 */
async function readGoogleGrant(userId: string) {
  const [row] = await db
    .select({
      accessToken: account.accessToken,
      refreshToken: account.refreshToken,
    })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "google")))
    .limit(1);

  if (!row?.accessToken && !row?.refreshToken) return null;
  return row;
}

/**
 * Wire the signed-in user's Google grant into Corsair for Gmail + Calendar.
 * Returns whether a usable grant was found and applied.
 */
export async function ensureCorsairGoogle(userId: string): Promise<boolean> {
  const grant = await readGoogleGrant(userId);
  if (!grant) return false;

  // Provision corsair_integrations + corsair_accounts rows (and DEKs) for this
  // tenant. Idempotent — skips anything that already exists.
  await setupCorsair(corsair, { tenantId: userId });
  await ensureGoogleIntegrationCreds();

  const tenant = corsair.withTenant(userId);

  // Push the grant into both Google-backed accounts. Corsair refreshes the
  // access token from the refresh token + integration client creds as needed.
  for (const plugin of [tenant.gmail, tenant.googlecalendar]) {
    if (grant.accessToken)
      await plugin.keys.set_access_token(grant.accessToken);
    if (grant.refreshToken)
      await plugin.keys.set_refresh_token(grant.refreshToken);
  }

  return true;
}
