"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, RefreshCw, Loader2, Send } from "lucide-react";

import { api } from "@/trpc/react";
import { formatEventWhen, formatAttendees } from "@/lib/display";
import { formatWeekLabel, getWeekBounds } from "@/lib/week";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

function toLocal(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function CalendarPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [creating, setCreating] = useState(false);

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

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground">
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
            <RefreshCw className={refresh.isPending ? "size-4 animate-spin" : "size-4"} /> Refresh
          </Button>
          <Button size="sm" onClick={() => setCreating((c) => !c)}>
            <Plus className="size-4" /> New event
          </Button>
        </div>
      </div>

      {creating && <EventComposer defaultWeekStart={week.start} onClose={() => setCreating(false)} />}

      <div className="mt-6 space-y-2">
        {events.isLoading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading events…
          </p>
        )}
        {events.data?.length === 0 && (
          <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
            Nothing scheduled this week.
          </p>
        )}
        {events.data?.map((ev) => (
          <Card key={ev.id} className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-start gap-3 p-4">
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-source-calendar" />
              <div className="min-w-0 flex-1">
                <div className="font-medium">{ev.summary || "(untitled)"}</div>
                <div className="text-sm text-muted-foreground">
                  {formatEventWhen(ev.start, ev.end)}
                  {ev.location && <> · {ev.location}</>}
                </div>
                {ev.attendees.length > 0 && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {formatAttendees(ev.attendees)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
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
          <label className="text-xs text-muted-foreground">
            Start
            <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label className="text-xs text-muted-foreground">
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
