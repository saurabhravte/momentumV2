import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 font-bold tracking-[-0.02em]",
        className,
      )}
    >
      <span className="bg-brand grid size-7 place-items-center rounded-[9px] text-white shadow-[0_6px_18px_-6px_color-mix(in_oklch,var(--primary)_80%,transparent),inset_0_1px_0_rgba(255,255,255,0.3)]">
        <svg viewBox="0 0 24 24" className="size-4" fill="none">
          <path
            d="M4 18V8l5 5 3-3 3 3 5-5v10"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span>Momentum</span>
    </span>
  );
}
