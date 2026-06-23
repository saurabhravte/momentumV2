"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Mail, CalendarClock, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

/**
 * Top-right notification bell. Pulls a derived feed (recent emails + imminent
 * meetings) from api.notifications.list and shows an unread count. Dismissals
 * are local to the session — this is a glanceable feed, not an audit trail.
 */
export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  const feed = api.notifications.list.useQuery(undefined, {
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const items = (feed.data ?? []).filter((n) => !dismissed.has(n.id));
  const unread = items.length;

  // Close on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="hover:bg-accent text-muted-foreground hover:text-foreground relative grid size-9 place-items-center rounded-lg transition-colors"
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="bg-primary text-primary-foreground absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-medium">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="bg-popover text-popover-foreground absolute right-0 z-50 mt-2 w-80 rounded-xl border shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="text-sm font-medium">Notifications</p>
            {unread > 0 && (
              <button
                onClick={() =>
                  setDismissed(
                    new Set([...dismissed, ...items.map((i) => i.id)]),
                  )
                }
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
              >
                <Check className="size-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {feed.isLoading ? (
              <p className="text-muted-foreground px-4 py-6 text-center text-sm">
                Loading…
              </p>
            ) : items.length === 0 ? (
              <p className="text-muted-foreground px-4 py-8 text-center text-sm">
                You&apos;re all caught up.
              </p>
            ) : (
              <ul>
                {items.map((n) => (
                  <li
                    key={n.id}
                    className="hover:bg-accent flex items-start gap-3 px-4 py-3"
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid size-7 shrink-0 place-items-center rounded-md",
                        n.type === "email"
                          ? "bg-[color-mix(in_oklch,var(--source-gmail)_15%,transparent)] text-[var(--source-gmail)]"
                          : "bg-[color-mix(in_oklch,var(--source-calendar)_15%,transparent)] text-[var(--source-calendar)]",
                      )}
                    >
                      {n.type === "email" ? (
                        <Mail className="size-3.5" />
                      ) : (
                        <CalendarClock className="size-3.5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{n.title}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {n.detail}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setDismissed(new Set([...dismissed, n.id]))
                      }
                      className="text-muted-foreground hover:text-foreground text-xs"
                      aria-label="Dismiss"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
