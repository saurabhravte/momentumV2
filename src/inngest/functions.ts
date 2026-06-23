import { inngest } from "./client";
import { classifyEmail, summarizeActivity } from "@/server/lib/ai";

/**
 * 1) Email triage — runs off the request path whenever a new Gmail message is
 *    cached by Corsair (fired from the webhook handler). Classifies priority
 *    with a cheap LLM. In a full build this would persist the label back to the
 *    entity cache; here it logs + emits an app log event for the monitor.
 */
export const classifyInboundEmail = inngest.createFunction(
  {
    id: "classify-inbound-email",
    concurrency: 10,
    triggers: [{ event: "gmail/message.received" }],
  },
  async ({ event, step }) => {
    const classification = await step.run("classify", () =>
      classifyEmail({
        subject: event.data.subject,
        from: event.data.from,
        snippet: event.data.snippet,
      }),
    );

    await step.sendEvent("emit-log", {
      name: "app/log.captured",
      data: {
        level: classification.priority === "urgent" ? "warn" : "info",
        source: "gmail.triage",
        message: `Classified "${event.data.subject}" as ${classification.priority}`,
        meta: { messageId: event.data.messageId, ...classification },
      },
    });

    return classification;
  },
);

/**
 * 2) AI log monitor — the "Inngest for monitoring logs using AI" requirement.
 *    Batches captured log events (every 30s or 25 events) and asks an LLM to
 *    surface anything operationally interesting (error spikes, urgent-email
 *    bursts) as a single human-readable digest instead of raw log noise.
 */
export const aiLogMonitor = inngest.createFunction(
  {
    id: "ai-log-monitor",
    // Batch logs so we summarize many at once instead of one LLM call per log.
    batchEvents: { maxSize: 25, timeout: "30s" },
    triggers: [{ event: "app/log.captured" }],
  },
  async ({ events, step }) => {
    const lines = events.map(
      (e) => `[${e.data.level}] ${e.data.source}: ${e.data.message}`,
    );

    const digest = await step.run("summarize-logs", () =>
      summarizeActivity([
        "Summarize these application logs into an ops digest. Flag errors and urgent-email spikes:",
        ...lines,
      ]),
    );

    // In production: post to Slack/email/alerting. Here we return it so it's
    // visible in the Inngest dev dashboard run output.
    return { batched: events.length, digest };
  },
);

export const functions = [classifyInboundEmail, aiLogMonitor];
