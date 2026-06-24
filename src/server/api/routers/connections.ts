import { z } from "zod";
import { and, eq, inArray, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { setupCorsair } from "corsair";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { corsair } from "@/server/corsair";
import { ensureCorsairGoogle } from "@/server/lib/corsair-bootstrap";
import {
  corsairAccounts,
  corsairIntegrations,
  corsairEntities,
  corsairEvents,
} from "@/server/db/schema";

/**
 * Connections — one place to see every tool, its live status, and connect /
 * sync / disconnect it. Status is derived from the user's own Corsair tables
 * (an `account` row for the integration under this tenant = connected, plus a
 * cached entity count), so it never lies about what's actually wired up.
 *
 * - Gmail & Calendar (OAuth) reuse the Google sign-in grant — connecting just
 *   bootstraps the Corsair account from the tokens Better Auth already stored.
 * - Slack & GitHub (API-key/token) are connected by pasting a token, which is
 *   stored encrypted per-tenant by Corsair.
 */

// Corsair integration `name` → product metadata for the UI.
const CATALOG = [
  {
    key: "gmail",
    name: "Gmail",
    source: "gmail",
    configured: true,
    kind: "google",
  },
  {
    key: "googlecalendar",
    name: "Calendar",
    source: "calendar",
    configured: true,
    kind: "google",
  },
  {
    key: "slack",
    name: "Slack",
    source: "slack",
    configured: true,
    kind: "token",
  },
  {
    key: "github",
    name: "GitHub",
    source: "github",
    configured: true,
    kind: "token",
  },
] as const;

type IntegrationKey = (typeof CATALOG)[number]["key"];
const ALL_KEYS = ["gmail", "googlecalendar", "slack", "github"] as const;
const TOKEN_KEYS = ["slack", "github"] as const;

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
        kind: tool.kind,
        connected: Boolean(account),
        itemCount: account ? (countByAccount.get(account.accountId) ?? 0) : 0,
        lastSyncedAt: account?.updatedAt ?? null,
      };
    });
  }),

  /**
   * Connect Gmail / Calendar by reusing the Google sign-in grant. Bootstraps the
   * Corsair account from the tokens Better Auth already stored, then the normal
   * gmail.refreshInbox / calendar.refreshEvents sync can run.
   */
  connectGoogle: protectedProcedure.mutation(async ({ ctx }) => {
    const ok = await ensureCorsairGoogle(ctx.user.id);
    if (!ok) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message:
          "No Google grant found. Sign out and sign in with Google again to grant Gmail + Calendar access.",
      });
    }
    return { connected: true };
  }),

  /**
   * Connect Slack / GitHub by storing a token (Slack bot/user token `xoxb-…`,
   * GitHub PAT `ghp_…`). Provisions the tenant's account row, then writes the
   * api_key encrypted per-tenant via Corsair.
   */
  connectToken: protectedProcedure
    .input(z.object({ key: z.enum(TOKEN_KEYS), token: z.string().min(10) }))
    .mutation(async ({ ctx, input }) => {
      await setupCorsair(corsair, { tenantId: ctx.user.id });
      const tenant = corsair.withTenant(ctx.user.id);
      const token = input.token.trim();
      if (input.key === "slack") {
        await tenant.slack.keys.set_api_key(token);
      } else {
        await tenant.github.keys.set_api_key(token);
      }
      return { connected: true };
    }),

  /**
   * Disconnect a tool: removes its cached data and account row for this tenant.
   * A genuine teardown (not a flag) — reconnecting re-bootstraps the account.
   */
  disconnect: protectedProcedure
    .input(z.object({ key: z.enum(ALL_KEYS) }))
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
            eq(corsairIntegrations.name, input.key),
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
