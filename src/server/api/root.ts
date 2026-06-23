import { aiRouter } from "@/server/api/routers/ai";
import { calendarRouter } from "@/server/api/routers/calendar";
import { gmailRouter } from "@/server/api/routers/gmail";
import { billingRouter } from "@/server/api/routers/billing";
import { dashboardRouter } from "@/server/api/routers/dashboard";
import { kanbanRouter } from "@/server/api/routers/kanban";
import { notificationsRouter } from "@/server/api/routers/notifications";
import { preferencesRouter } from "@/server/api/routers/preferences";
import { catchUpRouter } from "@/server/api/routers/catch-up";
import { connectionsRouter } from "@/server/api/routers/connections";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  gmail: gmailRouter,
  calendar: calendarRouter,
  ai: aiRouter,
  billing: billingRouter,
  dashboard: dashboardRouter,
  kanban: kanbanRouter,
  notifications: notificationsRouter,
  preferences: preferencesRouter,
  catchUp: catchUpRouter,
  connections: connectionsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 */
export const createCaller = createCallerFactory(appRouter);
