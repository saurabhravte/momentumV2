"use client";

import { useState } from "react";
import {
  Mail,
  Calendar,
  MessagesSquare,
  GitBranch,
  RefreshCw,
  Plug,
  Check,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getWeekBounds } from "@/lib/week";
import { api } from "@/trpc/react";

const ICONS = {
  gmail: Mail,
  calendar: Calendar,
  slack: MessagesSquare,
  github: GitBranch,
} as const;

const DESC: Record<string, string> = {
  gmail: "Email synced into your priority inbox and search.",
  calendar: "Events powering your week view and Catch Me Up.",
  slack: "Surface important DMs and mentions beside your mail.",
  github: "Reviews, mentions and CI in one place.",
};

export function ConnectionsClient() {
  const utils = api.useUtils();
  const status = api.connections.status.useQuery();
  const [busy, setBusy] = useState<string | null>(null);

  const refreshInbox = api.gmail.refreshInbox.useMutation();
  const refreshEvents = api.calendar.refreshEvents.useMutation();
  const disconnect = api.connections.disconnect.useMutation();

  const week = getWeekBounds(0);

  const sync = async (key: string) => {
    setBusy(key);
    try {
      if (key === "gmail") await refreshInbox.mutateAsync();
      if (key === "googlecalendar")
        await refreshEvents.mutateAsync({
          weekStart: week.start.toISOString(),
          weekEnd: week.end.toISOString(),
        });
      await utils.connections.status.invalidate();
      await utils.dashboard.overview.invalidate();
    } finally {
      setBusy(null);
    }
  };

  const doDisconnect = async (key: "gmail" | "googlecalendar", name: string) => {
    if (
      !window.confirm(
        `Disconnect ${name}? This removes its synced data from Momentum. You can reconnect and sync again anytime.`,
      )
    )
      return;
    setBusy(key);
    try {
      await disconnect.mutateAsync({ key });
      await utils.connections.status.invalidate();
      await utils.dashboard.overview.invalidate();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Connections</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Connect your tools once — Momentum keeps everything in sync.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {(status.data ?? CATALOG_SKELETON).map((tool) => {
          const Icon = ICONS[tool.source] ?? Plug;
          const col = `var(--source-${tool.source})`;
          const isBusy = busy === tool.key;
          const connectable =
            tool.key === "gmail" || tool.key === "googlecalendar";

          return (
            <div
              key={tool.key}
              className={cn(
                "bg-card flex flex-col rounded-xl border p-5",
                !tool.configured && "opacity-75",
              )}
            >
              <div className="flex items-start justify-between">
                <span
                  className="grid size-10 place-items-center rounded-lg"
                  style={{
                    background: `color-mix(in oklch, ${col} 15%, transparent)`,
                    color: col,
                  }}
                >
                  <Icon className="size-5" />
                </span>
                <StatusPill
                  configured={tool.configured}
                  connected={tool.connected}
                />
              </div>

              <p className="mt-3 font-medium">{tool.name}</p>
              <p className="text-muted-foreground mt-1 flex-1 text-xs">
                {DESC[tool.source] ?? ""}
              </p>

              {tool.configured && tool.connected && (
                <p className="text-muted-foreground mt-3 text-xs">
                  {tool.itemCount.toLocaleString()} items synced
                  {tool.lastSyncedAt && (
                    <>
                      {" · "}
                      {new Date(tool.lastSyncedAt).toLocaleDateString(
                        undefined,
                        { month: "short", day: "numeric" },
                      )}
                    </>
                  )}
                </p>
              )}

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                {!tool.configured ? (
                  <Button size="sm" variant="secondary" className="flex-1" disabled>
                    Coming soon
                  </Button>
                ) : tool.connected ? (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                      disabled={isBusy}
                      onClick={() => sync(tool.key)}
                    >
                      {isBusy ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <RefreshCw className="size-4" />
                      )}
                      Sync
                    </Button>
                    {connectable && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        disabled={isBusy}
                        onClick={() =>
                          doDisconnect(
                            tool.key as "gmail" | "googlecalendar",
                            tool.name,
                          )
                        }
                      >
                        Disconnect
                      </Button>
                    )}
                  </>
                ) : (
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={isBusy}
                    onClick={() => sync(tool.key)}
                  >
                    {isBusy ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Plug className="size-4" />
                    )}
                    Connect &amp; sync
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-muted-foreground mt-6 text-xs">
        Gmail and Calendar connect through your Google sign-in. Disconnecting
        removes synced data from Momentum but never touches your Google account.
      </p>
    </div>
  );
}

function StatusPill({
  configured,
  connected,
}: {
  configured: boolean;
  connected: boolean;
}) {
  if (!configured)
    return (
      <span className="text-muted-foreground bg-muted rounded-full px-2 py-0.5 text-[11px]">
        Not configured
      </span>
    );
  if (connected)
    return (
      <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-600 dark:text-emerald-400">
        <Check className="size-3" /> Connected
      </span>
    );
  return (
    <span className="text-muted-foreground bg-muted rounded-full px-2 py-0.5 text-[11px]">
      Not connected
    </span>
  );
}

// Render placeholder cards while the status query loads.
const CATALOG_SKELETON = [
  { key: "gmail", name: "Gmail", source: "gmail", configured: true, connected: false, itemCount: 0, lastSyncedAt: null },
  { key: "googlecalendar", name: "Calendar", source: "calendar", configured: true, connected: false, itemCount: 0, lastSyncedAt: null },
  { key: "slack", name: "Slack", source: "slack", configured: false, connected: false, itemCount: 0, lastSyncedAt: null },
  { key: "github", name: "GitHub", source: "github", configured: false, connected: false, itemCount: 0, lastSyncedAt: null },
] as const;
