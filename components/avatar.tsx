"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Avatar component
 * --------------------------------------------
 * Lightweight initials-based avatar with hue-based color
 * and optional online/busy status border color.
 */

export interface AvatarProps {
  name: string;
  hue?: number;
  size?: number;
  status?: "online" | "busy" | "offline"; // optional visual state
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  hue = 205,
  size = 40,
  status = "offline",
  className,
}) => {
  const initials = React.useMemo(
    () =>
      name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase(),
    [name]
  );

  const borderColor =
    status === "online"
      ? "#22C55E" // green
      : status === "busy"
      ? "#EF4444" // red
      : "#FFFFFF"; // default

  return (
    <div
      aria-label={`${name} avatar`}
      style={{
        width: size,
        height: size,
        background: `hsl(${hue}, 90%, 90%)`,
        color: `hsl(${hue}, 40%, 25%)`,
        borderColor,
      }}
      className={cn(
        "flex items-center justify-center rounded-full font-semibold border shadow-sm select-none",
        className
      )}
    >
      {initials}
    </div>
  );
};
