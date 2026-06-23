import { z } from "zod";

import { classifyEmail, summarizeActivity, parseCommand } from "@/server/lib/ai";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

/**
 * AI workflow endpoints (OpenAI): priority triage, catch-me-up digest, and the
 * natural-language command parser powering the ⌘K palette.
 */
export const aiRouter = createTRPCRouter({
  classifyInbox: publicProcedure
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
        input.emails.map(async (e) => ({ id: e.id, ...(await classifyEmail(e)) })),
      );
    }),

  catchMeUp: publicProcedure
    .input(z.object({ items: z.array(z.string()).max(100) }))
    .mutation(async ({ input }) => ({ digest: await summarizeActivity(input.items) })),

  parseCommand: publicProcedure
    .input(z.object({ text: z.string().min(1) }))
    .mutation(async ({ input }) => parseCommand(input.text)),
});
