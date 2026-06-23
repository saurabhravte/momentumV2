import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/12 text-primary",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-foreground",
        urgent: "border-transparent bg-[color-mix(in_oklch,var(--urgent)_15%,transparent)] text-urgent",
        reply: "border-transparent bg-[color-mix(in_oklch,var(--reply)_18%,transparent)] text-reply",
        waiting: "border-transparent bg-[color-mix(in_oklch,var(--waiting)_15%,transparent)] text-waiting",
        done: "border-transparent bg-[color-mix(in_oklch,var(--done)_15%,transparent)] text-done",
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
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
