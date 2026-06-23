"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
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
 * "All your tools, one place." Four sources (Gmail / Calendar / Slack / GitHub)
 * animate in as connected nodes, then resolve into a single STACKED activity
 * chart — the literal picture of four streams becoming one queue. Colors come
 * from the design-system CSS vars so it themes in light + dark.
 */

const SOURCES = [
  { key: "gmail", label: "Gmail", varName: "--source-gmail", Icon: Mail },
  {
    key: "calendar",
    label: "Calendar",
    varName: "--source-calendar",
    Icon: Calendar,
  },
  {
    key: "slack",
    label: "Slack",
    varName: "--source-slack",
    Icon: MessagesSquare,
  },
  {
    key: "github",
    label: "GitHub",
    varName: "--source-github",
    Icon: GitBranch,
  },
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

function useSourceColors(
  scopeRef: React.RefObject<HTMLElement | null>,
): Colors | null {
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
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, [scopeRef]);
  return colors;
}

export function ConnectShowcase() {
  const scopeRef = useRef<HTMLDivElement>(null);
  const colors = useSourceColors(scopeRef);

  return (
    <div
      ref={scopeRef}
      className="bg-card/70 rounded-2xl border p-5 backdrop-blur sm:p-7"
    >
      {/* Source nodes "feeding in" */}
      <motion.div
        className="mb-6 flex flex-wrap items-center justify-center gap-3"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={{ show: { transition: { staggerChildren: 0.1 } } }}
      >
        {SOURCES.map((s) => (
          <motion.span
            key={s.key}
            variants={{
              hidden: { opacity: 0, y: 12, scale: 0.9 },
              show: { opacity: 1, y: 0, scale: 1 },
            }}
            className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm"
            style={{
              color: colors?.[s.key],
              background: colors
                ? `color-mix(in oklch, ${colors[s.key]} 12%, transparent)`
                : undefined,
              borderColor: colors
                ? `color-mix(in oklch, ${colors[s.key]} 35%, transparent)`
                : undefined,
            }}
          >
            <s.Icon className="size-4" />
            {s.label}
          </motion.span>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="h-64 w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={DATA}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <defs>
              {colors &&
                SOURCES.map((s) => (
                  <linearGradient
                    key={s.key}
                    id={`g-${s.key}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={colors[s.key]}
                      stopOpacity={0.55}
                    />
                    <stop
                      offset="100%"
                      stopColor={colors[s.key]}
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                ))}
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              vertical={false}
            />
            <XAxis
              dataKey="day"
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
            {colors &&
              SOURCES.map((s) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stackId="all"
                  stroke={colors[s.key]}
                  strokeWidth={2}
                  fill={`url(#g-${s.key})`}
                  isAnimationActive
                  animationDuration={900}
                />
              ))}
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <p className="text-muted-foreground mt-4 text-center text-sm">
        One stacked queue — every source you connect adds a layer, never another
        tab.
      </p>
    </div>
  );
}
