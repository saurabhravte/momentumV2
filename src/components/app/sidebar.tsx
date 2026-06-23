"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, CalendarDays, Sparkles, LogOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/marketing/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

const nav = [
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
];

export function Sidebar({ user }: { user?: { name?: string; email?: string; image?: string | null } }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r bg-card/60 px-3 py-4">
      <div className="px-2">
        <Logo className="text-sm" />
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
                  ? "bg-primary/12 font-medium text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Sparkles className="size-4" />
          Ask Momentum
          <kbd className="ml-auto rounded border bg-muted px-1.5 text-[10px]">⌘K</kbd>
        </button>
      </nav>

      <div className="space-y-2 border-t pt-3">
        <div className="flex items-center gap-2 px-2">
          {user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="" className="size-7 rounded-full" />
          ) : (
            <span className="grid size-7 place-items-center rounded-full bg-primary/12 text-xs font-medium text-primary">
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{user?.name ?? "User"}</p>
            <p className="truncate text-[11px] text-muted-foreground">{user?.email}</p>
          </div>
          <ThemeToggle />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
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
