/**
 * tRPC server setup.
 *
 * Changes from the starter:
 *  1. CONTEXT now resolves the Better Auth session from the request headers and
 *     loads the user's billing plan, so every procedure knows *who* is calling
 *     and *what they're entitled to*. This is what makes the app multi-user.
 *  2. `protectedProcedure` — requires a signed-in user.
 *  3. `paidProcedure`     — requires a signed-in user *on the "pro" plan*.
 *     AI endpoints use this so free users get everything except AI.
 */
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { subscriptions } from "@/server/db/schema";

/**
 * 1. CONTEXT
 *
 * Resolves the current session (if any) and the caller's plan. Both code paths
 * (HTTP route handler and RSC caller) already pass a `Headers` object, which is
 * all Better Auth needs to validate the session cookie.
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth.api.getSession({ headers: opts.headers });

  let plan: "free" | "pro" = "free";
  if (session?.user) {
    const [sub] = await db
      .select({
        plan: subscriptions.plan,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
      })
      .from(subscriptions)
      .where(eq(subscriptions.userId, session.user.id))
      .limit(1);

    // "pro" only counts while the paid period is still valid.
    const stillValid =
      !sub?.currentPeriodEnd || sub.currentPeriodEnd.getTime() > Date.now();
    if (sub?.plan === "pro" && stillValid) plan = "pro";
  }

  return {
    db,
    session,
    user: session?.user ?? null,
    plan,
    ...opts,
  };
};

type Context = Awaited<ReturnType<typeof createTRPCContext>>;

/**
 * 2. INITIALIZATION
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();
  if (t._config.isDev) {
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  const result = await next();
  console.log(`[TRPC] ${path} took ${Date.now() - start}ms to execute`);
  return result;
});

/** Public (unauthenticated) procedure. */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Authenticated procedure — guarantees `ctx.user` is non-null inside resolvers.
 * Everything a free user can do (inbox, calendar, search, dashboard) builds on
 * this.
 */
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Sign in required.",
      });
    }
    return next({
      ctx: { ...ctx, session: ctx.session, user: ctx.session.user },
    });
  });

/**
 * Paid procedure — AI features only. Free users hit this and get a typed
 * FORBIDDEN with a `PAYWALL` cause the client uses to pop the upgrade modal.
 */
export const paidProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.plan !== "pro") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "PAYWALL: AI features are available on the Pro plan.",
    });
  }
  return next({ ctx });
});
