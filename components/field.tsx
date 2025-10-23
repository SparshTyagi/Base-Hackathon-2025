"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const fieldVariants = cva("space-y-2", {
  variants: {
    variant: {
      default: "",
      soft: cn(
        "rounded-xl p-3 transition-colors duration-300",
        "bg-[var(--color-accent-bg)]"
      ),
      minimal: "space-y-1",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface FieldProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof fieldVariants> {
  label: string;
  hint?: string;
}

export const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  ({ label, hint, variant, className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(fieldVariants({ variant, className }))} {...props}>
        <label
          className="block text-sm font-semibold transition-colors"
          style={{ color: "var(--color-text)" }}
        >
          {label}
        </label>
        {children}
        {hint && (
          <p
            className="text-xs transition-colors"
            style={{ color: "var(--color-muted-text)" }}
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);
Field.displayName = "Field";