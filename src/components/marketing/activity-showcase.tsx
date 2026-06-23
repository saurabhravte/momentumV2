"use client";

import { useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Mail, Calendar, MessagesSquare, GitBranch } from "lucide-react";

/**
 * Animated landing-page showcase: a single view that pulls "all your apps in
 * place" — Gmail, Calendar, Slack, GitHub — into one weekly activity chart.
 * Inspired by the dashboard progress chart from the original Momentum project,
 * rebuilt with recharts. Colors are read from the design-system CSS variables
 * so it themes cleanly in light and dark.
 */

const SOURCES = [
  { key: "gmail", label: "Gmail", varName: "--source-gmail", Icon: Mail },
  { key: "calendar", label: "Calendar", varName: "--source-calendar", Icon: Calendar },
  { key: "slack", label: "Slack", varName: "--source-slack", Icon: MessagesSquare },
  { key: "github", label: "GitHub", varName: "--source-github", Icon: GitBranch },
] as const;

type SourceKey = (typeof SOURCES)[number]["key"];

const DATA: Array<{ day: string } & Record<SourceKey, number>> = [
  { day: "Mon", gmail: 28, calendar: 5, slack: 22, github: 7 },
  { day: "Tue", gmail: 34, calendar: 8, slack: 30, github: 12 },
  { day: "Wed", gmail: 22, calendar: 6, slack: 26, github: 9 },
  { day: "Thu", gmail: 41, calendar: 9, slack: 35, github: 15 },
  { day: "Fri", gmail: 30, calendar: 7, slack: 28, github: 18 },
  { day: "Sat", gmail: 9, calendar: 2, slack: 6, github: 4 },
  { day: "Sun", gmail: 6, calendar: 1, slack: 4, github: 3 },
];

type Colors = Record<SourceKey, string>;

/** Read the live computed value of each source CSS var, re-reading on theme change. */
function useSourceColors(scopeRef: React.RefObject<HTMLElement | null>): Colors | null {
  const [colors, setColors] = useState<Colors | null>(null);

  useEffect(() => {
    const read = () => {
      const el = scopeRef.current ?? document.documentElement;
      const cs = getComputedStyle(el);
      const next = {} as Colors;
      for (const s of SOURCES) {
        next[s.key] = cs.getPropertyValue(s.varName).trim() || "currentColor";
      }
      setColors(next);
    };
    read();
    // Re-read when the theme class on <html> flips (next-themes toggles it).
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, [scopeRef]);

  return colors;
}

function CountUp({ to, delay = 0 }: { to: number; delay?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    let start = 0;
    const startAt = performance.now() + delay;
    const tick = (t: number) => {
      if (t < startAt) {
        raf = requestAnimationFrame(tick);
        return;
      }
      if (!start) start = t;
      const p = Math.min(1, (t - start) / 900);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, delay]);
  return <>{n}</>;
}

export function ActivityShowcase() {
  const scopeRef = useRef<HTMLDivElement>(null);
  const colors = useSourceColors(scopeRef);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const totals = SOURCES.map((s) => ({
    ...s,
    total: DATA.reduce((sum, d) => sum + d[s.key], 0),
  }));

  return (
    <div
      ref={scopeRef}
      className={`relative overflow-hidden rounded-2xl border bg-card shadow-xl transition-all duration-700 ${
        mounted ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="flex flex-col gap-1 border-b p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-base font-medium">This week, across your tools</h3>
          <p className="text-sm text-muted-foreground">
            Everything that needed you — Gmail, Calendar, Slack, and GitHub — in one place.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary sm:self-auto">
          <span className="size-1.5 animate-pulse rounded-full bg-primary" />
          Live sync
        </span>
      </div>

      {/* Per-source totals with count-up animation */}
      <div className="grid grid-cols-2 gap-px bg-border/60 sm:grid-cols-4">
        {totals.map((s, i) => (
          <div key={s.key} className="bg-card p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <s.Icon className="size-3.5" style={{ color: `var(${s.varName})` }} />
              {s.label}
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">
              <CountUp to={s.total} delay={i * 120} />
            </div>
          </div>
        ))}
      </div>

      {/* Stacked area chart */}
      <div className="h-64 w-full p-4 pt-5">
        {colors && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={DATA} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                {SOURCES.map((s) => (
                  <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors[s.key]} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={colors[s.key]} stopOpacity={0.04} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={32}
              />
              <Tooltip
                cursor={{ stroke: "var(--border)" }}
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                  color: "var(--popover-foreground)",
                  boxShadow: "0 8px 30px rgb(0 0 0 / 0.12)",
                }}
                labelStyle={{ color: "var(--muted-foreground)", marginBottom: 4 }}
              />
              {SOURCES.map((s, i) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stackId="activity"
                  stroke={colors[s.key]}
                  strokeWidth={2}
                  fill={`url(#fill-${s.key})`}
                  isAnimationActive
                  animationBegin={i * 180}
                  animationDuration={1100}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
