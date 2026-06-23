import { z } from "zod";
import { eq } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { userPreferences } from "@/server/db/schema";

/**
 * Per-user app preferences for the Settings tab. The user's name/avatar live in
 * the Better Auth `user` table and are updated client-side via
 * authClient.updateUser(); this router owns everything that is purely product
 * customisation.
 */
const DEFAULTS = {
  greetingStyle: "auto",
  density: "comfortable",
  accentSource: "gmail",
  notificationsEnabled: "on",
} as const;

export const preferencesRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, ctx.user.id))
      .limit(1);

    return {
      greetingStyle: row?.greetingStyle ?? DEFAULTS.greetingStyle,
      density: row?.density ?? DEFAULTS.density,
      accentSource: row?.accentSource ?? DEFAULTS.accentSource,
      notificationsEnabled:
        row?.notificationsEnabled ?? DEFAULTS.notificationsEnabled,
    };
  }),

  update: protectedProcedure
    .input(
      z.object({
        greetingStyle: z.enum(["auto", "morning", "neutral"]).optional(),
        density: z.enum(["comfortable", "compact"]).optional(),
        accentSource: z
          .enum(["gmail", "calendar", "slack", "github"])
          .optional(),
        notificationsEnabled: z.enum(["on", "off"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(userPreferences)
        .values({ userId: ctx.user.id, ...input })
        .onConflictDoUpdate({
          target: userPreferences.userId,
          set: { ...input, updatedAt: new Date() },
        });
      return { ok: true };
    }),
});
