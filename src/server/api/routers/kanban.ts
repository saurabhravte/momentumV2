import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { kanbanTasks, KANBAN_COLUMNS } from "@/server/db/schema";

/**
 * Kanban board, ported from the reference HTML/JS demo (To Do / In Progress /
 * Done + drag & drop) but persisted per-user. Ownership is enforced on every
 * write by matching `userId` in the WHERE clause, so one user can never move or
 * delete another user's card even if they guess an id.
 */
const columnEnum = z.enum(KANBAN_COLUMNS);

export const kanbanRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(kanbanTasks)
      .where(eq(kanbanTasks.userId, ctx.user.id));

    return rows.sort(
      (a, b) =>
        a.status.localeCompare(b.status) || a.position - b.position,
    );
  }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(500),
        status: columnEnum.default("todo"),
        sourceRef: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // New cards drop at the bottom of their column.
      const siblings = await ctx.db
        .select({ position: kanbanTasks.position })
        .from(kanbanTasks)
        .where(
          and(
            eq(kanbanTasks.userId, ctx.user.id),
            eq(kanbanTasks.status, input.status),
          ),
        );
      const nextPos =
        siblings.reduce((max, s) => Math.max(max, s.position), 0) + 1;

      const [row] = await ctx.db
        .insert(kanbanTasks)
        .values({
          id: randomUUID(),
          userId: ctx.user.id,
          title: input.title,
          status: input.status,
          position: nextPos,
          sourceRef: input.sourceRef,
        })
        .returning();
      return row;
    }),

  /** Move a card to another column (or reorder) — the drag & drop endpoint. */
  move: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: columnEnum,
        position: z.number().int().min(0).default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const res = await ctx.db
        .update(kanbanTasks)
        .set({
          status: input.status,
          position: input.position,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(kanbanTasks.id, input.id),
            eq(kanbanTasks.userId, ctx.user.id),
          ),
        )
        .returning();
      if (res.length === 0)
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found." });
      return res[0];
    }),

  rename: protectedProcedure
    .input(z.object({ id: z.string(), title: z.string().min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(kanbanTasks)
        .set({ title: input.title, updatedAt: new Date() })
        .where(
          and(
            eq(kanbanTasks.id, input.id),
            eq(kanbanTasks.userId, ctx.user.id),
          ),
        );
      return { ok: true };
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(kanbanTasks)
        .where(
          and(
            eq(kanbanTasks.id, input.id),
            eq(kanbanTasks.userId, ctx.user.id),
          ),
        );
      return { ok: true };
    }),
});
