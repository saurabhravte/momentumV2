import { z } from "zod";
import { and, eq, inArray, sql } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  corsairAccounts,
  corsairIntegrations,
  corsairEntities,
  corsairEvents,
} from "@/server/db/schema";

/**
 * Connections — one place to see every tool, its live status, and sync /
 * disconnect it. Status is derived from the user's own Corsair tables (an
 * `account` row for the integration under this tenant = connected, plus a cached
 * entity count), so it never lies about what's actually wired up.
 *
 * Gmail & Calendar are bootstrapped from the Google sign-in. Slack & GitHub are
 * marked `configured: false` until their plugins are registered in
 * src/server/corsair.ts — the card shows a "coming soon" state instead of a
 * fake connect button.
 */

// Corsair integration `name` → product metadata for the UI.
const CATALOG = [
  { key: "gmail", name: "Gmail", source: "gmail", configured: true, syncPath: "gmail.refreshInbox" },
  { key: "googlecalendar", name: "Calendar", source: "calendar", configured: true, syncPath: "calendar.refreshEvents" },
  { key: "slack", name: "Slack", source: "slack", configured: false, syncPath: null },
  { key: "github", name: "GitHub", source: "github", configured: false, syncPath: null },
] as const;

type IntegrationKey = (typeof CATALOG)[number]["key"];
const CONNECTABLE = ["gmail", "googlecalendar"] as const;

export const connectionsRouter = createTRPCRouter({
  /** Per-tool connection status + cached item counts for the current user. */
  status: protectedProcedure.query(async ({ ctx }) => {
    // All Corsair accounts under this user's tenant, with their integration name.
    const accounts = await ctx.db
      .select({
        accountId: corsairAccounts.id,
        integrationName: corsairIntegrations.name,
        updatedAt: corsairAccounts.updatedAt,
      })
      .from(corsairAccounts)
      .innerJoin(
        corsairIntegrations,
        eq(corsairAccounts.integrationId, corsairIntegrations.id),
      )
      .where(eq(corsairAccounts.tenantId, ctx.user.id));

    const accountIds = accounts.map((a) => a.accountId);

    // Cached entity counts grouped by account (e.g. emails / events synced).
    const counts =
      accountIds.length > 0
        ? await ctx.db
            .select({
              accountId: corsairEntities.accountId,
              n: sql<number>`count(*)::int`,
            })
            .from(corsairEntities)
            .where(inArray(corsairEntities.accountId, accountIds))
            .groupBy(corsairEntities.accountId)
        : [];

    const countByAccount = new Map(counts.map((c) => [c.accountId, c.n]));

    return CATALOG.map((tool) => {
      const account = accounts.find((a) => a.integrationName === tool.key);
      return {
        key: tool.key,
        name: tool.name,
        source: tool.source,
        configured: tool.configured,
        connected: Boolean(account),
        itemCount: account ? (countByAccount.get(account.accountId) ?? 0) : 0,
        lastSyncedAt: account?.updatedAt ?? null,
      };
    });
  }),

  /**
   * Disconnect a tool: removes its cached data and account row for this tenant.
   * A genuine teardown (not a flag) — reconnecting re-bootstraps from the Google
   * grant on the next sync. Slack/GitHub are rejected since they aren't wired.
   */
  disconnect: protectedProcedure
    .input(z.object({ key: z.enum(CONNECTABLE) }))
    .mutation(async ({ ctx, input }) => {
      const accounts = await ctx.db
        .select({ accountId: corsairAccounts.id })
        .from(corsairAccounts)
        .innerJoin(
          corsairIntegrations,
          eq(corsairAccounts.integrationId, corsairIntegrations.id),
        )
        .where(
          and(
            eq(corsairAccounts.tenantId, ctx.user.id),
            eq(corsairIntegrations.name, input.key as IntegrationKey),
          ),
        );

      const ids = accounts.map((a) => a.accountId);
      if (ids.length === 0) return { disconnected: false };

      // Children first (FKs), then the account rows themselves.
      await ctx.db
        .delete(corsairEvents)
        .where(inArray(corsairEvents.accountId, ids));
      await ctx.db
        .delete(corsairEntities)
        .where(inArray(corsairEntities.accountId, ids));
      await ctx.db
        .delete(corsairAccounts)
        .where(inArray(corsairAccounts.id, ids));

      return { disconnected: true, removedAccounts: ids.length };
    }),
});
