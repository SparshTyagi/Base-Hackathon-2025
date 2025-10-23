"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const textareaVariants = cva(
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
    },
    defaultVariants: { variant: "default" },
  }
);

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, variant, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn("min-h-[96px]", textareaVariants({ variant, className }))}
      {...props}
    />
  )
);
TextArea.displayName = "TextArea";