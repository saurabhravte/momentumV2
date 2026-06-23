import OpenAI from "openai";

/**
 * Lazily-instantiated OpenAI client (replaces V1's Anthropic/Claude usage).
 *
 * The SDK constructor throws when no API key is present, so creating the client
 * at module load crashed `next build` (page-data collection) and any runtime
 * import on deploys without a key — even though OPENAI_API_KEY is optional and
 * every function below already degrades gracefully when it's unset. We build it
 * on first use instead, caching the instance.
 *
 * Models are cheap-by-default: classification/extraction use gpt-4o-mini.
 */
let _openai: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  _openai ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

const CLASSIFY_MODEL = "gpt-4o-mini";

export type Priority = "urgent" | "reply" | "waiting" | "fyi";

export interface EmailClassification {
  priority: Priority;
  reason: string;
  needsAction: boolean;
}

/**
 * Cheap priority triage for the inbox. Sends only subject + a snippet so cost
 * stays tiny. Always returns a valid Priority even if the model misbehaves.
 */
export async function classifyEmail(input: {
  subject: string;
  from: string;
  snippet: string;
}): Promise<EmailClassification> {
  if (!process.env.OPENAI_API_KEY) {
    return { priority: "fyi", reason: "AI disabled (no API key)", needsAction: false };
  }

  const res = await getOpenAI().chat.completions.create({
    model: CLASSIFY_MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You triage a busy professional's inbox. Classify each email into exactly one priority: " +
          "'urgent' (time-sensitive, needs the user now), 'reply' (a person is waiting on a response), " +
          "'waiting' (user is blocked on someone else / FYI follow-up), or 'fyi' (newsletters, receipts, no action). " +
          'Respond as JSON: {"priority": "...", "reason": "<8 words max>", "needsAction": true|false}.',
      },
      {
        role: "user",
        content: `From: ${input.from}\nSubject: ${input.subject}\nPreview: ${input.snippet}`,
      },
    ],
  });

  try {
    const parsed = JSON.parse(res.choices[0]?.message.content ?? "{}") as Partial<EmailClassification>;
    const priority: Priority = ["urgent", "reply", "waiting", "fyi"].includes(parsed.priority as string)
      ? parsed.priority!
      : "fyi";
    return {
      priority,
      reason: parsed.reason ?? "",
      needsAction: parsed.needsAction ?? (priority === "urgent" || priority === "reply"),
    };
  } catch {
    return { priority: "fyi", reason: "Could not parse model output", needsAction: false };
  }
}

/** Plain-language "catch me up" digest from a batch of items. */
export async function summarizeActivity(items: string[]): Promise<string> {
  if (!process.env.OPENAI_API_KEY || items.length === 0) {
    return "Nothing new to catch up on.";
  }
  const res = await getOpenAI().chat.completions.create({
    model: CLASSIFY_MODEL,
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content:
          "You are a concise chief of staff. Summarize what happened while the user was away in 3-5 short bullet points, " +
          "leading with anything that needs them. Plain language, no preamble.",
      },
      { role: "user", content: items.join("\n") },
    ],
  });
  return res.choices[0]?.message.content ?? "";
}

export type CommandAction =
  | { action: "navigate"; to: "inbox" | "calendar" }
  | { action: "search"; query: string }
  | { action: "compose"; to?: string; subject?: string; body?: string }
  | { action: "schedule"; summary: string; attendees: string[]; when: string }
  | { action: "catch_up" }
  | { action: "unknown"; message: string };

/**
 * Parse a plain-language command into a structured, approval-ready action.
 * This is the brain behind the ⌘K bar. It NEVER executes — it only proposes,
 * matching V1's "agent proposes, you approve" model. Wiring these proposals to
 * the Corsair MCP for autonomous execution is the documented next step.
 */
export async function parseCommand(text: string): Promise<CommandAction> {
  if (!process.env.OPENAI_API_KEY) {
    return { action: "unknown", message: "AI is not configured." };
  }
  const res = await getOpenAI().chat.completions.create({
    model: CLASSIFY_MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Convert the user's request into ONE structured command as JSON. Allowed shapes:\n" +
          '{"action":"navigate","to":"inbox|calendar"}\n' +
          '{"action":"search","query":"..."}\n' +
          '{"action":"compose","to":"email","subject":"...","body":"..."}\n' +
          '{"action":"schedule","summary":"...","attendees":["email"],"when":"natural language time"}\n' +
          '{"action":"catch_up"}\n' +
          '{"action":"unknown","message":"why"}\n' +
          "Only output JSON. Infer missing fields where reasonable; leave unknown emails out.",
      },
      { role: "user", content: text },
    ],
  });
  try {
    return JSON.parse(res.choices[0]?.message.content ?? "{}") as CommandAction;
  } catch {
    return { action: "unknown", message: "Could not understand that." };
  }
}
