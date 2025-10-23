"use client";
import React from "react";
import { Hero } from "./hero";
import { PiggyCard } from "./piggycard";
import { Button } from "@/components/button";
import { Piggybank } from "@/lib/types";
import { formatEth } from "@/lib/utils";

interface DashboardProps {
  piggies: Piggybank[];
  onCreate: () => void;
  onOpen: (p: Piggybank) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  piggies,
  onCreate,
  onOpen,
}) => {
  const totalPot = piggies.reduce((sum, p) => sum + p.potEth, 0);

  return (
    <section
      className="space-y-8 transition-colors duration-300"
      style={{
        color: "var(--color-text)",
      }}
    >
      <Hero piggyCount={piggies.length} totalPot={totalPot} />

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
        {piggies.map((p) => (
          <PiggyCard key={p.id} piggy={p} onOpen={() => onOpen(p)} />
        ))}

        <Button
          onClick={onCreate}
          className="rounded-2xl p-5 border-dashed border-2 text-left hover:shadow-md transition w-full"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border)",
            color: "var(--color-text)",
          }}
        >
          <div
            className="text-sm"
            style={{ color: "var(--color-muted-text)" }}
          >
            Start a new one
          </div>
          <div className="font-bold text-lg" style={{ color: "var(--color-text)" }}>
            Create a Piggybank
          </div>
          <p
            className="mt-2 text-sm"
            style={{ color: "var(--color-muted-text)" }}
          >
            Define rules, invite friends, stake, and compete.
          </p>
        </Button>
      </div>
    </section>
  );
};
