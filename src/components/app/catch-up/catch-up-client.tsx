"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Zap,
  Mail,
  CalendarClock,
  MessagesSquare,
  GitBranch,
  Sparkles,
  Lock,
  RefreshCw,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";

/**
 * "Catch Me Up" — pick how far back to look and get everything that happened
 * across your tools in one place. The window buttons map 1:1 to the server
 * enum; the AI digest at the top is Pro-only (free users still see every raw
 * item, just without the summary).
 */
const WINDOWS = [
  { key: "3h", label: "Last 3 hours" },
  { key: "today", label: "Today" },
  { key: "24h", label: "Last 24 hours" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
] as const;

type WindowKey = (typeof WINDOWS)[number]["key"];

export function CatchUpClient() {
  const [win, setWin] = useState<WindowKey>("24h");
  const summary = api.catchUp.summary.useQuery({ window: win });
  const data = summary.data;

  return (
    <div className="mx-auto max-w-4xl p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="bg-primary/12 text-primary grid size-10 place-items-center rounded-xl">
            <Zap className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Catch Me Up
            </h1>
            <p className="text-muted-foreground text-sm">
              Everything you missed, in one place.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => summary.refetch()}
          disabled={summary.isFetching}
        >
          <RefreshCw
            className={cn("size-4", summary.isFetching && "animate-spin")}
          />
          Refresh
        </Button>
      </div>

      {/* Window selector */}
      <div className="mb-6 flex flex-wrap gap-2">
        {WINDOWS.map((w) => (
          <button
            key={w.key}
            onClick={() => setWin(w.key)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm transition-colors",
              win === w.key
                ? "bg-primary text-primary-foreground border-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {w.label}
          </button>
        ))}
      </div>

      {/* AI digest */}
      <div className="bg-card mb-6 rounded-xl border p-5">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="text-primary size-4" />
          <h2 className="text-sm font-medium">Summary</h2>
        </div>
        {summary.isLoading ? (
          <p className="text-muted-foreground text-sm">Gathering your activity…</p>
        ) : data?.digestAvailable ? (
          data.counts.total === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nothing new in this window. Enjoy the quiet.
            </p>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {data.digest ?? "No summary available."}
            </p>
          )
        ) : (
          <div className="flex items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">
              <Lock className="mr-1 inline size-3.5" />
              The AI digest is a Pro feature. You can still see every item below.
            </p>
            <Button asChild size="sm">
              <Link href="/billing">Upgrade</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Counts */}
      {data && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <CountCard label="Emails" value={data.counts.emails} />
          <CountCard label="Meetings" value={data.counts.meetings} />
          <CountCard label="Slack" value={data.counts.slack} muted />
          <CountCard label="GitHub" value={data.counts.github} muted />
        </div>
      )}

      {/* Grouped items */}
      <div className="space-y-6">
        <Section
          title="Email"
          icon={Mail}
          source="--source-gmail"
          items={(data?.emails ?? []).map((e) => ({
            id: e.id,
            primary: e.title,
            secondary: e.from || e.snippet,
          }))}
        />
        <Section
          title="Calendar"
          icon={CalendarClock}
          source="--source-calendar"
          items={(data?.meetings ?? []).map((m) => ({
            id: m.id,
            primary: m.title,
            secondary: new Date(m.timestamp).toLocaleString(),
          }))}
        />
        <Section
          title="Slack"
          icon={MessagesSquare}
          source="--source-slack"
          items={[]}
          emptyHint="Connect Slack to surface DMs and mentions here."
        />
        <Section
          title="GitHub"
          icon={GitBranch}
          source="--source-github"
          items={[]}
          emptyHint="Connect GitHub to see reviews, mentions and CI."
        />
      </div>
    </div>
  );
}

function CountCard({
  label,
  value,
  muted,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-card rounded-xl border p-4",
        muted && value === 0 && "opacity-60",
      )}
    >
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  source,
  items,
  emptyHint,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  source: string;
  items: { id: string; primary: string; secondary: string }[];
  emptyHint?: string;
}) {
  if (items.length === 0 && !emptyHint) return null;

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span
          className="grid size-7 place-items-center rounded-md"
          style={{
            background: `color-mix(in oklch, var(${source}) 15%, transparent)`,
            color: `var(${source})`,
          }}
        >
          <Icon className="size-3.5" />
        </span>
        <h3 className="text-sm font-medium">{title}</h3>
        <span className="text-muted-foreground text-xs">({items.length})</span>
      </div>
      {items.length === 0 ? (
        <p className="text-muted-foreground pl-9 text-xs">{emptyHint}</p>
      ) : (
        <ul className="space-y-1">
          {items.map((it) => (
            <li
              key={it.id}
              className="bg-card hover:bg-accent rounded-lg border px-3 py-2"
            >
              <p className="truncate text-sm">{it.primary}</p>
              <p className="text-muted-foreground truncate text-xs">
                {it.secondary}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
