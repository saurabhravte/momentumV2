import { z } from "zod";

import {
  classifyEmail,
  summarizeActivity,
  parseCommand,
} from "@/server/lib/ai";
import { createTRPCRouter, paidProcedure } from "@/server/api/trpc";

/**
 * AI workflow endpoints (OpenAI): priority triage, catch-me-up digest, and the
 * natural-language command parser powering the ⌘K palette.
 *
 * ── Paywall ───────────────────────────────────────────────────────────────
 * Every endpoint here uses `paidProcedure`, so only signed-in users on the
 * "pro" plan can reach it. Free users can still use the entire rest of the
 * product (inbox, calendar, search, dashboard) — they just get a typed
 * FORBIDDEN/PAYWALL error from these three, which the client turns into the
 * upgrade prompt.
 */
export const aiRouter = createTRPCRouter({
  classifyInbox: paidProcedure
    .input(
      z.object({
        emails: z
          .array(
            z.object({
              id: z.string(),
              subject: z.string(),
              from: z.string(),
              snippet: z.string(),
            }),
          )
          .max(50),
      }),
    )
    .mutation(async ({ input }) => {
      return Promise.all(
        input.emails.map(async (e) => ({
          id: e.id,
          ...(await classifyEmail(e)),
        })),
      );
    }),

  catchMeUp: paidProcedure
    .input(z.object({ items: z.array(z.string()).max(100) }))
    .mutation(async ({ input }) => ({
      digest: await summarizeActivity(input.items),
    })),

  parseCommand: paidProcedure
    .input(z.object({ text: z.string().min(1) }))
    .mutation(async ({ input }) => parseCommand(input.text)),
});
