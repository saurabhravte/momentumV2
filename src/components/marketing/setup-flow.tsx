"use client";

import { motion } from "framer-motion";
import {
  KeyRound,
  Database,
  Plug,
  Sparkles,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/** The five setup stages, rendered as an animated left-to-right pipeline. */
const STAGES = [
  {
    icon: KeyRound,
    title: "Configure env",
    body: ".env from .env.example",
    color: "var(--reply)",
  },
  {
    icon: Database,
    title: "Push schema",
    body: "pnpm db:push",
    color: "var(--source-calendar)",
  },
  {
    icon: Plug,
    title: "Connect Google",
    body: "Sign in with Google",
    color: "var(--done)",
  },
  {
    icon: Sparkles,
    title: "Enable AI",
    body: "OpenAI key (Pro)",
    color: "var(--primary)",
  },
  {
    icon: CreditCard,
    title: "Turn on billing",
    body: "Razorpay keys",
    color: "var(--source-slack)",
  },
];

/** Rough minutes-per-week each automation saves, for the docs payoff chart. */
const SAVINGS = [
  { task: "Triage", mins: 90, color: "var(--urgent)" },
  { task: "Scheduling", mins: 45, color: "var(--source-calendar)" },
  { task: "Search", mins: 35, color: "var(--done)" },
  { task: "Catch-up", mins: 60, color: "var(--waiting)" },
];

export function SetupPipeline() {
  return (
    <div className="bg-card/70 rounded-2xl border p-5 backdrop-blur sm:p-7">
      <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
        {STAGES.map((s, i) => (
          <div
            key={s.title}
            className="flex flex-1 items-center gap-3 md:flex-col md:gap-3"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 10 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.45 }}
              className="flex w-full flex-1 flex-col items-center gap-2 rounded-xl border p-4 text-center"
              style={{
                borderColor: `color-mix(in oklch, ${s.color} 30%, transparent)`,
              }}
            >
              <span
                className="grid size-11 place-items-center rounded-lg"
                style={{
                  background: `color-mix(in oklch, ${s.color} 15%, transparent)`,
                  color: s.color,
                }}
              >
                <s.icon className="size-5" />
              </span>
              <div>
                <p className="text-sm font-medium">{s.title}</p>
                <p className="text-muted-foreground text-xs">{s.body}</p>
              </div>
            </motion.div>
            {i < STAGES.length - 1 && (
              <ArrowRight className="text-muted-foreground size-4 shrink-0 rotate-90 md:rotate-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SavingsChart() {
  return (
    <div className="bg-card/70 rounded-2xl border p-5 backdrop-blur sm:p-7">
      <p className="mb-1 text-sm font-medium">
        Time saved per week, once set up
      </p>
      <p className="text-muted-foreground mb-5 text-xs">
        Estimated minutes the AI features reclaim across a typical week.
      </p>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={SAVINGS}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              vertical={false}
            />
            <XAxis
              dataKey="task"
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
              unit="m"
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.4 }}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                color: "var(--popover-foreground)",
                fontSize: 12,
              }}
            />
            <Bar
              dataKey="mins"
              name="minutes"
              radius={[8, 8, 0, 0]}
              isAnimationActive
              animationDuration={900}
            >
              {SAVINGS.map((s) => (
                <Cell key={s.task} fill={s.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
