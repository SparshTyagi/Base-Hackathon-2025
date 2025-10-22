"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Pill (Badge/Tag) component
 * --------------------------
 * Supports multiple variants and tones for a unified design system.
 */

const pillVariants = cva(
  "inline-flex items-center gap-2 rounded-full border font-medium transition-colors select-none",
  {
    variants: {
      variant: {
        solid: "text-white shadow-sm",
        soft: "bg-opacity-20 border-transparent",
        outline: "bg-transparent border border-[var(--color-border)]",
        glass: cn(
          "backdrop-blur-md border shadow-inner",
          "bg-[var(--color-surface)]/30 border-[var(--color-border)]/40 text-[var(--color-text)]"
        ),
      },
      tone: {
        success: "bg-[#00C48C] border-[#00C48C] text-white dark:bg-[#00A876] dark:border-[#00A876]",
        error: "bg-[#FF5A5A] border-[#FF5A5A] text-white dark:bg-[#DC2626] dark:border-[#DC2626]",
        warning: "bg-[#FACC15] border-[#FACC15] text-[#1E293B] dark:bg-[#EAB308] dark:border-[#EAB308]",
        info: "bg-[#3B82F6] border-[#3B82F6] text-white dark:bg-[#2563EB] dark:border-[#2563EB]",
        neutral: cn(
          "bg-[var(--color-accent-bg)] border-[var(--color-border)] text-[var(--color-text)]"
        ),
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-3 py-1 text-sm",
        lg: "px-4 py-1.5 text-base",
      },
    },
    compoundVariants: [
      {
        variant: "soft",
        tone: "success",
        className: "bg-[#00C48C]/10 text-[#006C4E] dark:bg-[#00C48C]/20 dark:text-[#00E5A0]",
      },
      {
        variant: "soft",
        tone: "error",
        className: "bg-[#FF5A5A]/10 text-[#8F1D1D] dark:bg-[#FF5A5A]/20 dark:text-[#FCA5A5]",
      },
      {
        variant: "soft",
        tone: "neutral",
        className: "bg-[var(--color-accent-bg)] text-[var(--color-text)]",
      },
    ],
    defaultVariants: {
      variant: "soft",
      tone: "neutral",
      size: "md",
    },
  }
);

export interface PillProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof pillVariants> {
  icon?: React.ReactNode;
}

export const Pill = React.forwardRef<HTMLSpanElement, PillProps>(
  ({ className, variant, tone, size, icon, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(pillVariants({ variant, tone, size, className }))}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  )
);
Pill.displayName = "Pill";