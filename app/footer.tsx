"use client";

import * as React from "react";
import { Pill } from "../components/pill";
import { cn } from "@/lib/utils";

export interface FooterProps {
  theme?: "base" | "pink" | "mint" | "dark";
}

export const Footer: React.FC<FooterProps> = ({ theme = "base" }) => {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "mt-16 border-t backdrop-blur transition-colors duration-300",
        // use CSS variables instead of hardcoded colors
        "bg-[var(--color-bg)] border-[var(--color-border)]"
      )}
      style={{
        color: "var(--color-text)",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm flex flex-wrap items-center justify-between gap-3">
        <div
          className="font-medium"
          style={{
            color: "var(--color-text)",
            opacity: 0.8,
          }}
        >
          © {year} Piggy Protocol • Built for Base Mini Apps
        </div>

        <div className="flex items-center gap-3">
          <Pill tone="info" variant="soft">
            Primary: #0052FF
          </Pill>
          <Pill tone="info" variant="soft">
            Accent: #FF89C2
          </Pill>
          <Pill tone="success" variant="soft">
            Success: #00C48C
          </Pill>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
