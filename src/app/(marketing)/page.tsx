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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/marketing/logo";
import { ActivityShowcase } from "@/components/marketing/activity-showcase";
import { ConnectShowcase } from "@/components/marketing/connect-showcase";
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
    body: "Corsair caches every email and event, so search returns in under a second — no API round-trip.",
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
    body: "Pull important Slack threads into the same priority queue, so a DM that needs you isn't lost.",
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

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-6xl px-6">
      {/* Hero */}
      <section className="flex flex-col items-center pt-12 pb-16 text-center md:pt-20">
        <HeroIn>
          <Badge variant="default" className="mb-6">
            <Sparkles className="size-3" /> AI-native workspace
          </Badge>
        </HeroIn>
        <HeroIn delay={0.08}>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance md:text-6xl">
            One calm home for{" "}
            <span className="from-primary bg-gradient-to-r to-[oklch(0.66_0.14_232)] bg-clip-text text-transparent">
              all your work
            </span>
          </h1>
        </HeroIn>
        <HeroIn delay={0.16}>
          <p className="text-muted-foreground mt-5 max-w-xl text-lg text-balance">
            Momentum pulls Gmail, Google Calendar, Slack, and GitHub into a
            single priority inbox, tells you what needs you today, and lets you
            act in plain language — every step waiting for your approval.
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
              <Link href="/docs">Read the docs</Link>
            </Button>
          </div>
          <p className="text-muted-foreground mt-4 text-xs">
            Free forever · AI features on Pro · Connect Gmail &amp; Calendar in
            two clicks
          </p>
        </HeroIn>
      </section>

      {/* Product preview band */}
      <Reveal className="mb-24">
        <ActivityShowcase />
      </Reveal>

      {/* Connect everything — recharts */}
      <section id="connect" className="mb-24">
        <Reveal className="mb-8 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
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
          <h2 className="text-3xl font-semibold tracking-tight">
            Built for the way you actually work
          </h2>
          <p className="text-muted-foreground mt-3">
            Vibrant where it counts, calm everywhere else.
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
                      <Badge variant="secondary" className="gap-1 text-[10px]">
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
          <h2 className="text-3xl font-semibold tracking-tight">
            Three steps to a quieter inbox
          </h2>
        </Reveal>
        <Stagger className="grid gap-6 md:grid-cols-3">
          {[
            {
              n: "01",
              t: "Connect",
              d: "Sign in with Google. Gmail and Calendar sync through Corsair — no API plumbing.",
            },
            {
              n: "02",
              t: "Triage",
              d: "AI labels priority as mail arrives. Webhooks keep everything fresh in real time.",
            },
            {
              n: "03",
              t: "Act",
              d: "Reply, schedule, or ask the ⌘K agent. Approve, and it's done.",
            },
          ].map((s) => (
            <StaggerItem key={s.n}>
              <div className="bg-card h-full rounded-xl border p-6">
                <span className="text-primary text-sm font-semibold">
                  {s.n}
                </span>
                <h3 className="mt-2 text-lg font-medium">{s.t}</h3>
                <p className="text-muted-foreground mt-1.5 text-sm">{s.d}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Pricing — Free vs Pro (AI) */}
      <section id="pricing" className="mb-24">
        <Reveal className="mb-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
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
              <Badge key={s} variant="secondary" className="px-3 py-1 text-sm">
                {s}
              </Badge>
            ))}
          </div>
        </Reveal>
      </section>

      {/* CTA */}
      <Reveal className="mb-24">
        <div className="from-primary text-primary-foreground overflow-hidden rounded-2xl bg-gradient-to-br to-[oklch(0.5_0.13_232)] px-8 py-14 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            Get your time back.
          </h2>
          <p className="mx-auto mt-3 max-w-md opacity-90">
            Join the workflow that decides what&apos;s important so you
            don&apos;t have to.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-7">
            <Link href="/login">
              Start free <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </Reveal>

      <footer className="text-muted-foreground flex flex-col items-center gap-3 border-t py-10 text-sm md:flex-row md:justify-between">
        <Logo className="text-foreground text-sm" />
        <p>© {new Date().getFullYear()} Momentum.</p>
      </footer>
    </main>
  );
}
