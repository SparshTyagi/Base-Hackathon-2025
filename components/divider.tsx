"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Divider component
 * -------------------------------------------------
 * Flexible visual separator with theme support
 */

const dividerVariants = cva("", {
  variants: {
    orientation: {
      horizontal: "w-full",
      vertical: "h-full",
    },
    size: {
      sm: "h-px",
      md: "h-[2px]",
      lg: "h-[3px]",
    },
    variant: {
      solid: "bg-[var(--color-border)]",
      dashed: "border-t border-dashed border-[var(--color-border)]",
      soft: "bg-[var(--color-border)]/50",
      gradient:
        "bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
    variant: "gradient",
    size: "md",
  },
});

export interface DividerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dividerVariants> {}

export const Divider: React.FC<DividerProps> = ({
  orientation,
  variant,
  size,
  className,
  ...props
}) => {
  const baseClass =
    variant === "dashed"
      ? orientation === "horizontal"
        ? "border-t"
        : "border-l"
      : "";

  return (
    <div
      role="separator"
      className={cn(
        orientation === "horizontal"
          ? "my-6"
          : "mx-4 w-px h-auto self-stretch",
        dividerVariants({ orientation, variant, size }),
        baseClass,
        className
      )}
      {...props}
    />
  );
};