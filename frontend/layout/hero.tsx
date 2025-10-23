import React from 'react';
import { motion } from 'framer-motion';
import { formatEth } from '@/lib/utils';

interface HeroProps {
  piggyCount: number;
  totalPot: number;
}

export function Hero({ piggyCount, totalPot }: HeroProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl p-8 md:p-10 bg-white shadow-xl border border-[#E2E8F0]">
      <div className="absolute -inset-1 rounded-3xl opacity-[.08] pointer-events-none"
           style={{ background: "radial-gradient(1200px 400px at 10% 0%, #0052FF 0%, transparent 40%), radial-gradient(1200px 400px at 90% 0%, #FF89C2 0%, transparent 45%)" }} />

      <div className="grid md:grid-cols-2 gap-8 items-center relative z-10">
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#0F172A] leading-tight">
            Social accountability — with a friendly onchain piggybank.
          </h1>
          <p className="text-[#475569] max-w-xl">
            Create rule sets for your crew, stake a small amount, and let the pot grow every time someone slips.
            The most disciplined player wins the bank at the end.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm border bg-[#EEF2FF] text-[#1E293B] border-[#C7D2FE]">
              Active piggybanks: <strong className="ml-1">{piggyCount}</strong>
            </span>
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm border bg-[#E8FFF6] text-[#006C4E] border-[#B9F4DE]">
              Total at stake: <strong className="ml-1">{formatEth(totalPot)}</strong>
            </span>
          </div>
        </div>
        <div className="relative h-48 md:h-64">
          <motion.div
            className="absolute right-4 md:right-10 bottom-0"
            initial={{ y: 10 }}
            animate={{ y: [10, -6, 10] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          >
            <div className="w-56 h-56 md:w-72 md:h-72 bg-gradient-to-br from-pink-200 to-pink-400 rounded-full flex items-center justify-center text-6xl">
              🐷
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
