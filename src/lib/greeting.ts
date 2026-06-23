/**
 * Time-of-day greeting used on the dashboard. Cycles morning → afternoon →
 * evening → night with an encouraging sub-line, so the workspace feels alive
 * whenever the user logs in. `style` comes from user preferences: "auto"
 * follows the clock, the others pin a fixed tone.
 */
export type GreetingStyle = "auto" | "morning" | "neutral";

export function getGreeting(
  name: string,
  style: GreetingStyle = "auto",
  now: Date = new Date(),
): { headline: string; sub: string } {
  const first = name.split(" ")[0] ?? name;
  const hour = now.getHours();

  if (style === "neutral") {
    return { headline: `Welcome back, ${first}`, sub: ENCOURAGE_NEUTRAL };
  }

  const slot =
    style === "morning"
      ? "morning"
      : hour < 5
        ? "night"
        : hour < 12
          ? "morning"
          : hour < 17
            ? "afternoon"
            : hour < 22
              ? "evening"
              : "night";

  const map = {
    morning: {
      headline: `Good morning, ${first}`,
      sub: pick(SUB_MORNING),
    },
    afternoon: {
      headline: `Good afternoon, ${first}`,
      sub: pick(SUB_AFTERNOON),
    },
    evening: {
      headline: `Good evening, ${first}`,
      sub: pick(SUB_EVENING),
    },
    night: {
      headline: `Burning the midnight oil, ${first}?`,
      sub: pick(SUB_NIGHT),
    },
  } as const;

  return map[slot];
}

const ENCOURAGE_NEUTRAL = "Here's where everything stands today.";

const SUB_MORNING = [
  "Fresh start — let's clear the decks before noon.",
  "A calm inbox is a productive inbox. Let's get after it.",
  "Big day ahead. One thread at a time.",
];
const SUB_AFTERNOON = [
  "Strong finish from here — knock out the important ones.",
  "Halfway there. Keep the momentum going.",
  "Good pace today. Let's keep it tidy.",
];
const SUB_EVENING = [
  "Wrap up the loose ends and call it a win.",
  "Almost there — a few replies and you're clear.",
  "Nice work today. Let's land the plane.",
];
const SUB_NIGHT = [
  "Don't overdo it — handle the urgent, rest the rest.",
  "Quick sweep, then get some sleep.",
  "Late session — let's make it count and sign off.",
];

// Stable per-render pick (avoids hydration mismatch by being deterministic on
// the date's minute bucket rather than Math.random()).
function pick(arr: readonly string[]): string {
  const idx = Math.floor(Date.now() / 60000) % arr.length;
  return arr[idx]!;
}
