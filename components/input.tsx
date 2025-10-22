"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "w-full rounded-xl border px-4 py-3 shadow-sm transition-all duration-200 focus:outline-none focus:ring-4",
  {
    variants: {
      variant: {
        default: cn(
          "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-muted-text)]",
          "focus:ring-[var(--color-accent-bg)] focus:border-[var(--color-gradient-light)]"
        ),
        soft: cn(
          "border-transparent bg-[var(--color-accent-bg)] text-[var(--color-text)] placeholder-[var(--color-muted-text)]",
          "focus:ring-[var(--color-accent-bg)]"
        ),
        underline: cn(
          "rounded-none border-0 border-b-2 bg-transparent",
          "border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-muted-text)]",
          "focus:ring-0 focus:border-[var(--color-gradient-light)]"
        ),
        glass: cn(
          "bg-[var(--color-surface)]/40 backdrop-blur-md border border-[var(--color-border)]/50 shadow-inner",
          "text-[var(--color-text)] placeholder-[var(--color-muted-text)]",
          "focus:ring-[var(--color-accent-bg)]"
        ),
      },
      size: {
        sm: "px-3 py-2 text-sm",
        md: "px-4 py-3 text-base",
        lg: "px-5 py-4 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(inputVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Input.displayName = "Input";