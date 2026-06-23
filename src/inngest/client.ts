import { eventType, Inngest, staticSchema } from "inngest";

/**
 * Inngest client. Used for two things in Momentum:
 *  1. Async AI work (e.g. classifying inbound emails) so the request path stays fast.
 *  2. AI-powered log/event monitoring — every Corsair webhook + notable app event
 *     is sent as an Inngest event and summarized by an LLM into human-readable alerts.
 */
export const inngest = new Inngest({ id: "momentum" });

/**
 * Typed event definitions. Using `eventType` + `staticSchema` gives compile-time
 * types for `event.data` in every function (used as triggers below) without
 * pulling in a runtime validation library.
 */
export const gmailMessageReceived = eventType("gmail/message.received", {
  schema: staticSchema<{
    messageId: string;
    subject: string;
    from: string;
    snippet: string;
  }>(),
});

export const appLogCaptured = eventType("app/log.captured", {
  schema: staticSchema<{
    level: "info" | "warn" | "error";
    source: string;
    message: string;
    meta?: Record<string, unknown>;
  }>(),
});
