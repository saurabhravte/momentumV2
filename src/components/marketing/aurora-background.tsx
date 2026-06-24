"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * AuroraBackground — the landing page's signature ambient layer.
 *
 * Three slow-drifting light blobs (teal -> azure -> emerald; deliberately NO
 * purple) sit behind a faint, radially-masked grid. It evokes streams of
 * activity drifting into one calm place — the product's whole pitch.
 *
 * - Absolutely positioned + pointer-events:none, so it never intercepts clicks.
 * - Honours prefers-reduced-motion: when reduced, the blobs render static.
 * - Pure CSS gradients + Framer Motion transforms — no canvas, no extra deps.
 *
 * Drop it as the first child of a `relative` hero container, with the hero's
 * real content layered above at `z-10`.
 */
export function AuroraBackground({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();

  const float = (x: number[], y: number[], s: number[], dur: number) =>
    reduce
      ? {}
      : {
          animate: { x, y, scale: s },
          transition: {
            duration: dur,
            repeat: Infinity,
            repeatType: "mirror" as const,
            ease: "easeInOut" as const,
          },
        };

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <motion.span
        className="absolute -top-40 -left-32 size-[34rem] rounded-full opacity-55 blur-[70px] dark:opacity-40"
        style={{
          background:
            "radial-gradient(circle, var(--primary), transparent 68%)",
        }}
        {...float([0, 80], [0, 60], [1, 1.12], 26)}
      />
      <motion.span
        className="absolute -top-32 -right-40 size-[38rem] rounded-full opacity-55 blur-[70px] dark:opacity-40"
        style={{
          background: "radial-gradient(circle, var(--azure), transparent 68%)",
        }}
        {...float([0, -70], [0, 50], [1, 1.08], 30)}
      />
      <motion.span
        className="absolute top-28 left-[38%] size-[30rem] rounded-full opacity-40 blur-[70px] dark:opacity-30"
        style={{
          background: "radial-gradient(circle, var(--done), transparent 70%)",
        }}
        {...float([0, -50], [0, -40], [1, 1.15], 34)}
      />

      {/* radially-masked grid */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "46px 46px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 30%, #000 30%, transparent 72%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 30%, #000 30%, transparent 72%)",
        }}
      />
    </div>
  );
}
