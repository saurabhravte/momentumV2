import Link from "next/link";
import {
  Inbox,
  CalendarClock,
  Sparkles,
  Command,
  Search,
  ShieldCheck,
  ArrowRight,
  GitBranch,
  MessagesSquare,
  Check,
  Lock,
  Mail,
  Calendar,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/marketing/logo";
import { ActivityShowcase } from "@/components/marketing/activity-showcase";
import { ConnectShowcase } from "@/components/marketing/connect-showcase";
import { AuroraBackground } from "@/components/marketing/aurora-background";
import {
  Reveal,
  Stagger,
  StaggerItem,
  HeroIn,
} from "@/components/marketing/motion";

const features = [
  {
    icon: Inbox,
    title: "Priority inbox",
    body: "Every message auto-sorted into Urgent · Reply · Waiting · FYI, so you read what matters first.",
    color: "var(--urgent)",
    pro: true,
  },
  {
    icon: CalendarClock,
    title: "Email → calendar",
    body: "Turn a thread into a meeting and send the invite without leaving the conversation.",
    color: "var(--source-calendar)",
    pro: false,
  },
  {
    icon: Command,
    title: "⌘K command bar",
    body: "Type what you want in plain English. The agent proposes the steps; you approve before anything sends.",
    color: "var(--primary)",
    pro: true,
  },
  {
    icon: Search,
    title: "Instant local search",
    body: "Every email and event is cached, so search returns in under a second — no API round-trip.",
    color: "var(--done)",
    pro: false,
  },
  {
    icon: Sparkles,
    title: "Catch me up",
    body: "A plain-language digest of everything that happened while you were away, across all your tools.",
    color: "var(--waiting)",
    pro: true,
  },
  {
    icon: ShieldCheck,
    title: "Sign in with Google",
    body: "Secure Google auth via Better Auth. Your tokens stay in your own database.",
    color: "var(--reply)",
    pro: false,
  },
  {
    icon: MessagesSquare,
    title: "Slack in the loop",
    body: "A DM that needs you joins the same priority queue, so it isn't lost in another tab.",
    color: "var(--source-slack)",
    pro: false,
  },
  {
    icon: GitBranch,
    title: "GitHub activity",
    body: "Review requests, mentions, and CI failures surface alongside your mail — one place for everything.",
    color: "var(--source-github)",
    pro: false,
  },
];

const stack = [
  "Next.js 15",
  "tRPC",
  "Postgres + Drizzle",
  "Corsair",
  "Better Auth",
  "Inngest",
  "OpenAI",
  "Razorpay",
];

const freePlan = [
  "Unified inbox across all sources",
  "Email → calendar scheduling",
  "Instant local search",
  "Slack & GitHub in the queue",
  "Sign in with Google",
];
const proPlan = [
  "Everything in Free",
  "AI priority triage",
  "Catch-me-up digest",
  "⌘K command agent",
];

/* the floating priority-queue shown under the hero headline */
const queue = [
  {
    pill: "Urgent",
    color: "var(--urgent)",
    Icon: Mail,
    iconColor: "var(--source-gmail)",
    title: "Contract redline — needs sign-off",
    who: "Priya Nair · Legal",
    time: "9m",
  },
  {
    pill: "Reply",
    color: "var(--reply)",
    Icon: Mail,
    iconColor: "var(--source-gmail)",
    title: "Re: Q3 board deck — your numbers?",
    who: "Marcus Lee",
    time: "34m",
  },
  {
    pill: "Waiting",
    color: "var(--waiting)",
    Icon: Calendar,
    iconColor: "var(--source-calendar)",
    title: "Design review moved to 4:00 PM",
    who: "Calendar · 6 guests",
    time: "1h",
  },
  {
    pill: "FYI",
    color: "var(--fyi)",
    Icon: GitBranch,
    iconColor: "var(--source-github)",
    title: "CI passed on momentum-v2 #482",
    who: "GitHub · main",
    time: "2h",
  },
];

export default function LandingPage() {
  return (
    <main>
      {/* Hero — signature aurora moment */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-28">
        <AuroraBackground />
        <div className="relative z-10 mx-auto max-w-6xl px-6 text-center">
          <HeroIn>
            <Badge variant="default" className="mb-6">
              <Sparkles className="size-3" /> AI-native workspace
            </Badge>
          </HeroIn>
          <HeroIn delay={0.08}>
            <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-balance md:text-6xl">
              One calm home for{" "}
              <span className="from-primary to-azure bg-gradient-to-r bg-clip-text text-transparent">
                all your work
              </span>
            </h1>
          </HeroIn>
          <HeroIn delay={0.16}>
            <p className="text-muted-foreground mx-auto mt-5 max-w-xl text-lg text-balance">
              Momentum pulls Gmail, Calendar, Slack and GitHub into a single
              priority queue, tells you what needs you today, and lets you act
              in plain language — every step waiting for your approval.
            </p>
          </HeroIn>
          <HeroIn delay={0.24}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/login">
                  Start free <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#how">See how it works</Link>
              </Button>
            </div>
            <p className="text-muted-foreground mt-4 text-xs">
              Free forever · AI features on Pro · Connect in two clicks
            </p>
          </HeroIn>

          {/* floating priority queue */}
          <HeroIn delay={0.32}>
            <div className="elevate-lg mx-auto mt-14 max-w-2xl overflow-hidden rounded-2xl border text-left">
              <div className="bg-muted/60 flex items-center gap-2 border-b px-4 py-3">
                <span className="bg-urgent size-2.5 rounded-full" />
                <span className="bg-reply size-2.5 rounded-full" />
                <span className="bg-done size-2.5 rounded-full" />
                <span className="ml-2 text-sm font-medium">
                  Today’s priority queue
                </span>
                <span className="text-muted-foreground ml-auto text-xs">
                  4 need you · 12 handled
                </span>
              </div>
              {queue.map((q) => (
                <div
                  key={q.title}
                  className="bg-card flex items-center gap-3 border-b px-4 py-3.5 last:border-b-0"
                >
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{
                      background: `color-mix(in oklch, ${q.color} 16%, transparent)`,
                      color: q.color,
                    }}
                  >
                    {q.pill}
                  </span>
                  <span
                    className="grid size-8 shrink-0 place-items-center rounded-lg"
                    style={{
                      background: `color-mix(in oklch, ${q.iconColor} 14%, transparent)`,
                      color: q.iconColor,
                    }}
                  >
                    <q.Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{q.title}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {q.who}
                    </p>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {q.time}
                  </span>
                </div>
              ))}
            </div>
          </HeroIn>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6">
        {/* Product preview band */}
        <Reveal className="mb-24">
          <ActivityShowcase />
        </Reveal>

        {/* Connect everything — recharts */}
        <section id="connect" className="mb-24">
          <Reveal className="mb-8 text-center">
            <p className="text-primary text-sm font-semibold tracking-widest uppercase">
              One queue
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Connect everything, in one place
            </h2>
            <p className="text-muted-foreground mt-3">
              Each tool you connect becomes another layer in a single queue.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <ConnectShowcase />
          </Reveal>
        </section>

        {/* Features */}
        <section id="features" className="mb-24">
          <Reveal className="mb-10 text-center">
            <p className="text-primary text-sm font-semibold tracking-widest uppercase">
              Built for focus
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Vibrant where it counts, calm everywhere else
            </h2>
            <p className="text-muted-foreground mt-3">
              Every feature exists to shrink the list of things competing for
              your attention.
            </p>
          </Reveal>
          <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <StaggerItem key={f.title}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <span
                        className="grid size-10 place-items-center rounded-lg"
                        style={{
                          background: `color-mix(in oklch, ${f.color} 15%, transparent)`,
                          color: f.color,
                        }}
                      >
                        <f.icon className="size-5" />
                      </span>
                      {f.pro && (
                        <Badge
                          variant="secondary"
                          className="gap-1 text-[10px]"
                        >
                          <Lock className="size-2.5" /> Pro
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-medium">{f.title}</h3>
                    <p className="text-muted-foreground mt-1.5 text-sm">
                      {f.body}
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        {/* How it works */}
        <section id="how" className="mb-24">
          <Reveal className="mb-10 text-center">
            <p className="text-primary text-sm font-semibold tracking-widest uppercase">
              Three steps
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              From noise to a quiet inbox
            </h2>
          </Reveal>
          <Stagger className="grid gap-6 md:grid-cols-3">
            {[
              {
                n: "Step 01",
                t: "Connect",
                d: "Sign in with Google. Gmail and Calendar sync in the background — no API plumbing, no setup wizard.",
              },
              {
                n: "Step 02",
                t: "Triage",
                d: "As mail arrives it’s labeled Urgent, Reply, Waiting or FYI. The loud stuff rises; the rest waits quietly.",
              },
              {
                n: "Step 03",
                t: "Act",
                d: "Reply, schedule, or ask the ⌘K agent. Momentum proposes the steps; you approve, it’s done.",
              },
            ].map((s) => (
              <StaggerItem key={s.n}>
                <div className="bg-card h-full rounded-xl border p-6">
                  <span className="text-primary text-sm font-semibold">
                    {s.n}
                  </span>
                  <div className="from-primary to-azure my-3.5 h-[3px] w-full rounded-full bg-gradient-to-r" />
                  <h3 className="text-lg font-medium">{s.t}</h3>
                  <p className="text-muted-foreground mt-1.5 text-sm">{s.d}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mb-24">
          <Reveal className="mb-10 text-center">
            <p className="text-primary text-sm font-semibold tracking-widest uppercase">
              Pricing
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Free to use. Pro for the AI.
            </h2>
            <p className="text-muted-foreground mt-3">
              Everything works on Free. The AI brain is what Pro unlocks.
            </p>
          </Reveal>
          <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
            <Reveal>
              <div className="bg-card h-full rounded-2xl border p-7">
                <h3 className="text-lg font-medium">Free</h3>
                <p className="mt-1 text-3xl font-semibold">
                  ₹0
                  <span className="text-muted-foreground text-base font-normal">
                    /mo
                  </span>
                </p>
                <ul className="mt-5 space-y-2.5 text-sm">
                  {freePlan.map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <Check className="text-done mt-0.5 size-4 shrink-0" /> {p}
                    </li>
                  ))}
                </ul>
                <Button asChild variant="outline" className="mt-6 w-full">
                  <Link href="/login">Start free</Link>
                </Button>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="border-primary bg-card relative h-full overflow-hidden rounded-2xl border-2 p-7">
                <Badge className="absolute top-4 right-4">Most popular</Badge>
                <h3 className="text-lg font-medium">Pro</h3>
                <p className="mt-1 text-3xl font-semibold">
                  ₹499
                  <span className="text-muted-foreground text-base font-normal">
                    /mo
                  </span>
                </p>
                <ul className="mt-5 space-y-2.5 text-sm">
                  {proPlan.map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <Sparkles className="text-primary mt-0.5 size-4 shrink-0" />{" "}
                      {p}
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-6 w-full">
                  <Link href="/login">Upgrade to Pro</Link>
                </Button>
                <p className="text-muted-foreground mt-3 text-center text-xs">
                  Secured by Razorpay
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Stack */}
        <section id="stack" className="mb-24 text-center">
          <Reveal>
            <h2 className="text-2xl font-semibold tracking-tight">
              Built on a modern stack
            </h2>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {stack.map((s) => (
                <Badge
                  key={s}
                  variant="secondary"
                  className="px-3 py-1 text-sm"
                >
                  {s}
                </Badge>
              ))}
            </div>
          </Reveal>
        </section>

        {/* CTA */}
        <Reveal className="mb-24">
          <div className="from-primary to-azure text-primary-foreground relative overflow-hidden rounded-3xl bg-gradient-to-br px-8 py-16 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(40rem_20rem_at_80%_-20%,rgba(255,255,255,0.25),transparent)]" />
            <h2 className="relative text-3xl font-semibold tracking-tight">
              Get your time back.
            </h2>
            <p className="relative mx-auto mt-3 max-w-md opacity-90">
              Join the workflow that decides what’s important so you don’t have
              to.
            </p>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="relative mt-7"
            >
              <Link href="/login">
                Start free <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </Reveal>

        <footer className="text-muted-foreground flex flex-col items-center gap-3 border-t py-10 text-sm md:flex-row md:justify-between">
          <Logo className="text-foreground text-sm" />
          <p>
            © {new Date().getFullYear()} Momentum · Calm canvas, vibrant signal.
          </p>
        </footer>
      </div>
    </main>
  );
}
