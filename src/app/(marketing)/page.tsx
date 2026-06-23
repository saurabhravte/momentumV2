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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/marketing/logo";
import { ActivityShowcase } from "@/components/marketing/activity-showcase";

const features = [
  {
    icon: Inbox,
    title: "Priority inbox",
    body: "Every message auto-sorted into Urgent · Reply · Waiting · FYI by a cheap LLM, so you read what matters first.",
    color: "var(--urgent)",
  },
  {
    icon: CalendarClock,
    title: "Email → calendar",
    body: "Turn a thread into a meeting and send the invite without leaving the conversation.",
    color: "var(--source-calendar)",
  },
  {
    icon: Command,
    title: "⌘K command bar",
    body: "Type what you want in plain English. The agent proposes the steps; you approve before anything sends.",
    color: "var(--primary)",
  },
  {
    icon: Search,
    title: "Instant local search",
    body: "Corsair caches every email and event, so search returns in under a second — no Gmail API round-trip.",
    color: "var(--done)",
  },
  {
    icon: Sparkles,
    title: "Catch me up",
    body: "A plain-language digest of everything that happened while you were away, across all your tools.",
    color: "var(--waiting)",
  },
  {
    icon: ShieldCheck,
    title: "Sign in with Google",
    body: "Secure Google auth via Better Auth. Your tokens stay in your own database — nothing managed for you.",
    color: "var(--reply)",
  },
  {
    icon: MessagesSquare,
    title: "Slack in the loop",
    body: "Pull important Slack threads into the same priority queue, so a DM that needs you doesn't get lost behind email.",
    color: "var(--source-slack)",
  },
  {
    icon: GitBranch,
    title: "GitHub activity",
    body: "Review requests, mentions, and CI failures surface alongside your mail — one place for everything asking for your attention.",
    color: "var(--source-github)",
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
  "shadcn/ui",
];

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-6xl px-6">
      {/* Hero */}
      <section className="flex flex-col items-center pt-20 pb-16 text-center md:pt-28">
        <Badge variant="default" className="mb-6">
          <Sparkles className="size-3" /> AI-native workspace
        </Badge>
        <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight md:text-6xl">
          One calm home for{" "}
          <span className="bg-gradient-to-r from-primary to-[oklch(0.66_0.14_232)] bg-clip-text text-transparent">
            all your work
          </span>
        </h1>
        <p className="mt-5 max-w-xl text-balance text-lg text-muted-foreground">
          Momentum pulls Gmail, Google Calendar, Slack, and GitHub into a single
          priority inbox, tells you what needs you today, and lets you act in
          plain language — every step waiting for your approval.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/login">
              Start free <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#how">See how it works</a>
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          No credit card · Connect Gmail &amp; Calendar in two clicks
        </p>
      </section>

      {/* Product preview band — animated activity across all connected tools */}
      <section className="mb-24">
        <ActivityShowcase />
      </section>

      {/* Features */}
      <section id="features" className="mb-24">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            Built for the way you actually work
          </h2>
          <p className="mt-3 text-muted-foreground">
            Vibrant where it counts, calm everywhere else.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <span
                  className="mb-4 grid size-10 place-items-center rounded-lg"
                  style={{
                    background: `color-mix(in oklch, ${f.color} 15%, transparent)`,
                    color: f.color,
                  }}
                >
                  <f.icon className="size-5" />
                </span>
                <h3 className="font-medium">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mb-24">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            Three steps to a quieter inbox
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { n: "01", t: "Connect", d: "Sign in with Google. Gmail and Calendar sync through Corsair — no API plumbing." },
            { n: "02", t: "Triage", d: "AI labels priority as mail arrives. Webhooks keep everything fresh in real time." },
            { n: "03", t: "Act", d: "Reply, schedule, or ask the ⌘K agent. Approve, and it's done." },
          ].map((s) => (
            <div key={s.n} className="rounded-xl border bg-card p-6">
              <span className="text-sm font-semibold text-primary">{s.n}</span>
              <h3 className="mt-2 text-lg font-medium">{s.t}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stack */}
      <section id="stack" className="mb-24 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Built on a modern stack</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {stack.map((s) => (
            <Badge key={s} variant="secondary" className="px-3 py-1 text-sm">
              {s}
            </Badge>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mb-24">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.5_0.13_232)] px-8 py-14 text-center text-primary-foreground">
          <h2 className="text-3xl font-semibold tracking-tight">
            Get your time back.
          </h2>
          <p className="mx-auto mt-3 max-w-md opacity-90">
            Join the workflow that decides what's important so you don't have to.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-7">
            <Link href="/login">
              Start free <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="flex flex-col items-center gap-3 border-t py-10 text-sm text-muted-foreground md:flex-row md:justify-between">
        <Logo className="text-sm text-foreground" />
        <p>© {new Date().getFullYear()} Momentum. Powered by Corsair.</p>
      </footer>
    </main>
  );
}
