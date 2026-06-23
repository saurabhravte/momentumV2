import { Inngest } from "inngest";

/**
 * Inngest client. Used for two things in Momentum:
 *  1. Async AI work (e.g. classifying inbound emails) so the request path stays fast.
 *  2. AI-powered log/event monitoring — every Corsair webhook + notable app event
 *     is sent as an Inngest event and summarized by an LLM into human-readable alerts.
 */
export const inngest = new Inngest({ id: "momentum" });

/** Event payload shapes Momentum emits (used when sending typed events). */
export type AppEvents = {
  "gmail/message.received": {
    data: { messageId: string; subject: string; from: string; snippet: string };
  };
  "app/log.captured": {
    data: {
      level: "info" | "warn" | "error";
      source: string;
      message: string;
      meta?: Record<string, unknown>;
    };
  };
};
