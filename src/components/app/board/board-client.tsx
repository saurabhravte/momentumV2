"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";

/**
 * Kanban board ported from the reference demo (To Do / In Progress / Done +
 * drag & drop), backed by api.kanban so cards persist per-user. Uses native
 * HTML5 drag-and-drop (no extra deps) and optimistic invalidation so the board
 * feels instant.
 */
type Column = { key: "todo" | "in_progress" | "done"; label: string };

const COLUMNS: Column[] = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "done", label: "Done" },
];

export function BoardClient() {
  const utils = api.useUtils();
  const tasks = api.kanban.list.useQuery();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);

  const create = api.kanban.create.useMutation({
    onSuccess: () => utils.kanban.list.invalidate(),
  });
  const move = api.kanban.move.useMutation({
    // Optimistic: snap the card to the new column immediately.
    onMutate: async (vars) => {
      await utils.kanban.list.cancel();
      const prev = utils.kanban.list.getData();
      utils.kanban.list.setData(undefined, (old) =>
        old?.map((t) =>
          t.id === vars.id ? { ...t, status: vars.status } : t,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) utils.kanban.list.setData(undefined, ctx.prev);
    },
    onSettled: () => utils.kanban.list.invalidate(),
  });
  const remove = api.kanban.remove.useMutation({
    onSuccess: () => utils.kanban.list.invalidate(),
  });

  const byColumn = (col: string) =>
    (tasks.data ?? [])
      .filter((t) => t.status === col)
      .sort((a, b) => a.position - b.position);

  const onDrop = (col: Column["key"]) => {
    if (dragId) {
      const target = tasks.data?.find((t) => t.id === dragId);
      if (target && target.status !== col) {
        move.mutate({ id: dragId, status: col, position: Date.now() % 100000 });
      }
    }
    setDragId(null);
    setOverCol(null);
  };

  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Board</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Track what needs doing. Drag cards between columns.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => (
          <div
            key={col.key}
            onDragOver={(e) => {
              e.preventDefault();
              setOverCol(col.key);
            }}
            onDragLeave={() => setOverCol((c) => (c === col.key ? null : c))}
            onDrop={() => onDrop(col.key)}
            className={cn(
              "bg-card/40 flex flex-col rounded-xl border p-3 transition-colors",
              overCol === col.key && "border-primary/50 bg-primary/5",
            )}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-sm font-medium">{col.label}</h2>
              <span className="bg-muted text-muted-foreground rounded-full px-2 text-xs">
                {byColumn(col.key).length}
              </span>
            </div>

            <div className="min-h-24 flex-1 space-y-2">
              {byColumn(col.key).map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => setDragId(task.id)}
                  onDragEnd={() => setDragId(null)}
                  className={cn(
                    "group bg-card flex items-start gap-2 rounded-lg border p-3 text-sm shadow-sm",
                    "cursor-grab active:cursor-grabbing",
                    dragId === task.id && "opacity-50",
                  )}
                >
                  <GripVertical className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  <span className="min-w-0 flex-1 break-words">
                    {task.title}
                  </span>
                  <button
                    onClick={() => remove.mutate({ id: task.id })}
                    aria-label="Delete task"
                    className="text-muted-foreground hover:text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <AddTask
              onAdd={(title) => create.mutate({ title, status: col.key })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function AddTask({ onAdd }: { onAdd: (title: string) => void }) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);

  const submit = () => {
    const t = value.trim();
    if (!t) return;
    onAdd(t);
    setValue("");
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:bg-accent hover:text-foreground mt-2 flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors"
      >
        <Plus className="size-4" /> Add task
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <Input
        autoFocus
        value={value}
        placeholder="Task title…"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") setOpen(false);
        }}
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} className="flex-1">
          Add
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
