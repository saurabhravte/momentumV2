import Link from "next/link";
import { ArrowRight, Terminal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/marketing/motion";
import { SetupPipeline, SavingsChart } from "@/components/marketing/setup-flow";

export const metadata = {
  title: "Docs — Set up Momentum",
  description: "Get your own Momentum instance running in a few minutes.",
};

function Step({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal>
      <div className="flex gap-4">
        <span className="bg-primary/12 text-primary grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold">
          {n}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-medium">{title}</h3>
          <div className="text-muted-foreground mt-2 space-y-3 text-sm">
            {children}
          </div>
        </div>
      </div>
    </Reveal>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="bg-muted/60 text-foreground overflow-x-auto rounded-lg border p-3 text-[13px]">
      <code>{children}</code>
    </pre>
  );
}

const envRows: Array<[string, string]> = [
  ["DATABASE_URL", "Postgres connection string"],
  ["BETTER_AUTH_SECRET / _URL", "Auth secret + your app URL"],
  ["GOOGLE_CLIENT_ID / _SECRET", "Google OAuth (Gmail + Calendar scopes)"],
  ["CORSAIR_KEK", "Key-encryption key for integration tokens"],
  ["OPENAI_API_KEY", "Powers the AI features (Pro)"],
  ["RAZORPAY_KEY_ID / _SECRET", "Billing — collect Pro subscriptions"],
  ["RAZORPAY_PLAN_ID", "The Pro subscription plan id"],
  ["RAZORPAY_WEBHOOK_SECRET", "Verifies subscription webhooks"],
  ["NEXT_PUBLIC_RAZORPAY_KEY_ID", "Public key for browser checkout"],
];

export default function DocsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 pb-24">
      <Reveal className="pt-6 text-center">
        <Badge variant="secondary" className="mb-4">
          Documentation
        </Badge>
        <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">
          Set up Momentum, your way
        </h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-xl">
          Self-host the whole thing in a few minutes. Below is the path from a
          fresh clone to a running, multi-user, AI-and-billing-enabled instance.
        </p>
      </Reveal>

      {/* The visual pipeline */}
      <section className="mt-12">
        <Reveal className="mb-4">
          <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            The setup at a glance
          </h2>
        </Reveal>
        <Reveal delay={0.05}>
          <SetupPipeline />
        </Reveal>
      </section>

      {/* Steps */}
      <section className="mt-14 space-y-10">
        <Step n="1" title="Clone and install">
          <p>Grab the repo and install dependencies with pnpm.</p>
          <Code>{`git clone https://github.com/saurabhravte/momentumV2
cd momentumV2
pnpm install`}</Code>
        </Step>

        <Step n="2" title="Configure your environment">
          <p>
            Copy the example file and fill in the values. Each variable maps to
            one capability:
          </p>
          <Code>{`cp .env.example .env`}</Code>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-muted/60 text-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Variable</th>
                  <th className="px-3 py-2 font-medium">What it unlocks</th>
                </tr>
              </thead>
              <tbody>
                {envRows.map(([k, v]) => (
                  <tr key={k} className="border-t">
                    <td className="px-3 py-2 font-mono text-xs">{k}</td>
                    <td className="text-muted-foreground px-3 py-2">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Step>

        <Step n="3" title="Create the database tables">
          <p>
            Push the Drizzle schema — this creates the auth, Corsair, and the
            new <span className="font-mono text-xs">subscriptions</span> tables.
          </p>
          <Code>{`pnpm db:push`}</Code>
        </Step>

        <Step n="4" title="Connect Google (Gmail + Calendar)">
          <p>
            In Google Cloud, create an OAuth client and add{" "}
            <span className="font-mono text-xs">/api/auth/callback/google</span>{" "}
            as a redirect URI. Each user signs in with their own Google account
            — their data is isolated to their own tenant.
          </p>
        </Step>

        <Step n="5" title="Turn on AI (Pro)">
          <p>
            Add your <span className="font-mono text-xs">OPENAI_API_KEY</span>.
            AI triage, the catch-me-up digest, and the ⌘K agent are reserved for
            Pro users — free users get the full inbox without them.
          </p>
        </Step>

        <Step n="6" title="Wire up Razorpay billing">
          <p>
            Create a monthly subscription Plan in the Razorpay dashboard and put
            its id in{" "}
            <span className="font-mono text-xs">RAZORPAY_PLAN_ID</span>. Then
            register a webhook pointing at:
          </p>
          <Code>{`https://your-app.com/api/webhooks/razorpay`}</Code>
          <p>
            Subscribe to{" "}
            <span className="font-mono text-xs">subscription.activated</span>,{" "}
            <span className="font-mono text-xs">.charged</span>,{" "}
            <span className="font-mono text-xs">.cancelled</span>,{" "}
            <span className="font-mono text-xs">.completed</span>, and{" "}
            <span className="font-mono text-xs">.halted</span>. The webhook is
            the durable source of truth for who is on Pro.
          </p>
        </Step>

        <Step n="7" title="Run it">
          <p>
            Start the dev server (and the Inngest dev runner for background AI
            triage).
          </p>
          <Code>{`pnpm dev
# in another terminal
pnpm inngest:dev`}</Code>
          <div className="bg-muted/40 text-foreground flex items-center gap-2 rounded-lg border p-3">
            <Terminal className="text-primary size-4" />
            <span className="text-sm">
              Open{" "}
              <span className="font-mono text-xs">http://localhost:3000</span> —
              sign in, connect Google, and you're live.
            </span>
          </div>
        </Step>
      </section>

      {/* Payoff chart */}
      <section className="mt-16">
        <Reveal className="mb-4">
          <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            Why it's worth it
          </h2>
        </Reveal>
        <Reveal delay={0.05}>
          <SavingsChart />
        </Reveal>
      </section>

      <Reveal className="mt-14 text-center">
        <Button asChild size="lg">
          <Link href="/login">
            Start your instance <ArrowRight className="size-4" />
          </Link>
        </Button>
      </Reveal>
    </main>
  );
}
