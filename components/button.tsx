"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Reusable Button component
 * Supports theme variants, sizes, and dark/light mode
 *
 * Variants: primary | secondary | outline | ghost | destructive
 * Sizes:    sm | md | lg
 */

const buttonVariants = cva(
  "inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[.98]",
  {
    variants: {
      variant: {
        primary: cn(
          "text-white shadow-md",
          "bg-gradient-to-r from-[var(--color-gradient-light)] via-[#7AA5FF] to-[var(--color-gradient-accent)]",
          "hover:shadow-xl hover:-translate-y-[2px] hover:brightness-110"
        ),
        secondary: cn(
          "border shadow-sm",
          "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)]",
          "hover:-translate-y-[1px] hover:shadow-md hover:brightness-95"
        ),
        outline: cn(
          "border-2 bg-transparent",
          "border-[var(--color-border)] text-[var(--color-text)]",
          "hover:bg-[var(--color-accent-bg)] hover:-translate-y-[1px] hover:shadow-sm"
        ),
        ghost: cn(
          "bg-transparent text-[var(--color-text)]",
          "hover:bg-[var(--color-accent-bg)] hover:-translate-y-[1px]"
        ),
        destructive: cn(
          "bg-[#FF5A5A] text-white shadow-md",
          "hover:bg-[#E54848] hover:shadow-lg hover:-translate-y-[2px]",
          "dark:bg-[#DC2626] dark:hover:bg-[#B91C1C]"
        ),
      },
      size: {
        sm: "px-3 py-1.5 text-sm rounded-xl",
        md: "px-5 py-3 text-base",
        lg: "px-6 py-3.5 text-lg rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";