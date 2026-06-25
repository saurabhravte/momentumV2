"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical, Pencil, Check, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";
import type { KanbanPriority } from "@/server/db/schema";

/**
 * Kanban board (To Do / In Progress / Done + drag & drop), backed by api.kanban
 * so cards persist per-user. Cards carry a priority (Urgent / Awaited / Normal /
 * Low) that is editable inline via the pen icon and sorts the column. Uses
 * native HTML5 drag-and-drop (no extra deps) with optimistic updates so the
 * board feels instant.
 */
type Column = { key: "todo" | "in_progress" | "done"; label: string };

const COLUMNS: Column[] = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "done", label: "Done" },
];

// Priority metadata: label, dot/badge color, and sort weight (lower = top).
const PRIORITIES: {
  key: KanbanPriority;
  label: string;
  color: string;
  weight: number;
}[] = [
  { key: "urgent", label: "Urgent", color: "#e5484d", weight: 0 },
  { key: "awaited", label: "Awaited", color: "#f5a623", weight: 1 },
  { key: "normal", label: "Normal", color: "#8b8d98", weight: 2 },
  { key: "low", label: "Low", color: "#52606d", weight: 3 },
];
const PRIORITY_MAP = Object.fromEntries(PRIORITIES.map((p) => [p.key, p]));

export function BoardClient() {
  const utils = api.useUtils();
  const tasks = api.kanban.list.useQuery();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

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
  const update = api.kanban.update.useMutation({
    // Optimistic edit so title/priority changes apply without a flash.
    onMutate: async (vars) => {
      await utils.kanban.list.cancel();
      const prev = utils.kanban.list.getData();
      utils.kanban.list.setData(undefined, (old) =>
        old?.map((t) => (t.id === vars.id ? { ...t, ...vars } : t)),
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

  // Cards in a column, sorted by priority weight then position.
  const byColumn = (col: string) =>
    (tasks.data ?? [])
      .filter((t) => t.status === col)
      .sort(
        (a, b) =>
          (PRIORITY_MAP[a.priority]?.weight ?? 2) -
            (PRIORITY_MAP[b.priority]?.weight ?? 2) ||
          a.position - b.position,
      );

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
          Track what needs doing. Drag cards between columns, set a priority, or
          click the pen to edit.
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
              {byColumn(col.key).map((task) => {
                const prio = PRIORITY_MAP[task.priority] ?? PRIORITY_MAP.normal!;
                const isEditing = editingId === task.id;

                if (isEditing) {
                  return (
                    <EditTask
                      key={task.id}
                      initialTitle={task.title}
                      initialPriority={task.priority as KanbanPriority}
                      onCancel={() => setEditingId(null)}
                      onSave={(title, priority) => {
                        update.mutate({ id: task.id, title, priority });
                        setEditingId(null);
                      }}
                    />
                  );
                }

                return (
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
                    style={{ borderLeft: `3px solid ${prio.color}` }}
                  >
                    <GripVertical className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="block break-words">{task.title}</span>
                      <span
                        className="mt-1.5 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                        style={{
                          color: prio.color,
                          background: `color-mix(in oklch, ${prio.color} 14%, transparent)`,
                        }}
                      >
                        <span
                          className="size-1.5 rounded-full"
                          style={{ background: prio.color }}
                        />
                        {prio.label}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => setEditingId(task.id)}
                        aria-label="Edit task"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => remove.mutate({ id: task.id })}
                        aria-label="Delete task"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <AddTask
              onAdd={(title, priority) =>
                create.mutate({ title, status: col.key, priority })
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Small priority picker shared by Add + Edit. */
function PriorityPicker({
  value,
  onChange,
}: {
  value: KanbanPriority;
  onChange: (p: KanbanPriority) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PRIORITIES.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => onChange(p.key)}
          className={cn(
            "flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors",
            value === p.key
              ? "font-medium"
              : "text-muted-foreground hover:bg-accent border-transparent",
          )}
          style={
            value === p.key
              ? {
                  color: p.color,
                  borderColor: p.color,
                  background: `color-mix(in oklch, ${p.color} 12%, transparent)`,
                }
              : undefined
          }
        >
          <span
            className="size-1.5 rounded-full"
            style={{ background: p.color }}
          />
          {p.label}
        </button>
      ))}
    </div>
  );
}

function EditTask({
  initialTitle,
  initialPriority,
  onSave,
  onCancel,
}: {
  initialTitle: string;
  initialPriority: KanbanPriority;
  onSave: (title: string, priority: KanbanPriority) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [priority, setPriority] = useState<KanbanPriority>(initialPriority);

  const submit = () => {
    const t = title.trim();
    if (!t) return;
    onSave(t, priority);
  };

  return (
    <div className="bg-card space-y-2 rounded-lg border p-3 shadow-sm">
      <Input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") onCancel();
        }}
      />
      <PriorityPicker value={priority} onChange={setPriority} />
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} className="flex-1">
          <Check className="size-4" /> Save
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function AddTask({
  onAdd,
}: {
  onAdd: (title: string, priority: KanbanPriority) => void;
}) {
  const [value, setValue] = useState("");
  const [priority, setPriority] = useState<KanbanPriority>("normal");
  const [open, setOpen] = useState(false);

  const submit = () => {
    const t = value.trim();
    if (!t) return;
    onAdd(t, priority);
    setValue("");
    setPriority("normal");
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
      <PriorityPicker value={priority} onChange={setPriority} />
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
