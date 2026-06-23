"use client";

import { useMemo, useState } from "react";
import {
  RefreshCw,
  Search as SearchIcon,
  Sparkles,
  Send,
  PencilLine,
  Loader2,
  Star,
  Inbox as InboxIcon,
  MailOpen,
  ArrowLeft,
  X,
} from "lucide-react";

import { api } from "@/trpc/react";
import { formatMessageDate, formatSender, LinkifiedText } from "@/lib/display";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type Priority = "urgent" | "reply" | "waiting" | "fyi";
type Folder = "all" | "unread" | "starred";

const PRIORITY_FILTERS: { key: Priority; label: string }[] = [
  { key: "urgent", label: "Urgent" },
  { key: "reply", label: "Reply" },
  { key: "waiting", label: "Waiting" },
  { key: "fyi", label: "FYI" },
];

export default function InboxPage() {
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [digest, setDigest] = useState<string | null>(null);
  const [priorities, setPriorities] = useState<Record<string, Priority>>({});

  // Gmail-like local state (no Gmail writes): which are read / starred.
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());

  // Active filters
  const [folder, setFolder] = useState<Folder>("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | null>(null);

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
    onSuccess: (rows) =>
      setPriorities(Object.fromEntries(rows.map((r) => [r.id, r.priority]))),
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
      items: emails.data
        .slice(0, 30)
        .map((e) => `${e.from}: ${e.subject} — ${e.snippet}`),
    });
  };

  const open = (id: string) => {
    setSelectedId(id);
    setReadIds((prev) => new Set(prev).add(id));
  };

  const toggleStar = (id: string) =>
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Apply folder + priority + sort (priority order when triaged).
  const list = useMemo(() => {
    if (!emails.data) return [];
    let rows = emails.data;
    if (folder === "unread") rows = rows.filter((e) => !readIds.has(e.id));
    if (folder === "starred") rows = rows.filter((e) => starredIds.has(e.id));
    if (priorityFilter)
      rows = rows.filter((e) => priorities[e.id] === priorityFilter);

    if (Object.keys(priorities).length > 0) {
      const order: Record<Priority, number> = {
        urgent: 0, reply: 1, waiting: 2, fyi: 3,
      };
      rows = [...rows].sort(
        (a, b) =>
          (order[priorities[a.id] ?? "fyi"] ?? 3) -
          (order[priorities[b.id] ?? "fyi"] ?? 3),
      );
    }
    return rows;
  }, [emails.data, folder, priorityFilter, priorities, readIds, starredIds]);

  const counts = useMemo(() => {
    const data = emails.data ?? [];
    const byPriority = (p: Priority) =>
      data.filter((e) => priorities[e.id] === p).length;
    return {
      all: data.length,
      unread: data.filter((e) => !readIds.has(e.id)).length,
      starred: data.filter((e) => starredIds.has(e.id)).length,
      urgent: byPriority("urgent"),
      reply: byPriority("reply"),
      waiting: byPriority("waiting"),
      fyi: byPriority("fyi"),
    };
  }, [emails.data, priorities, readIds, starredIds]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={runCatchUp} disabled={catchUp.isPending || !emails.data}>
            {catchUp.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Catch me up
          </Button>
          <Button variant="secondary" size="sm" onClick={runTriage} disabled={triage.isPending || !emails.data}>
            {triage.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            AI triage
          </Button>
          <Button variant="outline" size="sm" onClick={() => refresh.mutate()} disabled={refresh.isPending}>
            <RefreshCw className={refresh.isPending ? "size-4 animate-spin" : "size-4"} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setComposing(true)}>
            <PencilLine className="size-4" /> Compose
          </Button>
        </div>
      </div>

      {/* Search */}
      <form
        className="relative mt-4"
        onSubmit={(ev) => {
          ev.preventDefault();
          setActiveSearch(search);
        }}
      >
        <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search mail…"
          className="pl-9"
        />
      </form>

      {digest && (
        <Card className="border-primary/30 bg-primary/5 mt-4">
          <CardContent className="p-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="text-primary size-4" /> Here&apos;s what you missed
              </span>
              <button onClick={() => setDigest(null)} className="text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>
            <div className="text-muted-foreground whitespace-pre-wrap text-sm">{digest}</div>
          </CardContent>
        </Card>
      )}

      {composing && <Composer onClose={() => setComposing(false)} />}

      {/* Body: filter rail + list + reading pane */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[170px_minmax(0,1fr)]">
        {/* Filter rail */}
        <aside className="hidden lg:block">
          <FilterButton icon={InboxIcon} label="All mail" count={counts.all} active={folder === "all" && !priorityFilter} onClick={() => { setFolder("all"); setPriorityFilter(null); }} />
          <FilterButton icon={MailOpen} label="Unread" count={counts.unread} active={folder === "unread"} onClick={() => { setFolder("unread"); setPriorityFilter(null); }} />
          <FilterButton icon={Star} label="Starred" count={counts.starred} active={folder === "starred"} onClick={() => { setFolder("starred"); setPriorityFilter(null); }} />

          <p className="text-muted-foreground mt-4 px-3 text-[11px] font-medium uppercase">Priority</p>
          {PRIORITY_FILTERS.map((p) => (
            <button
              key={p.key}
              onClick={() => { setPriorityFilter(priorityFilter === p.key ? null : p.key); setFolder("all"); }}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                priorityFilter === p.key ? "bg-accent text-foreground font-medium" : "text-muted-foreground hover:bg-accent/50",
              )}
            >
              <span className="size-2 rounded-full" style={{ background: `var(--${p.key})` }} />
              {p.label}
              <span className="ml-auto text-xs">{counts[p.key]}</span>
            </button>
          ))}
          {Object.keys(priorities).length === 0 && (
            <p className="text-muted-foreground mt-1 px-3 text-[11px]">Run AI triage to filter by priority.</p>
          )}
        </aside>

        {/* List + reading pane */}
        <div className={cn("grid gap-4", selectedId && "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]")}>
          {/* List */}
          <div className={cn("overflow-hidden rounded-xl border bg-card", selectedId && "hidden lg:block")}>
            {emails.isLoading && (
              <p className="text-muted-foreground flex items-center gap-2 p-6 text-sm">
                <Loader2 className="size-4 animate-spin" /> Loading inbox…
              </p>
            )}
            {!emails.isLoading && list.length === 0 && (
              <p className="text-muted-foreground p-6 text-sm">
                No messages match this filter.
              </p>
            )}
            {list.map((email) => {
              const p = priorities[email.id];
              const unread = !readIds.has(email.id);
              const starred = starredIds.has(email.id);
              return (
                <div
                  key={email.id}
                  className={cn(
                    "flex items-center gap-2 border-b border-border/50 px-3 py-3 last:border-0 transition-colors hover:bg-accent/50",
                    selectedId === email.id && "bg-accent",
                    unread && "bg-primary/[0.03]",
                  )}
                >
                  <button onClick={() => toggleStar(email.id)} className="shrink-0" aria-label="Star">
                    <Star className={cn("size-4", starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground/50")} />
                  </button>
                  <button onClick={() => open(email.id)} className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className={cn("truncate text-sm", unread ? "font-semibold" : "font-medium")}>
                        {formatSender(email.from)}
                      </span>
                      {p && <Badge variant={p}>{p}</Badge>}
                      {email.date && (
                        <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                          {formatMessageDate(email.date)}
                        </span>
                      )}
                    </div>
                    <div className={cn("truncate text-sm", unread ? "text-foreground" : "text-muted-foreground")}>
                      {email.subject || "(no subject)"}
                    </div>
                    <div className="text-muted-foreground truncate text-xs">{email.snippet}</div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Reading pane */}
          {selectedId && (
            <div className="overflow-hidden rounded-xl border bg-card">
              <div className="flex items-center gap-2 border-b px-4 py-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
                  <ArrowLeft className="size-4" /> Back
                </Button>
              </div>
              {selectedEmail.isLoading ? (
                <p className="text-muted-foreground flex items-center gap-2 p-6 text-sm">
                  <Loader2 className="size-4 animate-spin" /> Loading…
                </p>
              ) : selectedEmail.data ? (
                <div className="p-6">
                  <h2 className="text-lg font-semibold tracking-tight">
                    {selectedEmail.data.subject || "(no subject)"}
                  </h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {formatSender(selectedEmail.data.from)}
                    {selectedEmail.data.date && <> · {formatMessageDate(selectedEmail.data.date)}</>}
                  </p>
                  {selectedEmail.data.to && (
                    <p className="text-muted-foreground text-sm">To: {formatSender(selectedEmail.data.to)}</p>
                  )}
                  <hr className="my-4" />
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    <LinkifiedText text={selectedEmail.data.body || selectedEmail.data.snippet || "(empty)"} />
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterButton({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
        active ? "bg-accent text-foreground font-medium" : "text-muted-foreground hover:bg-accent/50",
      )}
    >
      <Icon className="size-4" />
      {label}
      <span className="ml-auto text-xs">{count}</span>
    </button>
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
        <Textarea placeholder="Write your message…" rows={6} value={body} onChange={(e) => setBody(e.target.value)} />
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="outline" size="sm" disabled={!valid || draft.isPending} onClick={() => draft.mutate({ to, subject, body })}>
            Save draft
          </Button>
          <Button size="sm" disabled={!valid || send.isPending} onClick={() => send.mutate({ to, subject, body })}>
            {send.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
