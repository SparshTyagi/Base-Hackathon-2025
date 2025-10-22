"use client";
import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Piggybank, Member, Infraction } from "@/lib/types";
import { formatEth, uid } from "@/lib/utils";
import { Pill } from "@/components/pill";
import { Divider } from "@/components/divider";
import { Button } from "@/components/button";
import { Avatar } from "@/components/avatar";
import PiggyBankSVG from "@/icons/piggybank";
import { CoinsRain } from "./coinsrain";
import { InfractionModal } from "./infractionmodal";

interface PiggyDetailProps {
  piggy: Piggybank;
  onBack: () => void;
  onUpdate: (p: Piggybank) => void;
}

export const PiggyDetail: React.FC<PiggyDetailProps> = ({
  piggy,
  onBack,
  onUpdate,
}) => {
  const [local, setLocal] = useState<Piggybank>(piggy);
  const [rainKey, setRainKey] = useState(0);
  const [openInfraction, setOpenInfraction] = useState(false);

  useEffect(() => setLocal(piggy), [piggy.id]);

  const leader = useMemo(
    () => [...local.members].sort((a, b) => a.breaks - b.breaks)[0],
    [local]
  );

  const recordInfraction = (memberId: string, ruleId: string, notes?: string) => {
    const rule = local.rules.find((r) => r.id === ruleId);
    const member = local.members.find((m) => m.id === memberId);
    if (!rule || !member) return;

    const inf: Infraction = {
      id: uid(),
      memberId,
      ruleId,
      notes,
      timestamp: Date.now(),
      penaltyEth: rule.penaltyEth,
    };

    const updated: Piggybank = {
      ...local,
      potEth: local.potEth + rule.penaltyEth,
      infractions: [inf, ...local.infractions],
      members: local.members.map((m) =>
        m.id === memberId ? { ...m, breaks: m.breaks + 1 } : m
      ),
    };
    setLocal(updated);
    onUpdate(updated);
    setRainKey((x) => x + 1);
  };

  const settleAndPickWinner = () => {
    const sorted = [...local.members].sort((a, b) => a.breaks - b.breaks);
    const winner = sorted[0];
    alert(`${winner.name} wins ${formatEth(local.potEth)}! (Simulated on-chain settle)`);
  };

  const DisciplineScore: React.FC<{ m: Member }> = ({ m }) => {
    const maxBreaks = Math.max(1, ...local.members.map((x) => x.breaks));
    const pct = 100 - Math.round((m.breaks / maxBreaks) * 100);
    return (
      <div
        className="text-xs transition-colors"
        style={{ color: "var(--color-muted-text)" }}
      >
        discipline:{" "}
        <span
          className="font-semibold"
          style={{ color: "var(--color-text)" }}
        >
          {pct}
        </span>
      </div>
    );
  };

  return (
    <div className="relative transition-colors duration-300" style={{ color: "var(--color-text)" }}>
      <CoinsRain count={16} triggerKey={rainKey} />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-sm sm:text-base hover:underline"
            style={{ color: "var(--color-gradient-light)" }}
          >
            ← Back
          </button>
          <h2
            className="text-xl sm:text-2xl font-bold transition-colors"
            style={{ color: "var(--color-text)" }}
          >
            {local.name}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Pill tone="success">Pot {formatEth(local.potEth)}</Pill>
          <Button variant="primary" onClick={() => setOpenInfraction(true)}>
            Record infraction
          </Button>
          <Button variant="secondary" onClick={settleAndPickWinner}>
            End & pick winner
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Leaderboard + Infractions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Leaderboard */}
          <div
            className="rounded-3xl shadow-sm border p-6 transition-colors duration-300"
            style={{
              backgroundColor: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                Leaderboard
              </h3>
              <Pill tone="neutral">
                Leader: <b className="ml-1">{leader?.name}</b>
              </Pill>
            </div>
            <Divider />
            <div className="space-y-3">
              {[...local.members]
                .sort((a, b) => a.breaks - b.breaks || a.name.localeCompare(b.name))
                .map((m, idx) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 p-3 rounded-2xl border transition-colors duration-300"
                    style={{
                      backgroundColor: "var(--color-bg)",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    <div
                      className="w-6 text-center font-bold"
                      style={{ color: "var(--color-muted-text)" }}
                    >
                      {idx + 1}
                    </div>
                    <Avatar name={m.name} hue={m.avatarHue} />
                    <div className="min-w-0">
                      <div
                        className="font-semibold truncate"
                        style={{ color: "var(--color-text)" }}
                      >
                        {m.name}
                      </div>
                      <DisciplineScore m={m} />
                    </div>
                    <div className="ml-auto text-right">
                      <div
                        className="text-xs"
                        style={{ color: "var(--color-muted-text)" }}
                      >
                        breaks
                      </div>
                      <div
                        className="font-semibold"
                        style={{ color: "var(--color-text)" }}
                      >
                        {m.breaks}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Infractions */}
          <div
            className="rounded-3xl shadow-sm border p-6 transition-colors duration-300"
            style={{
              backgroundColor: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              Infractions
            </h3>
            <Divider />
            {local.infractions.length === 0 ? (
              <div style={{ color: "var(--color-muted-text)" }}>
                No infractions yet. Keep it clean! ✨
              </div>
            ) : (
              <div className="space-y-3">
                {local.infractions.map((i) => {
                  const member = local.members.find((m) => m.id === i.memberId)!;
                  const rule = local.rules.find((r) => r.id === i.ruleId)!;
                  return (
                    <div
                      key={i.id}
                      className="flex items-center gap-3 p-3 rounded-2xl border transition-colors duration-300"
                      style={{
                        backgroundColor: "var(--color-bg)",
                        borderColor: "var(--color-border)",
                      }}
                    >
                      <Avatar name={member.name} hue={member.avatarHue} />
                      <div className="min-w-0">
                        <div className="text-sm">
                          <b>{member.name}</b> broke <b>{rule.label}</b>
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: "var(--color-muted-text)" }}
                        >
                          {new Date(i.timestamp).toLocaleString()} • {i.notes || "—"}
                        </div>
                      </div>
                      <Pill tone="error" className="ml-auto">
                        +{formatEth(i.penaltyEth)}
                      </Pill>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Rules */}
          <div
            className="rounded-3xl shadow-sm border p-6 transition-colors duration-300"
            style={{
              backgroundColor: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              Rules
            </h3>
            <Divider />
            <div className="space-y-3">
              {local.rules.map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-2xl border transition-colors duration-300"
                  style={{
                    backgroundColor: "var(--color-bg)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  <div className="font-semibold" style={{ color: "var(--color-text)" }}>
                    {r.label}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "var(--color-muted-text)" }}
                  >
                    {r.type === "WORD_BAN" && (
                      <>Banned: {r.config.bannedWords?.join(", ") || "(none)"} </>
                    )}
                    {r.type === "POST_QUOTA" && (
                      <>Min posts/week: {r.config.minPostsPerWeek}</>
                    )}
                    {r.type === "CUSTOM" && <>{r.config.description}</>}
                  </div>
                  <div className="text-xs mt-1">
                    <b>Penalty:</b> {formatEth(r.penaltyEth)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pot */}
          <div
            className="rounded-3xl shadow-sm border p-6 transition-colors duration-300"
            style={{
              backgroundColor: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              Pot
            </h3>
            <Divider />
            <div className="flex items-center gap-3">
              <PiggyBankSVG className="w-12 h-12 sm:w-14 sm:h-14" />
              <div>
                <div
                  className="text-xs"
                  style={{ color: "var(--color-muted-text)" }}
                >
                  Total
                </div>
                <div
                  className="text-xl sm:text-2xl font-extrabold"
                  style={{ color: "var(--color-text)" }}
                >
                  {formatEth(local.potEth)}
                </div>
              </div>
            </div>
            <p
              className="text-xs mt-2"
              style={{ color: "var(--color-muted-text)" }}
            >
              *On-chain deposits update this pot in real time.
            </p>
          </div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {openInfraction && (
          <InfractionModal
            piggy={local}
            onClose={() => setOpenInfraction(false)}
            onSubmit={(m, r, n) => {
              recordInfraction(m, r, n);
              setOpenInfraction(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
