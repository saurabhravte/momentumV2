"use client";

import { useEffect, useState } from "react";

const SOURCE_VARS = {
  gmail: "--source-gmail",
  calendar: "--source-calendar",
  slack: "--source-slack",
  github: "--source-github",
} as const;

type SourceKey = keyof typeof SOURCE_VARS;
type Colors = Record<SourceKey, string>;

/**
 * Reads the live computed value of each per-source CSS variable and re-reads
 * whenever the theme class on <html> flips (next-themes). Returns null until
 * the first read so charts can guard before painting.
 */
export function useSourceColors(
  scopeRef: React.RefObject<HTMLElement | null>,
): Colors | null {
  const [colors, setColors] = useState<Colors | null>(null);

  useEffect(() => {
    const read = () => {
      const el = scopeRef.current ?? document.documentElement;
      const cs = getComputedStyle(el);
      const next = {} as Colors;
      (Object.keys(SOURCE_VARS) as SourceKey[]).forEach((key) => {
        next[key] =
          cs.getPropertyValue(SOURCE_VARS[key]).trim() || "currentColor";
      });
      setColors(next);
    };
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, [scopeRef]);

  return colors;
}
