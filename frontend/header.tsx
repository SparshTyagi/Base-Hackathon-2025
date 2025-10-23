"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Button } from "../components/button";
import { cn } from "@/lib/utils";
import PiggyBankSVG from "../icons/piggybank";
import { Moon, Sun } from "lucide-react";

export interface HeaderProps {
  onHome?: () => void;
  onCreate?: () => void;
  onConnect?: () => void;
  connected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onHome,
  onCreate,
  onConnect,
  connected = false,
}) => {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Load saved theme or system preference
  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = saved || (prefersDark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", initial);
    setTheme(initial);
  }, []);

  // Toggle handler
  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-300",
        theme === "dark"
          ? "bg-[var(--color-header-bg)] border-[var(--color-border)]"
          : "bg-[var(--color-header-bg)] border-[var(--color-border)]"
      )}
    >
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={onHome}
          className="flex items-center gap-3 group focus:outline-none"
        >
          <div className="relative">
            <PiggyBankSVG
              className={cn(
                "w-8 h-8 transition-transform group-hover:rotate-6",
                // ADD: ensure no background
                "bg-transparent",
                theme === "dark" ? "text-[#FF89C2]" : "text-[#0052FF]"
              )}
            />
            <div
              className={cn(
                "absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition",
                theme === "dark"
                  ? "shadow-[0_0_0_6px_rgba(255,137,194,0.15)]"
                  : "shadow-[0_0_0_6px_rgba(0,82,255,0.15)]"
              )}
            />
          </div>
          <div className="text-left">
            <div className="text-sm tracking-wide text-[var(--color-text)/70]">
              Mini App on Base
            </div>
            <div className="font-extrabold text-lg text-[var(--color-text)]">
              Piggyfi
            </div>
          </div>
        </button>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* <Button variant="secondary" onClick={onCreate}>
            Create Piggybank
          </Button> */}
          <Button variant="primary" onClick={onConnect}>
            {connected ? "Wallet Connected" : "Connect Wallet"}
          </Button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl transition border border-transparent hover:border-[var(--color-border)]"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-[var(--color-text)]" />
            ) : (
              <Moon className="w-5 h-5 text-[var(--color-text)]" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
