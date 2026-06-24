import Link from "next/link";
import { ArrowRight, Mail, Calendar, MessagesSquare, GitBranch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/marketing/motion";

export const metadata = {
  title: "Docs — Connect your tools",
  description: "How to connect Gmail, Calendar, Slack, and GitHub to Momentum.",
};

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-muted/60 text-foreground rounded px-1.5 py-0.5 font-mono text-[12px]">
      {children}
    </code>
  );
}

function Connector({
  icon: Icon,
  source,
  name,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  source: string;
  name: string;
  children: React.ReactNode;
}) {
  const col = `var(--source-${source})`;
  return (
    <Reveal>
      <div className="bg-card flex gap-4 rounded-xl border p-5">
        <span
          className="grid size-10 shrink-0 place-items-center rounded-lg"
          style={{
            background: `color-mix(in oklch, ${col} 15%, transparent)`,
            color: col,
          }}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium">{name}</h3>
          <div className="text-muted-foreground mt-2 space-y-2 text-sm">
            {children}
          </div>
        </div>
      </div>
    </Reveal>
  );
}

export default function DocsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 pb-24">
      <Reveal className="pt-6 text-center">
        <Badge variant="secondary" className="mb-4">
          Documentation
        </Badge>
        <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">
          Connect your tools
        </h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-xl">
          Momentum pulls Gmail, Calendar, Slack, and GitHub into one place. Sign
          in, then connect each tool from the{" "}
          <Link href="/connections" className="text-primary underline">
            Connections
          </Link>{" "}
          page — here&apos;s what each one needs.
        </p>
      </Reveal>

      <section className="mt-12 space-y-4">
        <Connector icon={Mail} source="gmail" name="Gmail">
          <p>
            Connected automatically through your Google sign-in — no extra steps.
            Open <strong>Connections</strong> and press{" "}
            <strong>Connect</strong> on the Gmail card to pull your inbox in. If
            it asks you to re-authorize, sign out and sign back in with Google so
            it can grant mail access.
          </p>
        </Connector>

        <Connector icon={Calendar} source="calendar" name="Calendar">
          <p>
            Uses the same Google sign-in as Gmail. Press <strong>Connect</strong>{" "}
            on the Calendar card and your week view and Catch&nbsp;Me&nbsp;Up
            digest start filling in. Press <strong>Sync</strong> any time to pull
            the latest events.
          </p>
        </Connector>

        <Connector icon={MessagesSquare} source="slack" name="Slack">
          <p>
            Press <strong>Connect</strong> on the Slack card and paste a Slack
            token (starts with <Code>xoxb-</Code> or <Code>xoxp-</Code>). Create
            one from your Slack app&apos;s <strong>OAuth &amp; Permissions</strong>{" "}
            page. Momentum stores it encrypted and uses it only for your account.
          </p>
        </Connector>

        <Connector icon={GitBranch} source="github" name="GitHub">
          <p>
            Press <strong>Connect</strong> on the GitHub card and paste a personal
            access token (starts with <Code>ghp_</Code>). Generate it at{" "}
            <strong>GitHub → Settings → Developer settings → Personal access
            tokens</strong> with the <Code>repo</Code>, <Code>read:org</Code>, and{" "}
            <Code>read:user</Code> scopes.
          </p>
        </Connector>
      </section>

      <Reveal className="mt-10 text-center">
        <Button asChild size="lg">
          <Link href="/connections">
            Go to Connections <ArrowRight className="size-4" />
          </Link>
        </Button>
      </Reveal>
    </main>
  );
}
