"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  CalendarDays,
  KanbanSquare,
  Sparkles,
  Zap,
  Blocks,
  Settings,
  CreditCard,
  LogOut,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/marketing/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { api } from "@/trpc/react";
import { UpgradeCard } from "@/components/billing/upgrade-card";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/board", label: "Board", icon: KanbanSquare },
  { href: "/catch-up", label: "Catch Me Up", icon: Zap },
  { href: "/connections", label: "Connections", icon: Blocks },
  { href: "/billing", label: "Billing", icon: CreditCard },
];

const STORAGE_KEY = "momentum:sidebar-collapsed";

/** Shared link styling — active items get a gradient spectrum bar on the left. */
function navLinkClass(active: boolean, collapsed: boolean) {
  return cn(
    "group relative flex items-center gap-3 rounded-[9px] border border-transparent px-3 py-2 text-sm font-medium transition-all duration-150",
    collapsed && "justify-center px-0",
    active
      ? "bg-card text-foreground border-border elevate-sm before:absolute before:-left-3 before:top-1/2 before:h-[18px] before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-[linear-gradient(180deg,var(--primary),var(--fuchsia))]"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );
}

export function Sidebar({
  user,
}: {
  user?: { name?: string; email?: string; image?: string | null };
}) {
  const pathname = usePathname();
  const status = api.billing.status.useQuery();
  const isPro = status.data?.plan === "pro";

  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);
  const toggle = () => {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  };

  return (
    <aside
      className={cn(
        "glass flex h-screen shrink-0 flex-col border-r py-3.5 transition-[width] duration-200",
        collapsed ? "w-16 px-2" : "w-62 px-3",
      )}
    >
      <div className="flex items-center justify-between px-2">
        {!collapsed && <Logo className="text-[15px]" />}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hover:bg-muted text-muted-foreground hover:text-foreground grid size-7 place-items-center rounded-md transition-colors"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </button>
      </div>

      {!collapsed && status.data && (
        <div className="mt-2.5 px-2">
          <span
            className={cn(
              "inline-flex w-max items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold",
              isPro
                ? "text-foreground border border-[color-mix(in_oklch,var(--primary)_30%,transparent)] bg-[linear-gradient(135deg,color-mix(in_oklch,var(--primary)_22%,transparent),color-mix(in_oklch,var(--fuchsia)_18%,transparent))]"
                : "bg-muted text-muted-foreground",
            )}
          >
            {isPro ? "✦ Pro" : "Free"}
          </span>
        </div>
      )}

      <nav className="mt-5 flex-1 space-y-1">
        {nav.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={navLinkClass(active, collapsed)}
            >
              <item.icon className="size-4.25 shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}

        {/* AI command bar — gated to Pro, given a vibrant gradient treatment. */}
        <button
          type="button"
          title={collapsed ? "Ask Momentum" : undefined}
          onClick={() =>
            isPro
              ? window.dispatchEvent(new CustomEvent("open-command-palette"))
              : (window.location.href = "/billing")
          }
          className={cn(
            "flex w-full items-center gap-3 rounded-[9px] border border-[color-mix(in_oklch,var(--primary)_24%,transparent)] bg-[linear-gradient(120deg,color-mix(in_oklch,var(--primary)_13%,transparent),color-mix(in_oklch,var(--fuchsia)_11%,transparent))] px-3 py-2 text-sm font-medium transition-all hover:border-[color-mix(in_oklch,var(--primary)_45%,transparent)] hover:shadow-[0_0_0_3px_color-mix(in_oklch,var(--primary)_13%,transparent)]",
            collapsed && "justify-center px-0",
          )}
        >
          <Sparkles className="text-primary size-4.25 shrink-0" />
          {!collapsed && "Ask Momentum"}
          {!collapsed &&
            (isPro ? (
              <kbd className="bg-card text-muted-foreground ml-auto rounded border px-1.5 font-mono text-[10px]">
                ⌘K
              </kbd>
            ) : (
              <Lock className="ml-auto size-3.5" />
            ))}
        </button>
      </nav>

      {!collapsed && status.data && !isPro && (
        <div className="mb-3">
          <UpgradeCard />
        </div>
      )}

      <div className="space-y-2 border-t pt-3">
        <Link
          href="/settings"
          title={collapsed ? "Settings" : undefined}
          className={navLinkClass(pathname.startsWith("/settings"), collapsed)}
        >
          <Settings className="size-4.25 shrink-0" />
          {!collapsed && "Settings"}
        </Link>

        <div
          className={cn(
            "flex items-center gap-2 px-2",
            collapsed && "justify-center px-0",
          )}
        >
          {user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="" className="size-7 rounded-full" />
          ) : (
            <span className="grid size-7 place-items-center rounded-full bg-[linear-gradient(135deg,var(--cyan),var(--primary))] text-xs font-semibold text-white">
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </span>
          )}
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">
                  {user?.name ?? "User"}
                </p>
                <p className="text-muted-foreground truncate text-[11px]">
                  {user?.email}
                </p>
              </div>
              <ThemeToggle />
            </>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          title={collapsed ? "Sign out" : undefined}
          className={cn(
            "text-muted-foreground w-full justify-start",
            collapsed && "justify-center",
          )}
          onClick={() =>
            authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  window.location.href = "/";
                },
              },
            })
          }
        >
          <LogOut className="size-4" /> {!collapsed && "Sign out"}
        </Button>
      </div>
    </aside>
  );
}
