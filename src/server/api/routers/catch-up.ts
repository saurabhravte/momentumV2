import { z } from "zod";

import { getTenant } from "@/server/lib/tenant";
import { summarizeActivity } from "@/server/lib/ai";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

/**
 * "Catch Me Up" — the product's USP. The user picks how far back to look
 * (last 3 hours → this month) and gets everything that happened across their
 * connected tools in one place: email, calendar, and (when those connectors
 * land) Slack / GitHub.
 *
 * Plan-aware in a single call:
 *   • Everyone gets the grouped raw items + counts.
 *   • Pro users additionally get an LLM digest (summarizeActivity already
 *     no-ops gracefully when OPENAI_API_KEY is unset).
 * This mirrors the rest of the app: free users get the whole product, the AI
 * layer is the paid upgrade.
 */
const WINDOWS = ["3h", "today", "24h", "week", "month"] as const;
export type CatchUpWindow = (typeof WINDOWS)[number];

function windowStart(win: CatchUpWindow): number {
  const now = new Date();
  switch (win) {
    case "3h":
      return now.getTime() - 3 * 60 * 60 * 1000;
    case "24h":
      return now.getTime() - 24 * 60 * 60 * 1000;
    case "today": {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }
    case "week": {
      const d = new Date(now);
      const day = d.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + mondayOffset);
      return d.getTime();
    }
    case "month": {
      const d = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return d.getTime();
    }
  }
}

export const catchUpRouter = createTRPCRouter({
  summary: protectedProcedure
    .input(z.object({ window: z.enum(WINDOWS).default("24h") }))
    .query(async ({ ctx, input }) => {
      const tenant = getTenant(ctx.user.id);
      const since = windowStart(input.window);

      // ── Email ────────────────────────────────────────────────────────────
      const emails: {
        id: string;
        title: string;
        from: string;
        snippet: string;
        timestamp: number;
      }[] = [];
      try {
        const rows = await tenant.gmail.db.messages.list({
          limit: 200,
          offset: 0,
        });
        for (const m of rows) {
          const ts = m.data.internalDate
            ? Number(m.data.internalDate)
            : (m.data.createdAt?.getTime() ?? 0);
          if (ts >= since) {
            emails.push({
              id: m.entity_id,
              title: m.data.subject ?? "(no subject)",
              from: (m.data.from ?? "").replace(/<.*>/, "").trim(),
              snippet: m.data.snippet ?? "",
              timestamp: ts,
            });
          }
        }
        emails.sort((a, b) => b.timestamp - a.timestamp);
      } catch {
        // Gmail not connected — leave empty.
      }

      // ── Calendar ──────────────────────────────────────────────────────────
      const meetings: { id: string; title: string; timestamp: number }[] = [];
      try {
        const rows = await tenant.googlecalendar.db.events.list({
          limit: 200,
          offset: 0,
        });
        for (const e of rows) {
          const start = e.data.start?.dateTime ?? e.data.start?.date;
          const ts = start ? new Date(start).getTime() : 0;
          if (ts >= since) {
            meetings.push({
              id: e.entity_id,
              title: e.data.summary ?? "(untitled event)",
              timestamp: ts,
            });
          }
        }
        meetings.sort((a, b) => a.timestamp - b.timestamp);
      } catch {
        // Calendar not connected — leave empty.
      }

      // ── Slack / GitHub ────────────────────────────────────────────────────
      // Wired the same way once those Corsair plugins are registered in
      // src/server/corsair.ts. Shapes kept here so the UI is already built for
      // them and lighting them up is a data-only change.
      const slack: { id: string; title: string; from: string }[] = [];
      const github: { id: string; title: string; repo: string }[] = [];

      const counts = {
        emails: emails.length,
        meetings: meetings.length,
        slack: slack.length,
        github: github.length,
        total: emails.length + meetings.length + slack.length + github.length,
      };

      // ── AI digest (Pro only) ──────────────────────────────────────────────
      let digest: string | null = null;
      if (ctx.plan === "pro" && counts.total > 0) {
        const items = [
          ...emails.map(
            (e) => `Email from ${e.from}: ${e.title} — ${e.snippet}`,
          ),
          ...meetings.map(
            (m) =>
              `Meeting: ${m.title} at ${new Date(m.timestamp).toLocaleString()}`,
          ),
        ].slice(0, 100);
        digest = await summarizeActivity(items);
      }

      return {
        window: input.window,
        since,
        plan: ctx.plan,
        digestAvailable: ctx.plan === "pro",
        digest,
        counts,
        emails: emails.slice(0, 25),
        meetings: meetings.slice(0, 25),
        slack,
        github,
      };
    }),
});
