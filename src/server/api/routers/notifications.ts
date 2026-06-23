import { getTenant } from "@/server/lib/tenant";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

/**
 * Notifications feed for the top-right bell. Derived live from the user's own
 * data — no separate notifications table to keep in sync. We surface:
 *   • emails received in the last 24h
 *   • meetings starting in the next 24h
 * Read state is client-side (dismissals live in the bell's local state) since
 * this is a glanceable feed, not an audit log.
 */
type Notification = {
  id: string;
  type: "email" | "meeting";
  title: string;
  detail: string;
  timestamp: number;
};

export const notificationsRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const tenant = getTenant(ctx.user.id);
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const out: Notification[] = [];

    try {
      const mail = await tenant.gmail.db.messages.list({ limit: 50, offset: 0 });
      for (const m of mail) {
        const ts = m.data.internalDate
          ? Number(m.data.internalDate)
          : (m.data.createdAt?.getTime() ?? 0);
        if (ts > now - dayMs) {
          out.push({
            id: `mail:${m.entity_id}`,
            type: "email",
            title: m.data.subject ?? "New email",
            detail: (m.data.from ?? "").replace(/<.*>/, "").trim(),
            timestamp: ts,
          });
        }
      }
    } catch {
      // Gmail not connected — skip.
    }

    try {
      const events = await tenant.googlecalendar.db.events.list({
        limit: 50,
        offset: 0,
      });
      for (const e of events) {
        const start = e.data.start?.dateTime ?? e.data.start?.date;
        const ts = start ? new Date(start).getTime() : 0;
        if (ts >= now && ts < now + dayMs) {
          out.push({
            id: `event:${e.entity_id}`,
            type: "meeting",
            title: e.data.summary ?? "Upcoming meeting",
            detail: new Date(ts).toLocaleString(undefined, {
              weekday: "short",
              hour: "numeric",
              minute: "2-digit",
            }),
            timestamp: ts,
          });
        }
      }
    } catch {
      // Calendar not connected — skip.
    }

    return out.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);
  }),
});
