import { getTenant } from "@/server/lib/tenant";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

/**
 * Dashboard data — replaces the hardcoded STATS / ACTIVITY / RECENT arrays the
 * dashboard shipped with. Everything here is derived live from the signed-in
 * user's own Corsair tenant (their connected Gmail + Calendar), so two users
 * never see the same numbers.
 *
 * Each source is read defensively: if a connector isn't linked yet (no Corsair
 * account for that plugin) the read throws, we swallow it, and the section
 * degrades to an empty/"connect" state instead of 500-ing the page.
 */
type MailItem = {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  timestamp: number;
};

type EventItem = { id: string; summary: string; timestamp: number };

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

async function loadMail(userId: string): Promise<MailItem[]> {
  const tenant = getTenant(userId);
  let rows: Awaited<ReturnType<typeof tenant.gmail.db.messages.list>> = [];
  try {
    rows = await tenant.gmail.db.messages.list({ limit: 200, offset: 0 });
  } catch {
    return [];
  }

  const seen = new Map<string, MailItem>();
  for (const r of rows) {
    const ts = r.data.internalDate
      ? Number(r.data.internalDate)
      : (r.data.createdAt?.getTime() ?? 0);
    const item: MailItem = {
      id: r.entity_id,
      subject: r.data.subject ?? "(no subject)",
      from: r.data.from ?? "",
      snippet: r.data.snippet ?? "",
      timestamp: ts,
    };
    const prev = seen.get(r.entity_id);
    if (!prev || item.timestamp > prev.timestamp) seen.set(r.entity_id, item);
  }
  return [...seen.values()].sort((a, b) => b.timestamp - a.timestamp);
}

async function loadEvents(userId: string): Promise<EventItem[]> {
  const tenant = getTenant(userId);
  let rows: Awaited<ReturnType<typeof tenant.googlecalendar.db.events.list>> = [];
  try {
    rows = await tenant.googlecalendar.db.events.list({ limit: 200, offset: 0 });
  } catch {
    return [];
  }

  return rows
    .map((r) => {
      const start = r.data.start?.dateTime ?? r.data.start?.date;
      return {
        id: r.entity_id,
        summary: r.data.summary ?? "(untitled event)",
        timestamp: start ? new Date(start).getTime() : 0,
      };
    })
    .sort((a, b) => b.timestamp - a.timestamp);
}

export const dashboardRouter = createTRPCRouter({
  /** Stat cards + 6-month activity chart, all derived from real data. */
  overview: protectedProcedure.query(async ({ ctx }) => {
    const [mail, events] = await Promise.all([
      loadMail(ctx.user.id),
      loadEvents(ctx.user.id),
    ]);

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const recentMail = mail.filter((m) => m.timestamp > now - 30 * dayMs);
    const upcoming = events.filter((e) => e.timestamp >= now);

    const activity = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i), 1);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setMonth(next.getMonth() + 1);
      const count = mail.filter(
        (m) => m.timestamp >= d.getTime() && m.timestamp < next.getTime(),
      ).length;
      return { month: MONTH_LABELS[d.getMonth()]!, current: count };
    });

    return {
      gmailConnected: mail.length > 0,
      calendarConnected: events.length > 0,
      stats: {
        emails30d: recentMail.length,
        totalEmails: mail.length,
        upcomingMeetings: upcoming.length,
        totalItems: mail.length + events.length,
      },
      activity,
    };
  }),

  /** Newest items across Gmail + Calendar for the "Recent items" rail. */
  recent: protectedProcedure.query(async ({ ctx }) => {
    const [mail, events] = await Promise.all([
      loadMail(ctx.user.id),
      loadEvents(ctx.user.id),
    ]);

    return [
      ...mail.map((m) => ({
        id: m.id,
        name: m.subject,
        who: m.from.replace(/<.*>/, "").trim() || m.from,
        source: "gmail" as const,
        timestamp: m.timestamp,
      })),
      ...events.map((e) => ({
        id: e.id,
        name: e.summary,
        who: "Calendar",
        source: "calendar" as const,
        timestamp: e.timestamp,
      })),
    ]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 6);
  }),
});
