import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 font-semibold", className)}>
      <span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/30">
        <svg viewBox="0 0 24 24" className="size-4" fill="none">
          <path
            d="M4 18V8l5 5 3-3 3 3 5-5v10"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="tracking-tight">Momentum</span>
    </span>
  );
}
