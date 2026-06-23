import { corsair } from "@/server/corsair";

/**
 * Per-user tenant isolation.
 *
 * Previously this used a single global TENANT_ID, so every user shared one
 * Corsair tenant. For real multi-user we scope the tenant to the signed-in
 * user's id — each user's Gmail/Calendar accounts, cached entities and events
 * live under their own tenant and are never visible to anyone else.
 *
 * Pass the user id from a protected tRPC procedure: `getTenant(ctx.user.id)`.
 * The optional fallback keeps local scripts / dev seeding working.
 */
export function getTenant(userId?: string) {
  const tenantId = userId ?? process.env.TENANT_ID ?? "dev";
  return corsair.withTenant(tenantId);
}
