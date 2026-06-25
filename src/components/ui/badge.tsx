import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        // gradient-tinted brand pill
        default:
          "border-[color-mix(in_oklch,var(--primary)_28%,transparent)] bg-[linear-gradient(135deg,color-mix(in_oklch,var(--primary)_18%,transparent),color-mix(in_oklch,var(--fuchsia)_16%,transparent))] text-primary",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-foreground",
        urgent:
          "border-transparent bg-[color-mix(in_oklch,var(--urgent)_16%,transparent)] text-urgent",
        reply:
          "border-transparent bg-[color-mix(in_oklch,var(--reply)_18%,transparent)] text-reply",
        waiting:
          "border-transparent bg-[color-mix(in_oklch,var(--waiting)_16%,transparent)] text-waiting",
        done: "border-transparent bg-[color-mix(in_oklch,var(--done)_16%,transparent)] text-done",
        fyi: "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
