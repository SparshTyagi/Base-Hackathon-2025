"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const selectVariants = cva(
  "w-full rounded-xl border px-4 py-3 shadow-sm transition-all duration-200 focus:outline-none focus:ring-4",
  {
    variants: {
      variant: {
        default: cn(
          "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)]",
          "focus:ring-[var(--color-accent-bg)] focus:border-[var(--color-gradient-light)]"
        ),
        soft: cn(
          "border-transparent bg-[var(--color-accent-bg)] text-[var(--color-text)]",
          "focus:ring-[var(--color-accent-bg)]"
        ),
        glass: cn(
          "bg-[var(--color-surface)]/40 backdrop-blur-md border border-[var(--color-border)]/50 shadow-inner",
          "text-[var(--color-text)]",
          "focus:ring-[var(--color-accent-bg)]"
        ),
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement>,
    VariantProps<typeof selectVariants> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, variant, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(selectVariants({ variant, className }))}
      {...props}
    />
  )
);
Select.displayName = "Select";