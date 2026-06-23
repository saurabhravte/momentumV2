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
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";
import { api } from "@/trpc/react";
import { UpgradeCard } from "@/components/billing/upgrade-card";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/board", label: "Board", icon: KanbanSquare },
  { href: "/catch-up", label: "Catch Me Up", icon: Zap },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

const STORAGE_KEY = "momentum:sidebar-collapsed";

export function Sidebar({
  user,
}: {
  user?: { name?: string; email?: string; image?: string | null };
}) {
  const pathname = usePathname();
  const status = api.billing.status.useQuery();
  const isPro = status.data?.plan === "pro";

  // Collapse state persists across navigations/sessions. Initialised from
  // localStorage after mount to avoid an SSR/client hydration mismatch.
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
        "bg-card/60 flex h-screen shrink-0 flex-col border-r py-4 transition-[width] duration-200",
        collapsed ? "w-16 px-2" : "w-60 px-3",
      )}
    >
      <div className="flex items-center justify-between px-2">
        {!collapsed && <Logo className="text-sm" />}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hover:bg-accent text-muted-foreground hover:text-foreground grid size-7 place-items-center rounded-md transition-colors"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </button>
      </div>

      {!collapsed && status.data && (
        <div className="mt-2 px-2">
          <Badge
            variant={isPro ? "default" : "secondary"}
            className="text-[10px]"
          >
            {isPro ? "Pro" : "Free"}
          </Badge>
        </div>
      )}

      <nav className="mt-6 flex-1 space-y-1">
        {nav.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                collapsed && "justify-center px-0",
                active
                  ? "bg-primary/12 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}

        {/* AI command bar — gated to Pro. */}
        <button
          type="button"
          title={collapsed ? "Ask Momentum" : undefined}
          onClick={() =>
            isPro
              ? window.dispatchEvent(new CustomEvent("open-command-palette"))
              : (window.location.href = "/billing")
          }
          className={cn(
            "text-muted-foreground hover:bg-accent hover:text-foreground flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
            collapsed && "justify-center px-0",
          )}
        >
          <Sparkles className="size-4 shrink-0" />
          {!collapsed && "Ask Momentum"}
          {!collapsed &&
            (isPro ? (
              <kbd className="bg-muted ml-auto rounded border px-1.5 text-[10px]">
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
            <span className="bg-primary/12 text-primary grid size-7 place-items-center rounded-full text-xs font-medium">
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </span>
          )}
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">
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
