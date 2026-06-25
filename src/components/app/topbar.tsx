"use client";

import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { NotificationsBell } from "@/components/app/notifications";

const TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  inbox: "Inbox",
  calendar: "Calendar",
  board: "Board",
  "catch-up": "Catch Me Up",
  connections: "Connections",
  settings: "Settings",
  billing: "Billing",
};

/**
 * Glass top bar pinned to every authenticated page. Hosts a breadcrumb, a
 * ⌘K search trigger (dispatches the same event the sidebar uses), and the
 * notification bell. Translucent + blurred so it floats over scrolling content.
 */
export function Topbar() {
  const pathname = usePathname();
  const seg = pathname.split("/").find(Boolean) ?? "dashboard";
  const title = TITLES[seg] ?? "Workspace";

  return (
    <div className="glass sticky top-0 z-40 flex h-14 items-center gap-3 border-b px-4 lg:px-6">
      <span className="text-muted-foreground text-[13px] font-medium">
        Workspace ·{" "}
        <span className="text-foreground font-semibold">{title}</span>
      </span>

      <div className="flex-1" />

      <button
        type="button"
        onClick={() =>
          window.dispatchEvent(new CustomEvent("open-command-palette"))
        }
        className="bg-muted text-muted-foreground hover:border-foreground/15 hidden h-9 w-75 items-center gap-2 rounded-lg border px-3 text-[13px] transition-colors md:flex"
      >
        <Search className="size-3.75" />
        Search or ask anything…
        <kbd className="bg-card ml-auto rounded border px-1.5 font-mono text-[10px]">
          ⌘K
        </kbd>
      </button>

      <NotificationsBell />
    </div>
  );
}
