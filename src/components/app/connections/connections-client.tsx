"use client";

import { useState } from "react";
import {
  Mail,
  Calendar,
  MessagesSquare,
  GitBranch,
  RefreshCw,
  Plug,
  Check,
  Loader2,
  X,
  ExternalLink,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getWeekBounds } from "@/lib/week";
import { api } from "@/trpc/react";

const ICONS = {
  gmail: Mail,
  calendar: Calendar,
  slack: MessagesSquare,
  github: GitBranch,
} as const;

const DESC: Record<string, string> = {
  gmail: "Email synced into your priority inbox and search.",
  calendar: "Events powering your week view and Catch Me Up.",
  slack: "Surface important DMs and mentions beside your mail.",
  github: "Reviews, mentions and CI in one place.",
};

// Step-by-step instructions shown in the connect modal for token-based tools.
type TokenGuide = {
  title: string;
  tokenHint: string;
  placeholder: string;
  docsUrl: string;
  steps: string[];
};

const TOKEN_GUIDES: Record<"slack" | "github", TokenGuide> = {
  slack: {
    title: "Connect Slack",
    tokenHint: "Bot or user token — starts with xoxb- or xoxp-",
    placeholder: "xoxb-...",
    docsUrl: "https://api.slack.com/apps",
    steps: [
      "Go to api.slack.com/apps and click “Create New App” → “From scratch”. Pick a name and your workspace.",
      "In the sidebar open “OAuth & Permissions”. Under “Scopes → Bot Token Scopes” add: channels:read, channels:history, chat:write, users:read.",
      "Scroll up and click “Install to Workspace”, then “Allow”.",
      "Copy the “Bot User OAuth Token” (it starts with xoxb-) and paste it below.",
    ],
  },
  github: {
    title: "Connect GitHub",
    tokenHint: "Personal access token — starts with ghp_ (classic) or github_pat_",
    placeholder: "ghp_...",
    docsUrl: "https://github.com/settings/tokens",
    steps: [
      "Go to github.com/settings/tokens → “Generate new token” → “Generate new token (classic)”.",
      "Give it a name and an expiry. Under “Select scopes” tick: repo and notifications (read:org is optional for org mentions).",
      "Click “Generate token” at the bottom.",
      "Copy the token shown (you only see it once) and paste it below.",
    ],
  },
};

export function ConnectionsClient() {
  const utils = api.useUtils();
  const status = api.connections.status.useQuery();
  const [busy, setBusy] = useState<string | null>(null);
  // Which token tool's connect modal is open.
  const [tokenModal, setTokenModal] = useState<"slack" | "github" | null>(null);

  const refreshInbox = api.gmail.refreshInbox.useMutation();
  const refreshEvents = api.calendar.refreshEvents.useMutation();
  const connectGoogle = api.connections.connectGoogle.useMutation();
  const connectToken = api.connections.connectToken.useMutation();
  const disconnect = api.connections.disconnect.useMutation();

  const week = getWeekBounds(0);

  // Single place to refresh all server state touched by a connection change.
  const revalidate = async () => {
    await Promise.all([
      utils.connections.status.invalidate(),
      utils.dashboard.overview.invalidate(),
    ]);
  };

  const syncData = async (key: string) => {
    if (key === "gmail") await refreshInbox.mutateAsync(undefined);
    if (key === "googlecalendar")
      await refreshEvents.mutateAsync({
        weekStart: week.start.toISOString(),
        weekEnd: week.end.toISOString(),
      });
  };

  // Connect a tool. Google reuses the sign-in grant; token tools open a modal.
  const connect = async (key: string, kind: string) => {
    if (kind === "token") {
      setTokenModal(key as "slack" | "github");
      return;
    }
    setBusy(key);
    try {
      await connectGoogle.mutateAsync();
      await syncData(key);
      await revalidate();
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Couldn't connect. Try again.",
      );
    } finally {
      setBusy(null);
    }
  };

  // Submit a pasted token from the modal.
  const submitToken = async (key: "slack" | "github", token: string) => {
    setBusy(key);
    try {
      await connectToken.mutateAsync({ key, token });
      setTokenModal(null);
      await revalidate();
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Couldn't connect. Check the token.",
      );
    } finally {
      setBusy(null);
    }
  };

  // Re-sync an already-connected tool.
  const sync = async (key: string) => {
    setBusy(key);
    try {
      await syncData(key);
      await revalidate();
    } finally {
      setBusy(null);
    }
  };

  const doDisconnect = async (key: string, name: string) => {
    if (
      !window.confirm(
        `Disconnect ${name}? This removes its synced data from Momentum. You can reconnect and sync again anytime.`,
      )
    )
      return;
    setBusy(key);
    try {
      await disconnect.mutateAsync({
        key: key as "gmail" | "googlecalendar" | "slack" | "github",
      });
      await revalidate();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Connections</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Connect the tools you want — each one is yours to connect, sync, or
          disconnect at any time.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {(status.data ?? CATALOG_SKELETON).map((tool) => {
          const Icon = ICONS[tool.source] ?? Plug;
          const col = `var(--source-${tool.source})`;
          const isBusy = busy === tool.key;
          const canSync = tool.key === "gmail" || tool.key === "googlecalendar";

          return (
            <div
              key={tool.key}
              className={cn(
                "bg-card flex flex-col rounded-xl border p-5",
                !tool.configured && "opacity-75",
              )}
            >
              <div className="flex items-start justify-between">
                <span
                  className="grid size-10 place-items-center rounded-lg"
                  style={{
                    background: `color-mix(in oklch, ${col} 15%, transparent)`,
                    color: col,
                  }}
                >
                  <Icon className="size-5" />
                </span>
                <StatusPill
                  configured={tool.configured}
                  connected={tool.connected}
                />
              </div>

              <p className="mt-3 font-medium">{tool.name}</p>
              <p className="text-muted-foreground mt-1 flex-1 text-xs">
                {DESC[tool.source] ?? ""}
              </p>

              {tool.configured && tool.connected && (
                <p className="text-muted-foreground mt-3 text-xs">
                  {tool.itemCount.toLocaleString()} items synced
                  {tool.lastSyncedAt && (
                    <>
                      {" · "}
                      {new Date(tool.lastSyncedAt).toLocaleDateString(
                        undefined,
                        { month: "short", day: "numeric" },
                      )}
                    </>
                  )}
                </p>
              )}

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                {!tool.configured ? (
                  <Button size="sm" variant="secondary" className="flex-1" disabled>
                    Coming soon
                  </Button>
                ) : tool.connected ? (
                  <>
                    {canSync && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1"
                        disabled={isBusy}
                        onClick={() => sync(tool.key)}
                      >
                        {isBusy ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <RefreshCw className="size-4" />
                        )}
                        Sync
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      disabled={isBusy}
                      onClick={() => doDisconnect(tool.key, tool.name)}
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={isBusy}
                    onClick={() => connect(tool.key, tool.kind)}
                  >
                    {isBusy ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Plug className="size-4" />
                    )}
                    Connect
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-muted-foreground mt-6 text-xs">
        Gmail and Calendar connect through your Google sign-in. Slack and GitHub
        connect with a token you paste. Disconnecting removes synced data from
        Momentum but never touches the underlying account.
      </p>

      {tokenModal && (
        <TokenConnectModal
          guide={TOKEN_GUIDES[tokenModal]}
          busy={busy === tokenModal}
          onClose={() => setTokenModal(null)}
          onSubmit={(token) => submitToken(tokenModal, token)}
        />
      )}
    </div>
  );
}

function TokenConnectModal({
  guide,
  busy,
  onClose,
  onSubmit,
}: {
  guide: TokenGuide;
  busy: boolean;
  onClose: () => void;
  onSubmit: (token: string) => void;
}) {
  const [token, setToken] = useState("");
  const valid = token.trim().length >= 10;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card w-full max-w-lg rounded-2xl border p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold">{guide.title}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <ol className="mt-4 space-y-2.5">
          {guide.steps.map((step, i) => (
            <li key={i} className="flex gap-2.5 text-sm">
              <span className="bg-primary/10 text-primary grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-semibold">
                {i + 1}
              </span>
              <span className="text-muted-foreground leading-snug">{step}</span>
            </li>
          ))}
        </ol>

        <a
          href={guide.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary mt-3 inline-flex items-center gap-1 text-xs hover:underline"
        >
          Open the setup page <ExternalLink className="size-3" />
        </a>

        <label className="text-muted-foreground mt-5 mb-1 block text-xs">
          {guide.tokenHint}
        </label>
        <Input
          autoFocus
          value={token}
          placeholder={guide.placeholder}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && valid && !busy) onSubmit(token.trim());
          }}
        />

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!valid || busy}
            onClick={() => onSubmit(token.trim())}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Plug className="size-4" />}
            Connect
          </Button>
        </div>
        <p className="text-muted-foreground mt-3 text-[11px]">
          Your token is stored encrypted per-account and is never shown again.
        </p>
      </div>
    </div>
  );
}

function StatusPill({
  configured,
  connected,
}: {
  configured: boolean;
  connected: boolean;
}) {
  if (!configured)
    return (
      <span className="text-muted-foreground bg-muted rounded-full px-2 py-0.5 text-[11px]">
        Not configured
      </span>
    );
  if (connected)
    return (
      <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-600 dark:text-emerald-400">
        <Check className="size-3" /> Connected
      </span>
    );
  return (
    <span className="text-muted-foreground bg-muted rounded-full px-2 py-0.5 text-[11px]">
      Not connected
    </span>
  );
}

// Render placeholder cards while the status query loads.
const CATALOG_SKELETON = [
  { key: "gmail", name: "Gmail", source: "gmail", configured: true, kind: "google", connected: false, itemCount: 0, lastSyncedAt: null },
  { key: "googlecalendar", name: "Calendar", source: "calendar", configured: true, kind: "google", connected: false, itemCount: 0, lastSyncedAt: null },
  { key: "slack", name: "Slack", source: "slack", configured: true, kind: "token", connected: false, itemCount: 0, lastSyncedAt: null },
  { key: "github", name: "GitHub", source: "github", configured: true, kind: "token", connected: false, itemCount: 0, lastSyncedAt: null },
] as const;
