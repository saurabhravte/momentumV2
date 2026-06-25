import {
  pgTable,
  text,
  jsonb,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";

/**
 * ── Kanban board ──────────────────────────────────────────────────────────
 * One row per task, scoped to the owning user. `status` is the column the card
 * lives in; `position` is a float so we can drop a card *between* two others by
 * averaging their positions without renumbering the whole column.
 *
 * Modelled on the reference Kanban demo (To Do / In Progress / Done + drag &
 * drop) but persisted per-user instead of living only in the DOM.
 */
export const KANBAN_COLUMNS = ["todo", "in_progress", "done"] as const;
export type KanbanColumn = (typeof KANBAN_COLUMNS)[number];

// Card priority. "normal" is the default; "urgent" / "awaited" surface visually
// and sort to the top of their column.
export const KANBAN_PRIORITIES = [
  "urgent",
  "awaited",
  "normal",
  "low",
] as const;
export type KanbanPriority = (typeof KANBAN_PRIORITIES)[number];

export const kanbanTasks = pgTable("kanban_tasks", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  // "todo" | "in_progress" | "done"
  status: text("status").notNull().default("todo"),
  // "urgent" | "awaited" | "normal" | "low"
  priority: text("priority").notNull().default("normal"),
  position: integer("position").notNull().default(0),
  // optional link back to the item that spawned this task (email id, etc.)
  sourceRef: text("source_ref"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type KanbanTask = typeof kanbanTasks.$inferSelect;

/**
 * ── User preferences ──────────────────────────────────────────────────────
 * App-level customisation the user controls from Settings. Auth-owned fields
 * (name, image, email) stay in the Better Auth `user` table and are edited via
 * authClient.updateUser; this table holds everything that is purely product
 * preference so we never fight the auth adapter over schema ownership.
 */
export const userPreferences = pgTable("user_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  // "auto" follows the time of day; otherwise a fixed greeting tone.
  greetingStyle: text("greeting_style").notNull().default("auto"),
  // UI density for lists / cards.
  density: text("density").notNull().default("comfortable"),
  // which connector colour drives accents on the dashboard.
  accentSource: text("accent_source").notNull().default("gmail"),
  // master switch for the notification bell.
  notificationsEnabled: text("notifications_enabled").notNull().default("on"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type UserPreferences = typeof userPreferences.$inferSelect;

export const corsairIntegrations = pgTable("corsair_integrations", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  name: text("name").notNull(),
  config: jsonb("config").notNull().default({}),
  dek: text("dek"),
});

export const corsairAccounts = pgTable("corsair_accounts", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  tenantId: text("tenant_id").notNull(),
  integrationId: text("integration_id")
    .notNull()
    .references(() => corsairIntegrations.id),
  config: jsonb("config").notNull().default({}),
  dek: text("dek"),
});

export const corsairEntities = pgTable("corsair_entities", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  accountId: text("account_id")
    .notNull()
    .references(() => corsairAccounts.id),
  entityId: text("entity_id").notNull(),
  entityType: text("entity_type").notNull(),
  version: text("version").notNull(),
  data: jsonb("data").notNull().default({}),
});

export const corsairEvents = pgTable("corsair_events", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  accountId: text("account_id")
    .notNull()
    .references(() => corsairAccounts.id),
  eventType: text("event_type").notNull(),
  payload: jsonb("payload").notNull().default({}),
  status: text("status"),
});

/**
 * ── Billing / subscriptions ──────────────────────────────────────────────
 * One row per user. `plan` is the source of truth the API uses to gate AI
 * features ("free" → AI blocked, "pro" → AI allowed). The Razorpay ids let us
 * reconcile webhook events and let the user manage/cancel their subscription.
 *
 * `plan` is intentionally NOT trusted from the client — it is only ever written
 * by the verified Razorpay webhook (subscription.* events) or the signed
 * payment-verification mutation. See src/server/api/routers/billing.ts.
 */
export const subscriptions = pgTable("subscriptions", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  // "free" | "pro"
  plan: text("plan").notNull().default("free"),
  // Razorpay subscription lifecycle: created | authenticated | active |
  // pending | halted | cancelled | completed | expired
  status: text("status"),
  razorpayCustomerId: text("razorpay_customer_id"),
  razorpaySubscriptionId: text("razorpay_subscription_id"),
  // End of the currently paid period — access stays "pro" until this passes.
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Subscription = typeof subscriptions.$inferSelect;
