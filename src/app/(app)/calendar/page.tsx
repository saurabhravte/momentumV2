"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Loader2,
  Send,
  X,
  MapPin,
  Users,
} from "lucide-react";

import { api } from "@/trpc/react";
import { formatEventWhen, formatAttendees } from "@/lib/display";
import { formatWeekLabel, getWeekBounds } from "@/lib/week";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

// ── Grid config ────────────────────────────────────────────────────────────
const DAY_START = 7; // 7am
const DAY_END = 22; // 10pm
const HOUR_H = 52; // px per hour
const HOURS = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i);

// Vibrant per-event palette (Google-style). Picked deterministically by title.
const PALETTE = [
  "#4285F4", "#0B8043", "#D50000", "#F4511E", "#8E24AA",
  "#039BE5", "#E67C73", "#F6BF26", "#33B679", "#7986CB",
];
function colorFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length]!;
}

function toLocal(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type ApiEvent = {
  id: string;
  summary: string;
  description: string;
  location: string;
  start: string;
  end: string;
  attendees: string[];
};

function isAllDay(start: string) {
  return Boolean(start) && !start.includes("T");
}

export default function CalendarPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<ApiEvent | null>(null);

  const week = useMemo(() => getWeekBounds(weekOffset), [weekOffset]);
  const utils = api.useUtils();

  const events = api.calendar.searchEvents.useQuery({
    query: "",
    weekStart: week.start.toISOString(),
    weekEnd: week.end.toISOString(),
    limit: 100,
    offset: 0,
  });

  const refresh = api.calendar.refreshEvents.useMutation({
    onSuccess: () => utils.calendar.searchEvents.invalidate(),
  });

  // Seven day Date objects for the visible week.
  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(week.start);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [week.start],
  );

  const today = new Date();
  const isToday = (d: Date) => d.toDateString() === today.toDateString();

  // Bucket events into all-day vs timed, indexed by day column.
  const { allDayByDay, timedByDay } = useMemo(() => {
    const allDay: ApiEvent[][] = Array.from({ length: 7 }, () => []);
    const timed: ApiEvent[][] = Array.from({ length: 7 }, () => []);
    for (const ev of (events.data ?? []) as ApiEvent[]) {
      if (!ev.start) continue;
      const startDate = new Date(ev.start);
      const col = days.findIndex((d) => d.toDateString() === startDate.toDateString());
      if (col < 0) continue;
      if (isAllDay(ev.start)) allDay[col]!.push(ev);
      else timed[col]!.push(ev);
    }
    return { allDayByDay: allDay, timedByDay: timed };
  }, [events.data, days]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground text-sm">
            {formatWeekLabel(week.start, week.end)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w - 1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w + 1)}>
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              refresh.mutate({
                weekStart: week.start.toISOString(),
                weekEnd: week.end.toISOString(),
              })
            }
            disabled={refresh.isPending}
          >
            <RefreshCw className={refresh.isPending ? "size-4 animate-spin" : "size-4"} />
            Sync
          </Button>
          <Button size="sm" onClick={() => setCreating((c) => !c)}>
            <Plus className="size-4" /> New event
          </Button>
        </div>
      </div>

      {creating && (
        <EventComposer defaultWeekStart={week.start} onClose={() => setCreating(false)} />
      )}

      {/* ── Week grid ───────────────────────────────────────────────────── */}
      <div className="mt-6 overflow-hidden rounded-xl border bg-card">
        {/* Day headers */}
        <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] border-b">
          <div />
          {days.map((d, i) => (
            <div
              key={i}
              className="border-l px-2 py-2 text-center"
            >
              <div className="text-muted-foreground text-[11px] uppercase">
                {DAY_NAMES[i]}
              </div>
              <div
                className={cn(
                  "mx-auto mt-0.5 grid size-7 place-items-center rounded-full text-sm font-medium",
                  isToday(d) && "bg-primary text-primary-foreground",
                )}
              >
                {d.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* All-day row */}
        <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] border-b bg-muted/30">
          <div className="text-muted-foreground py-1 pr-1 text-right text-[10px]">
            all-day
          </div>
          {allDayByDay.map((list, i) => (
            <div key={i} className="min-h-7 space-y-1 border-l p-1">
              {list.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => setSelected(ev)}
                  className="block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium text-white"
                  style={{ background: colorFor(ev.summary || ev.id) }}
                >
                  {ev.summary || "(untitled)"}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Timed grid */}
        <div className="relative grid grid-cols-[3.5rem_repeat(7,1fr)]">
          {/* Hour labels + horizontal lines */}
          <div>
            {HOURS.map((h) => (
              <div
                key={h}
                style={{ height: HOUR_H }}
                className="text-muted-foreground relative pr-1 text-right text-[10px]"
              >
                <span className="absolute -top-1.5 right-1">
                  {h % 12 === 0 ? 12 : h % 12}
                  {h < 12 ? "am" : "pm"}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((d, col) => (
            <div key={col} className="relative border-l">
              {/* hour lines */}
              {HOURS.map((h) => (
                <div key={h} style={{ height: HOUR_H }} className="border-b border-border/40" />
              ))}
              {/* today highlight */}
              {isToday(d) && (
                <div className="pointer-events-none absolute inset-0 bg-primary/[0.04]" />
              )}
              {/* events */}
              {timedByDay[col]!.map((ev) => {
                const s = new Date(ev.start);
                const e = ev.end ? new Date(ev.end) : new Date(s.getTime() + 3600000);
                const startMin = (s.getHours() - DAY_START) * 60 + s.getMinutes();
                const endMin = (e.getHours() - DAY_START) * 60 + e.getMinutes();
                const top = Math.max(0, (startMin / 60) * HOUR_H);
                const height = Math.max(
                  18,
                  ((Math.min(endMin, (DAY_END - DAY_START) * 60) - startMin) / 60) * HOUR_H - 2,
                );
                const bg = colorFor(ev.summary || ev.id);
                return (
                  <button
                    key={ev.id}
                    onClick={() => setSelected(ev)}
                    className="absolute left-0.5 right-0.5 overflow-hidden rounded-md px-1.5 py-1 text-left text-white shadow-sm transition-opacity hover:opacity-90"
                    style={{ top, height, background: bg }}
                  >
                    <div className="truncate text-[11px] font-semibold leading-tight">
                      {ev.summary || "(untitled)"}
                    </div>
                    <div className="truncate text-[10px] opacity-90">
                      {s.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {events.isLoading && (
        <p className="text-muted-foreground mt-4 flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" /> Loading events…
        </p>
      )}

      {selected && (
        <EventDetail event={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function EventDetail({ event, onClose }: { event: ApiEvent; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onClick={onClose}
    >
      <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className="size-3 rounded-full"
                style={{ background: colorFor(event.summary || event.id) }}
              />
              <h2 className="text-lg font-semibold">{event.summary || "(untitled)"}</h2>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>
          <p className="text-muted-foreground mt-2 text-sm">
            {formatEventWhen(event.start, event.end)}
          </p>
          {event.location && (
            <p className="mt-2 flex items-center gap-2 text-sm">
              <MapPin className="text-muted-foreground size-4" /> {event.location}
            </p>
          )}
          {event.attendees.length > 0 && (
            <p className="mt-2 flex items-center gap-2 text-sm">
              <Users className="text-muted-foreground size-4" />
              {formatAttendees(event.attendees)}
            </p>
          )}
          {event.description && (
            <p className="text-muted-foreground mt-3 whitespace-pre-wrap text-sm">
              {event.description}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EventComposer({
  defaultWeekStart,
  onClose,
}: {
  defaultWeekStart: Date;
  onClose: () => void;
}) {
  const start0 = new Date(defaultWeekStart);
  start0.setHours(9, 0, 0, 0);
  const end0 = new Date(start0);
  end0.setHours(10);

  const [summary, setSummary] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState(toLocal(start0));
  const [end, setEnd] = useState(toLocal(end0));
  const [attendees, setAttendees] = useState("");

  const utils = api.useUtils();
  const emails = attendees.split(",").map((s) => s.trim()).filter(Boolean);

  const create = api.calendar.createDraft.useMutation({
    onSuccess: () => {
      void utils.calendar.searchEvents.invalidate();
      onClose();
    },
  });
  const invite = api.calendar.sendInvite.useMutation({
    onSuccess: () => {
      void utils.calendar.searchEvents.invalidate();
      onClose();
    },
  });

  const payload = {
    summary,
    description,
    location,
    start: new Date(start).toISOString(),
    end: new Date(end).toISOString(),
  };

  return (
    <Card className="mt-4">
      <CardContent className="space-y-3 p-4">
        <Input placeholder="Event title" value={summary} onChange={(e) => setSummary(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <label className="text-muted-foreground text-xs">
            Start
            <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label className="text-muted-foreground text-xs">
            End
            <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
          </label>
        </div>
        <Input placeholder="Location (optional)" value={location} onChange={(e) => setLocation(e.target.value)} />
        <Input
          placeholder="Attendees (comma-separated emails)"
          value={attendees}
          onChange={(e) => setAttendees(e.target.value)}
        />
        <Textarea
          placeholder="Description (optional)"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!summary || create.isPending}
            onClick={() => create.mutate(payload)}
          >
            Save (no invite)
          </Button>
          <Button
            size="sm"
            disabled={!summary || emails.length === 0 || invite.isPending}
            onClick={() => invite.mutate({ ...payload, attendees: emails })}
          >
            {invite.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Send invite
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
