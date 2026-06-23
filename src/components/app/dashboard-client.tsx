"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Inbox,
  Reply,
  Layers,
  Flame,
  Download,
  Search,
  Mail,
  Calendar,
  MessagesSquare,
  GitBranch,
  ArrowRight,
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

/**
 * Dashboard layout mirrors the provided design (stat cards → activity chart +
 * recent list → connector cards), re-skinned to Momentum's domain and themed
 * via the design-system CSS vars so it works in light and dark.
 *
 * Data here is representative. Swap each block for live tRPC queries
 * (api.gmail.*, api.calendar.*) where marked — the shapes already match.
 */

const STATS = [
  { label: "Active threads", value: 150, icon: Inbox, color: "var(--primary)" },
  { label: "Pending replies", value: 267, icon: Reply, color: "var(--reply)" },
  {
    label: "Total items",
    value: 680,
    icon: Layers,
    color: "var(--source-calendar)",
  },
  { label: "Urgent now", value: 22, icon: Flame, color: "var(--urgent)" },
];

const ACTIVITY = [
  { month: "Jan", current: 120, previous: 90 },
  { month: "Feb", current: 180, previous: 140 },
  { month: "Mar", current: 150, previous: 160 },
  { month: "Apr", current: 240, previous: 180 },
  { month: "May", current: 210, previous: 220 },
  { month: "Jun", current: 280, previous: 200 },
];

const RECENT = [
  { name: "Growth Plan thread", who: "James Walker", source: "gmail" },
  { name: "Marketing sync", who: "Sarah Chen", source: "calendar" },
  { name: "Product launch", who: "Michael Johnson", source: "slack" },
  { name: "User research PR", who: "Emily Davis", source: "github" },
  { name: "Budget review", who: "David Lee", source: "gmail" },
] as const;

const SOURCE_META = {
  gmail: { Icon: Mail, var: "--source-gmail" },
  calendar: { Icon: Calendar, var: "--source-calendar" },
  slack: { Icon: MessagesSquare, var: "--source-slack" },
  github: { Icon: GitBranch, var: "--source-github" },
} as const;

const CONNECTORS = [
  {
    name: "Gmail",
    desc: "Email auto-sorted into your priority queue.",
    source: "gmail",
  },
  {
    name: "Calendar",
    desc: "Turn threads into meetings in one click.",
    source: "calendar",
  },
  {
    name: "Slack",
    desc: "Important DMs surface beside your mail.",
    source: "slack",
  },
  {
    name: "GitHub",
    desc: "Reviews, mentions and CI in one place.",
    source: "github",
  },
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

  return (
    <div ref={scopeRef} className="mx-auto max-w-7xl p-6 lg:p-8">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Layers className="size-4" /> Dashboard
        </div>
        <Button variant="outline" size="sm">
          <Download className="size-4" /> Export
        </Button>
      </div>

      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Welcome back, {name}!
        </h1>
        {plan === "pro" ? (
          <Badge className="gap-1">Pro</Badge>
        ) : (
          <Badge variant="secondary">Free</Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main column */}
        <div className="min-w-0 space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                {...fade(i)}
                className="bg-card rounded-xl border p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">
                    {s.label}
                  </span>
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
                <p className="text-3xl font-semibold tabular-nums">{s.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Activity chart */}
          <motion.div {...fade(1)} className="bg-card rounded-xl border p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium">Activity over time</h2>
              <Badge variant="secondary" className="text-xs">
                Jan – Jun
              </Badge>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={ACTIVITY}
                  margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="dash-current"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="var(--primary)"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--primary)"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      color: "var(--popover-foreground)",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="current"
                    name="This period"
                    stroke="var(--primary)"
                    strokeWidth={2.5}
                    fill="url(#dash-current)"
                  />
                  <Area
                    type="monotone"
                    dataKey="previous"
                    name="Previous"
                    stroke="var(--muted-foreground)"
                    strokeWidth={1.5}
                    strokeDasharray="5 4"
                    fill="transparent"
                  />
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
                return (
                  <div
                    key={c.name}
                    className="bg-card flex flex-col rounded-xl border p-4"
                  >
                    <span
                      className="mb-3 grid size-9 place-items-center rounded-lg"
                      style={{
                        background: `color-mix(in oklch, ${col} 15%, transparent)`,
                        color: col,
                      }}
                    >
                      <meta.Icon className="size-4" />
                    </span>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-muted-foreground mt-1 flex-1 text-xs">
                      {c.desc}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="secondary" className="flex-1">
                        Open
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        Sync
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          {/* Recent items */}
          <motion.div {...fade(1)} className="bg-card rounded-xl border p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium">Recent items</h2>
              <button className="text-muted-foreground hover:text-foreground">
                <Search className="size-4" />
              </button>
            </div>
            <ul className="space-y-1">
              {RECENT.map((r) => {
                const meta = SOURCE_META[r.source];
                const col = colors?.[r.source] ?? "var(--primary)";
                return (
                  <li
                    key={r.name}
                    className="hover:bg-accent flex items-center gap-3 rounded-lg px-2 py-2"
                  >
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
                      <p className="text-muted-foreground truncate text-xs">
                        {r.who}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </motion.div>

          {/* Upgrade card — only for free users (mirrors the design's promo card) */}
          {plan === "free" ? (
            <motion.div {...fade(2)}>
              <UpgradeCard />
            </motion.div>
          ) : (
            <motion.div {...fade(2)} className="bg-card rounded-xl border p-5">
              <Sparkline />
              <p className="mt-2 text-sm font-medium">You're on Pro</p>
              <p className="text-muted-foreground mt-1 text-xs">
                All AI features are unlocked. Manage your plan anytime.
              </p>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="mt-3 w-full"
              >
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

function Sparkline() {
  return (
    <div className="bg-primary/10 h-10 w-full overflow-hidden rounded-md">
      <svg
        viewBox="0 0 100 24"
        className="h-full w-full"
        preserveAspectRatio="none"
      >
        <polyline
          points="0,18 15,12 30,15 45,6 60,10 75,3 100,8"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}
