"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Inbox,
  Reply,
  Layers,
  CalendarClock,
  Mail,
  Calendar,
  MessagesSquare,
  GitBranch,
  ArrowRight,
  Plug,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UpgradeCard } from "@/components/billing/upgrade-card";
import { useSourceColors } from "@/lib/use-source-colors";
import { getGreeting } from "@/lib/greeting";
import { api } from "@/trpc/react";

/**
 * Dashboard, now fully dynamic. The stat cards, activity chart and recent list
 * are driven by live tRPC queries scoped to the signed-in user
 * (api.dashboard.*), and the headline is a time-of-day greeting that changes
 * morning → night. When Gmail isn't connected yet we show a connect prompt
 * instead of fake numbers.
 */
const SOURCE_META = {
  gmail: { Icon: Mail, var: "--source-gmail" },
  calendar: { Icon: Calendar, var: "--source-calendar" },
  slack: { Icon: MessagesSquare, var: "--source-slack" },
  github: { Icon: GitBranch, var: "--source-github" },
} as const;

const CONNECTORS = [
  { name: "Gmail", desc: "Email auto-sorted into your priority queue.", source: "gmail" },
  { name: "Calendar", desc: "Turn threads into meetings in one click.", source: "calendar" },
  { name: "Slack", desc: "Important DMs surface beside your mail.", source: "slack" },
  { name: "GitHub", desc: "Reviews, mentions and CI in one place.", source: "github" },
] as const;

function fade(i = 0) {
  return {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay: i * 0.06 },
  };
}

export function DashboardClient({
  name,
  plan,
}: {
  name: string;
  plan: "free" | "pro";
}) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const colors = useSourceColors(scopeRef);

  // Greeting computed on the client after mount so the time-of-day text never
  // mismatches the server-rendered HTML.
  const [greeting, setGreeting] = useState<{ headline: string; sub: string }>({
    headline: `Welcome back, ${name.split(" ")[0] ?? name}`,
    sub: "",
  });
  useEffect(() => {
    setGreeting(getGreeting(name));
  }, [name]);

  const overview = api.dashboard.overview.useQuery();
  const recent = api.dashboard.recent.useQuery();

  const stats = overview.data?.stats;
  const STAT_CARDS = [
    { label: "Emails (30d)", value: stats?.emails30d, icon: Inbox, color: "var(--primary)" },
    { label: "Total emails", value: stats?.totalEmails, icon: Reply, color: "var(--reply)" },
    { label: "Upcoming meetings", value: stats?.upcomingMeetings, icon: CalendarClock, color: "var(--source-calendar)" },
    { label: "Items tracked", value: stats?.totalItems, icon: Layers, color: "var(--urgent)" },
  ];

  const notConnected =
    overview.data && !overview.data.gmailConnected && !overview.data.calendarConnected;

  return (
    <div ref={scopeRef} className="mx-auto max-w-7xl p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {greeting.headline}
          </h1>
          {greeting.sub && (
            <p className="text-muted-foreground mt-1 text-sm">{greeting.sub}</p>
          )}
        </div>
        {plan === "pro" ? (
          <Badge className="gap-1">Pro</Badge>
        ) : (
          <Badge variant="secondary">Free</Badge>
        )}
      </div>

      {notConnected && (
        <div className="bg-card mb-6 flex items-center gap-4 rounded-xl border border-dashed p-5">
          <span className="bg-primary/12 text-primary grid size-10 place-items-center rounded-lg">
            <Plug className="size-5" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium">Connect Gmail to bring this to life</p>
            <p className="text-muted-foreground text-xs">
              Once your inbox syncs, these cards fill with your real activity.
            </p>
          </div>
          <Button asChild size="sm">
            <Link href="/inbox">Sync inbox</Link>
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {STAT_CARDS.map((s, i) => (
              <motion.div key={s.label} {...fade(i)} className="bg-card rounded-xl border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">{s.label}</span>
                  <span
                    className="grid size-8 place-items-center rounded-lg"
                    style={{
                      background: `color-mix(in oklch, ${s.color} 15%, transparent)`,
                      color: s.color,
                    }}
                  >
                    <s.icon className="size-4" />
                  </span>
                </div>
                <p className="text-3xl font-semibold tabular-nums">
                  {overview.isLoading ? "…" : (s.value ?? 0)}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Activity chart */}
          <motion.div {...fade(1)} className="bg-card rounded-xl border p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium">Email volume</h2>
              <Badge variant="secondary" className="text-xs">Last 6 months</Badge>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={overview.data?.activity ?? []}
                  margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="dash-current" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      color: "var(--popover-foreground)",
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="current" name="Emails" stroke="var(--primary)" strokeWidth={2.5} fill="url(#dash-current)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Connectors row */}
          <motion.div {...fade(2)}>
            <h2 className="mb-3 text-sm font-medium">Your connectors</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {CONNECTORS.map((c) => {
                const meta = SOURCE_META[c.source];
                const col = colors?.[c.source] ?? "var(--primary)";
                const live =
                  c.source === "gmail"
                    ? !!overview.data?.gmailConnected
                    : c.source === "calendar"
                      ? !!overview.data?.calendarConnected
                      : false;
                return (
                  <div key={c.name} className="bg-card flex flex-col rounded-xl border p-4">
                    <span
                      className="mb-3 grid size-9 place-items-center rounded-lg"
                      style={{
                        background: `color-mix(in oklch, ${col} 15%, transparent)`,
                        color: col,
                      }}
                    >
                      <meta.Icon className="size-4" />
                    </span>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{c.name}</p>
                      {live && (
                        <span className="size-1.5 rounded-full bg-emerald-500" title="Connected" />
                      )}
                    </div>
                    <p className="text-muted-foreground mt-1 flex-1 text-xs">{c.desc}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          <motion.div {...fade(1)} className="bg-card rounded-xl border p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium">Recent items</h2>
            </div>
            {recent.isLoading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : (recent.data?.length ?? 0) === 0 ? (
              <p className="text-muted-foreground text-sm">Nothing yet.</p>
            ) : (
              <ul className="space-y-1">
                {recent.data!.map((r) => {
                  const meta = SOURCE_META[r.source];
                  const col = colors?.[r.source] ?? "var(--primary)";
                  return (
                    <li key={r.id} className="hover:bg-accent flex items-center gap-3 rounded-lg px-2 py-2">
                      <span
                        className="grid size-7 shrink-0 place-items-center rounded-md"
                        style={{
                          background: `color-mix(in oklch, ${col} 15%, transparent)`,
                          color: col,
                        }}
                      >
                        <meta.Icon className="size-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{r.name}</p>
                        <p className="text-muted-foreground truncate text-xs">{r.who}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.div>

          {plan === "free" ? (
            <motion.div {...fade(2)}>
              <UpgradeCard />
            </motion.div>
          ) : (
            <motion.div {...fade(2)} className="bg-card rounded-xl border p-5">
              <p className="text-sm font-medium">You&apos;re on Pro</p>
              <p className="text-muted-foreground mt-1 text-xs">
                All AI features are unlocked. Manage your plan anytime.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                <Link href="/billing">
                  Manage billing <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
