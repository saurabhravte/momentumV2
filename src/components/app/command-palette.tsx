"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Sparkles,
  Inbox,
  CalendarDays,
  Send,
  Search,
  Loader2,
} from "lucide-react";

import { api } from "@/trpc/react";
import { Badge } from "@/components/ui/badge";

/**
 * ⌘K command palette. Deterministic quick-actions plus a natural-language bar
 * that calls ai.parseCommand and PROPOSES an action for the user to confirm —
 * the approval-first pattern from V1. Open with ⌘K or the "Ask Momentum" button.
 */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [proposal, setProposal] = useState<string | null>(null);

  const parse = api.ai.parseCommand.useMutation({
    onSuccess: (cmd) => {
      switch (cmd.action) {
        case "navigate":
          router.push(`/${cmd.to}`);
          setOpen(false);
          break;
        case "search":
          router.push(`/inbox?q=${encodeURIComponent(cmd.query)}`);
          setOpen(false);
          break;
        case "compose":
          setProposal(
            `Draft email to ${cmd.to ?? "—"} · "${cmd.subject ?? ""}"`,
          );
          break;
        case "schedule":
          setProposal(
            `Schedule "${cmd.summary}" with ${cmd.attendees.join(", ") || "—"} (${cmd.when})`,
          );
          break;
        case "catch_up":
          router.push("/inbox?digest=1");
          setOpen(false);
          break;
        default:
          setProposal(
            cmd.action === "unknown" ? cmd.message : "Not sure how to do that.",
          );
      }
    },
    onError: (err) => {
      // AI is a Pro feature — surface the upgrade path instead of a raw error.
      if (err.data?.code === "FORBIDDEN" || err.message.includes("PAYWALL")) {
        setProposal("__PAYWALL__");
      } else {
        setProposal("Something went wrong. Please try again.");
      }
    },
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const openEvt = () => setOpen(true);
    document.addEventListener("keydown", down);
    window.addEventListener("open-command-palette", openEvt);
    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("open-command-palette", openEvt);
    };
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[15vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-popover w-full max-w-lg overflow-hidden rounded-xl border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Command shouldFilter={!query.includes(" ")} className="bg-popover">
          <div className="flex items-center gap-2 border-b px-4">
            <Sparkles className="text-primary size-4" />
            <Command.Input
              autoFocus
              value={query}
              onValueChange={(v) => {
                setQuery(v);
                setProposal(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && query.trim().includes(" ")) {
                  e.preventDefault();
                  parse.mutate({ text: query });
                }
              }}
              placeholder="Ask in plain English, or run a command…"
              className="placeholder:text-muted-foreground h-12 flex-1 bg-transparent text-sm outline-none"
            />
            {parse.isPending && (
              <Loader2 className="text-muted-foreground size-4 animate-spin" />
            )}
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2">
            {proposal ? (
              proposal === "__PAYWALL__" ? (
                <div className="border-primary/30 bg-primary/8 rounded-lg border p-4 text-center">
                  <Badge variant="default" className="mb-2">
                    Pro feature
                  </Badge>
                  <p className="text-sm">
                    The ⌘K command agent is part of Momentum Pro.
                  </p>
                  <button
                    onClick={() => {
                      router.push("/billing");
                      setOpen(false);
                    }}
                    className="bg-primary text-primary-foreground mt-3 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium"
                  >
                    <Sparkles className="size-4" /> Upgrade to Pro
                  </button>
                </div>
              ) : (
                <div className="border-primary/30 bg-primary/8 rounded-lg border p-4">
                  <Badge variant="default" className="mb-2">
                    Proposed action
                  </Badge>
                  <p className="text-sm">{proposal}</p>
                  <p className="text-muted-foreground mt-3 text-xs">
                    Approval-first: connect the Corsair MCP to execute. (See
                    MIGRATION.md)
                  </p>
                </div>
              )
            ) : (
              <>
                <Command.Empty className="text-muted-foreground px-3 py-6 text-center text-sm">
                  Press Enter to ask Momentum to figure it out.
                </Command.Empty>
                <Command.Group
                  heading="Go to"
                  className="text-muted-foreground px-1 text-xs"
                >
                  <Item
                    icon={Inbox}
                    onSelect={() => {
                      router.push("/inbox");
                      setOpen(false);
                    }}
                  >
                    Inbox
                  </Item>
                  <Item
                    icon={CalendarDays}
                    onSelect={() => {
                      router.push("/calendar");
                      setOpen(false);
                    }}
                  >
                    Calendar
                  </Item>
                </Command.Group>
                <Command.Group
                  heading="Actions"
                  className="text-muted-foreground px-1 text-xs"
                >
                  <Item
                    icon={Send}
                    onSelect={() => {
                      router.push("/inbox?compose=1");
                      setOpen(false);
                    }}
                  >
                    Compose email
                  </Item>
                  <Item
                    icon={Search}
                    onSelect={() => {
                      router.push("/inbox");
                      setOpen(false);
                    }}
                  >
                    Search mail
                  </Item>
                </Command.Group>
              </>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

function Item({
  icon: Icon,
  children,
  onSelect,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="text-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm"
    >
      <Icon className="text-muted-foreground size-4" />
      {children}
    </Command.Item>
  );
}
