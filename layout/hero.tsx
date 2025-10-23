"use client";
import { motion } from "framer-motion";
import { Pill } from "@/components/pill";
import { formatEth } from "@/lib/utils";
import PiggyBankSVG from "@/icons/piggybank";

export const Hero = ({
  piggyCount,
  totalPot,
}: {
  piggyCount: number;
  totalPot: number;
}) => (
  <section
    className="relative rounded-3xl shadow-xl border p-6 sm:p-8 md:p-10 w-full transition-colors duration-300"
    style={{
      backgroundColor: "var(--color-surface)",
      borderColor: "var(--color-border)",
      color: "var(--color-text)",
    }}
  >
    {/* Gradient overlay (now theme-aware) */}
    <div
      className="absolute inset-0 opacity-[.08] pointer-events-none"
      style={{
        background: `
          radial-gradient(1000px 400px at 10% 0%, var(--color-gradient-light) 0%, transparent 40%),
          radial-gradient(1000px 400px at 90% 0%, var(--color-gradient-accent) 0%, transparent 45%)
        `,
      }}
    />

    <div className="flex z-10 grid gap-6 md:grid-cols-2 items-center">
      <div className="space-y-4">
        <h1
          className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight transition-colors"
          style={{ color: "var(--color-text)" }}
        >
          Social accountability — with a friendly on-chain piggybank.
        </h1>
        <p
          className="max-w-xl text-sm sm:text-base transition-colors"
          style={{ color: "var(--color-muted-text)" }}
        >
          Create rule sets for your crew, stake a small amount, and let the pot
          grow every time someone slips. The most disciplined player wins the
          bank at the end.
        </p>
        <div className="flex flex-wrap gap-2 sm:gap-3 pt-2">
          <Pill>
            Active piggybanks:{" "}
            <strong className="ml-1">{piggyCount}</strong>
          </Pill>
          <Pill tone="success">
            Total at stake:{" "}
            <strong className="ml-1">{formatEth(totalPot)}</strong>
          </Pill>
        </div>
      </div>

      <div className="relative h-40 sm:h-56 md:h-64 justify-self-start">
        <motion.div
          className="absolute bottom-0"
          initial={{ y: 8 }}
          animate={{ y: [8, -6, 8] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        >
          <PiggyBankSVG className="w-40 sm:w-56 md:w-72 h-auto bg-transparent overflow-visible z-20" />
        </motion.div>
      </div>
    </div>
  </section>
);
