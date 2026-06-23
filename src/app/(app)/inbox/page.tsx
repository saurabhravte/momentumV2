"use client";

import { useMemo, useState } from "react";
import {
  RefreshCw,
  Search as SearchIcon,
  Sparkles,
  ArrowLeft,
  Send,
  PencilLine,
  Loader2,
} from "lucide-react";

import { api } from "@/trpc/react";
import { formatMessageDate, formatSender, LinkifiedText } from "@/lib/display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type Priority = "urgent" | "reply" | "waiting" | "fyi";

export default function InboxPage() {
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [digest, setDigest] = useState<string | null>(null);
  const [priorities, setPriorities] = useState<Record<string, Priority>>({});

  const utils = api.useUtils();

  const emails = api.gmail.searchEmails.useQuery({
    query: activeSearch,
    limit: 50,
    offset: 0,
  });

  const selectedEmail = api.gmail.getMessage.useQuery(
    { id: selectedId! },
    { enabled: !!selectedId },
  );

  const refresh = api.gmail.refreshInbox.useMutation({
    onSuccess: () => utils.gmail.searchEmails.invalidate(),
  });

  const triage = api.ai.classifyInbox.useMutation({
    onSuccess: (rows) => {
      setPriorities(
        Object.fromEntries(rows.map((r) => [r.id, r.priority])),
      );
    },
  });

  const catchUp = api.ai.catchMeUp.useMutation({
    onSuccess: (r) => setDigest(r.digest),
  });

  const runTriage = () => {
    if (!emails.data) return;
    triage.mutate({
      emails: emails.data.slice(0, 30).map((e) => ({
        id: e.id,
        subject: e.subject,
        from: e.from,
        snippet: e.snippet,
      })),
    });
  };

  const runCatchUp = () => {
    if (!emails.data) return;
    catchUp.mutate({
      items: emails.data.slice(0, 30).map((e) => `${e.from}: ${e.subject} — ${e.snippet}`),
    });
  };

  const sorted = useMemo(() => {
    if (!emails.data) return [];
    const order: Record<Priority, number> = { urgent: 0, reply: 1, waiting: 2, fyi: 3 };
    if (Object.keys(priorities).length === 0) return emails.data;
    return [...emails.data].sort(
      (a, b) =>
        (order[priorities[a.id] ?? "fyi"] ?? 3) -
        (order[priorities[b.id] ?? "fyi"] ?? 3),
    );
  }, [emails.data, priorities]);

  // ---- Reading view ----------------------------------------------------
  if (selectedId) {
    const e = selectedEmail.data;
    return (
      <div className="mx-auto max-w-3xl px-8 py-8">
        <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
          <ArrowLeft className="size-4" /> Back to inbox
        </Button>
        {selectedEmail.isLoading && (
          <p className="mt-8 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </p>
        )}
        {e && (
          <Card className="mt-4">
            <CardContent className="p-6">
              <h1 className="text-xl font-semibold tracking-tight">
                {e.subject || "(no subject)"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatSender(e.from)}
                {e.date && <> · {formatMessageDate(e.date)}</>}
              </p>
              {e.to && (
                <p className="text-sm text-muted-foreground">To: {formatSender(e.to)}</p>
              )}
              <hr className="my-4" />
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                <LinkifiedText text={e.body || e.snippet || "(empty)"} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ---- Inbox view ------------------------------------------------------
  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
          <p className="text-sm text-muted-foreground">
            {emails.data?.length ?? 0} messages
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={runCatchUp}
            disabled={catchUp.isPending || !emails.data}
          >
            {catchUp.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Catch me up
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refresh.mutate()}
            disabled={refresh.isPending}
          >
            <RefreshCw className={refresh.isPending ? "size-4 animate-spin" : "size-4"} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setComposing((c) => !c)}>
            <PencilLine className="size-4" /> Compose
          </Button>
        </div>
      </div>

      {/* Search + AI triage */}
      <div className="mt-5 flex gap-2">
        <form
          className="relative flex-1"
          onSubmit={(ev) => {
            ev.preventDefault();
            setActiveSearch(search);
          }}
        >
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search mail (local, sub-second via Corsair cache)…"
            className="pl-9"
          />
        </form>
        <Button
          variant="secondary"
          onClick={runTriage}
          disabled={triage.isPending || !emails.data}
        >
          {triage.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          AI triage
        </Button>
      </div>

      {digest && (
        <Card className="mt-4 border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="mb-1 flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <span className="text-sm font-medium">Here&apos;s what you missed</span>
            </div>
            <div className="whitespace-pre-wrap text-sm text-muted-foreground">{digest}</div>
          </CardContent>
        </Card>
      )}

      {composing && <Composer onClose={() => setComposing(false)} />}

      {/* List */}
      <div className="mt-5 overflow-hidden rounded-xl border bg-card">
        {emails.isLoading && (
          <p className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading inbox…
          </p>
        )}
        {emails.data?.length === 0 && (
          <p className="p-6 text-sm text-muted-foreground">
            No emails. Hit Refresh to sync from Gmail.
          </p>
        )}
        {sorted.map((email) => {
          const p = priorities[email.id];
          return (
            <button
              key={email.id}
              onClick={() => setSelectedId(email.id)}
              className="flex w-full items-center gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-accent/50"
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ background: p ? `var(--${p})` : "var(--border)" }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">
                    {email.subject || "(no subject)"}
                  </span>
                  {p && <Badge variant={p}>{p}</Badge>}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {formatSender(email.from)} · {email.snippet}
                </div>
              </div>
              {email.date && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatMessageDate(email.date)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Composer({ onClose }: { onClose: () => void }) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const utils = api.useUtils();

  const send = api.gmail.sendEmail.useMutation({
    onSuccess: () => {
      void utils.gmail.searchEmails.invalidate();
      onClose();
    },
  });
  const draft = api.gmail.createDraft.useMutation({ onSuccess: onClose });

  const valid = to && subject && body;

  return (
    <Card className="mt-4">
      <CardContent className="space-y-3 p-4">
        <Input placeholder="To" type="email" value={to} onChange={(e) => setTo(e.target.value)} />
        <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <Textarea
          placeholder="Write your message…"
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!valid || draft.isPending}
            onClick={() => draft.mutate({ to, subject, body })}
          >
            Save draft
          </Button>
          <Button
            size="sm"
            disabled={!valid || send.isPending}
            onClick={() => send.mutate({ to, subject, body })}
          >
            {send.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
