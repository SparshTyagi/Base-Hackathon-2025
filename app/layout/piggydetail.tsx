import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { uid, formatEth } from '@/lib/utils';
import { Button } from '@/components/button';
import { Field } from '@/components/field';
import { Select } from '@/components/select';
import { TextArea } from '@/components/textarea';
import { Pill } from '@/components/pill';
import { Divider } from '@/components/divider';
import { Avatar } from '@/components/avatar';
import { Piggybank, Member, Infraction } from '@/lib/types';

interface PiggyDetailProps {
  piggy: Piggybank;
  onBack: () => void;
  onUpdate: (p: Piggybank) => void;
}

export function PiggyDetail({ piggy, onBack, onUpdate }: PiggyDetailProps) {
  const [local, setLocal] = useState<Piggybank>(piggy);
  const [openInfraction, setOpenInfraction] = useState(false);

  useEffect(() => setLocal(piggy), [piggy.id]);

  const leader = useMemo(() => [...local.members].sort((a,b) => a.breaks - b.breaks)[0], [local]);

  const recordInfraction = (memberId: string, ruleId: string, notes?: string) => {
    const rule = local.rules.find(r => r.id === ruleId);
    const member = local.members.find(m => m.id === memberId);
    if (!rule || !member) return;

    const penaltyEth = rule.penaltyEth;
    const inf: Infraction = { id: uid(), memberId, ruleId, notes, timestamp: Date.now(), penaltyEth };

    const updated: Piggybank = {
      ...local,
      potEth: local.potEth + penaltyEth,
      infractions: [inf, ...local.infractions],
      members: local.members.map(m => m.id === memberId ? { ...m, breaks: m.breaks + 1 } : m),
    };
    setLocal(updated);
    onUpdate(updated);
  };

  const settleAndPickWinner = () => {
    const sorted = [...local.members].sort((a,b) => a.breaks - b.breaks);
    const winner = sorted[0];
    alert(`${winner.name} wins ${formatEth(local.potEth)}! (Simulated)\n\nNext: trigger onchain transfer to winner.`);
  };

  const DisciplineScore: React.FC<{ m: Member }> = ({ m }) => {
    const maxBreaks = Math.max(1, ...local.members.map(x => x.breaks));
    const pct = 100 - Math.round((m.breaks / maxBreaks) * 100);
    return (
      <div className="text-xs text-[#64748B]">discipline score: <span className="font-semibold text-[#0F172A]">{pct}</span></div>
    );
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-[#0052FF] hover:underline">← Back</button>
          <h2 className="text-2xl font-bold text-[#0F172A]">{local.name}</h2>
        </div>
        <div className="flex items-center gap-3">
          <Pill tone="success">Pot {formatEth(local.potEth)}</Pill>
          <Button variant="primary" onClick={() => setOpenInfraction(true)}>Record infraction</Button>
          <Button variant="secondary" onClick={settleAndPickWinner}>End & pick winner</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Members & Leaderboard */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl bg-white border border-[#E2E8F0] shadow-sm p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#0F172A]">Leaderboard</h3>
              <Pill tone="neutral">Leader: <b className="ml-1">{leader?.name}</b></Pill>
            </div>
            <Divider />
            <div className="space-y-3">
              {[...local.members]
                .sort((a,b) => a.breaks - b.breaks || a.name.localeCompare(b.name))
                .map((m, idx) => (
                  <div key={m.id} className="flex items-center gap-4 p-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC]">
                    <div className="w-6 text-center font-bold text-[#94A3B8]">{idx+1}</div>
                    <Avatar name={m.name} hue={m.avatarHue} />
                    <div className="min-w-0">
                      <div className="font-semibold text-[#0F172A] truncate">{m.name}</div>
                      <DisciplineScore m={m} />
                    </div>
                    <div className="ml-auto text-right">
                      <div className="text-sm text-[#64748B]">breaks</div>
                      <div className="font-semibold text-[#0F172A]">{m.breaks}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Infractions feed */}
          <div className="rounded-3xl bg-white border border-[#E2E8F0] shadow-sm p-6">
            <h3 className="text-lg font-semibold text-[#0F172A]">Infractions</h3>
            <Divider />
            {local.infractions.length === 0 ? (
              <div className="text-[#64748B]">No infractions yet. Keep it clean! ✨</div>
            ) : (
              <div className="space-y-3">
                {local.infractions.map(i => {
                  const member = local.members.find(m => m.id === i.memberId)!;
                  const rule = local.rules.find(r => r.id === i.ruleId)!;
                  return (
                    <div key={i.id} className="flex items-center gap-3 p-3 rounded-2xl border border-[#E2E8F0]">
                      <Avatar name={member.name} hue={member.avatarHue} />
                      <div className="min-w-0">
                        <div className="text-sm"><b>{member.name}</b> broke <b>{rule.label}</b></div>
                        <div className="text-xs text-[#64748B]">{new Date(i.timestamp).toLocaleString()} • {i.notes || "—"}</div>
                      </div>
                      <Pill tone="error" className="ml-auto">+{formatEth(i.penaltyEth)}</Pill>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Rules */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-3xl bg-white border border-[#E2E8F0] shadow-sm p-6">
            <h3 className="text-lg font-semibold text-[#0F172A]">Rules</h3>
            <Divider />
            <div className="space-y-3">
              {local.rules.map(r => (
                <div key={r.id} className="p-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC]">
                  <div className="font-semibold text-[#0F172A]">{r.label}</div>
                  <div className="text-xs text-[#64748B]">
                    {r.type === "WORD_BAN" && (
                      <>Banned: {r.config.bannedWords?.join(", ") || "(none)"}</>
                    )}
                    {r.type === "POST_QUOTA" && (
                      <>Min posts/week: {r.config.minPostsPerWeek}</>
                    )}
                    {r.type === "CUSTOM" && (
                      <>{r.config.description}</>
                    )}
                  </div>
                  <div className="text-xs mt-1"><b>Penalty:</b> {formatEth(r.penaltyEth)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-[#E2E8F0] shadow-sm p-6">
            <h3 className="text-lg font-semibold text-[#0F172A]">Pot</h3>
            <Divider />
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-200 to-pink-400 rounded-full flex items-center justify-center text-2xl">
                🐷
              </div>
              <div>
                <div className="text-sm text-[#64748B]">Total</div>
                <div className="text-2xl font-extrabold text-[#0F172A]">{formatEth(local.potEth)}</div>
              </div>
            </div>
            <p className="text-xs text-[#64748B] mt-2">*Onchain deposits will increment this pot, shown live.</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {openInfraction && (
          <InfractionModal
            piggy={local}
            onClose={() => setOpenInfraction(false)}
            onSubmit={(m, r, notes) => { recordInfraction(m, r, notes); setOpenInfraction(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const InfractionModal: React.FC<{
  piggy: Piggybank;
  onClose: () => void;
  onSubmit: (memberId: string, ruleId: string, notes?: string) => void;
}> = ({ piggy, onClose, onSubmit }) => {
  const [member, setMember] = useState(piggy.members[0]?.id || "");
  const [rule, setRule] = useState(piggy.rules[0]?.id || "");
  const [notes, setNotes] = useState("");

  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="relative w-full max-w-lg rounded-3xl bg-white border border-[#E2E8F0] shadow-xl p-6"
      >
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-lg text-[#0F172A]">Record Infraction</h4>
          <button onClick={onClose} className="text-[#64748B] hover:underline">Close</button>
        </div>
        <Divider />
        <div className="space-y-4">
          <Field label="Member">
            <Select value={member} onChange={e => setMember(e.target.value)}>
              {piggy.members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Rule">
            <Select value={rule} onChange={e => setRule(e.target.value)}>
              {piggy.rules.map(r => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Notes (optional)">
            <TextArea value={notes} onChange={e => setNotes(e.target.value)} placeholder="what happened?" />
          </Field>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={onClose} className="w-1/2">Cancel</Button>
            <Button variant="primary" onClick={() => onSubmit(member, rule, notes)} className="w-1/2">Record</Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
