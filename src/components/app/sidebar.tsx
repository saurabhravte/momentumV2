"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  CalendarDays,
  Sparkles,
  CreditCard,
  LogOut,
  Lock,
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
  { href: "/billing", label: "Billing", icon: CreditCard },
];

export function Sidebar({
  user,
}: {
  user?: { name?: string; email?: string; image?: string | null };
}) {
  const pathname = usePathname();
  const status = api.billing.status.useQuery();
  const isPro = status.data?.plan === "pro";

  return (
    <aside className="bg-card/60 flex h-screen w-60 shrink-0 flex-col border-r px-3 py-4">
      <div className="flex items-center justify-between px-2">
        <Logo className="text-sm" />
        {status.data && (
          <Badge
            variant={isPro ? "default" : "secondary"}
            className="text-[10px]"
          >
            {isPro ? "Pro" : "Free"}
          </Badge>
        )}
      </div>

      <nav className="mt-6 flex-1 space-y-1">
        {nav.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/12 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}

        {/* AI command bar — gated to Pro. Free users see it locked and routed
            to billing instead of opening the palette. */}
        <button
          type="button"
          onClick={() =>
            isPro
              ? window.dispatchEvent(new CustomEvent("open-command-palette"))
              : (window.location.href = "/billing")
          }
          className="text-muted-foreground hover:bg-accent hover:text-foreground flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
        >
          <Sparkles className="size-4" />
          Ask Momentum
          {isPro ? (
            <kbd className="bg-muted ml-auto rounded border px-1.5 text-[10px]">
              ⌘K
            </kbd>
          ) : (
            <Lock className="ml-auto size-3.5" />
          )}
        </button>
      </nav>

      {/* Upgrade promo for free users */}
      {status.data && !isPro && (
        <div className="mb-3">
          <UpgradeCard />
        </div>
      )}

      <div className="space-y-2 border-t pt-3">
        <div className="flex items-center gap-2 px-2">
          {user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="" className="size-7 rounded-full" />
          ) : (
            <span className="bg-primary/12 text-primary grid size-7 place-items-center rounded-full text-xs font-medium">
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">
              {user?.name ?? "User"}
            </p>
            <p className="text-muted-foreground truncate text-[11px]">
              {user?.email}
            </p>
          </div>
          <ThemeToggle />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground w-full justify-start"
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
          <LogOut className="size-4" /> Sign out
        </Button>
      </div>
    </aside>
  );
}
