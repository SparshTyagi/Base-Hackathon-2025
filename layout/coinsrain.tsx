"use client";
import { motion } from "framer-motion";
import React from "react";

const CoinSVG: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} aria-hidden>
    <circle cx="50" cy="50" r="40" fill="#FFDA4A" stroke="#F0B90B" strokeWidth="4" />
    <circle cx="50" cy="50" r="30" fill="none" stroke="#F0B90B" strokeWidth="3" />
  </svg>
);

export const CoinsRain = ({ count = 12, triggerKey }: { count?: number; triggerKey: number }) => {
  const coins = React.useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.3,
        scale: 0.6 + Math.random() * 0.7,
        duration: 0.8 + Math.random() * 0.6,
      })),
    [triggerKey, count]
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {coins.map((c) => (
        <motion.div
          key={`${triggerKey}-${c.id}`}
          initial={{ y: -40, opacity: 0, x: `${c.x}%`, scale: c.scale }}
          animate={{ y: [ -40, 20, 140, 220 ], opacity: [0, 1, 1, 0] }}
          transition={{ duration: c.duration, delay: c.delay, ease: "easeOut" }}
          className="absolute"
        >
          <CoinSVG className="w-5 h-5 sm:w-6 sm:h-6" />
        </motion.div>
      ))}
    </div>
  );
};
