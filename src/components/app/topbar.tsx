"use client";

import { NotificationsBell } from "@/components/app/notifications";

/**
 * Thin top bar pinned to the top-right of every authenticated page. Currently
 * hosts the notification bell; future global controls (search, quick-add) slot
 * in here too. Kept sticky + translucent so it floats over scrolling content.
 */
export function Topbar() {
  return (
    <div className="bg-background/70 sticky top-0 z-40 flex h-14 items-center justify-end gap-2 border-b px-4 backdrop-blur lg:px-6">
      <NotificationsBell />
    </div>
  );
}
