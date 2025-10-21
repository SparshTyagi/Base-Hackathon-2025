"use client";

import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Piggybank Mini App (Base) — Visual-Perfect UI Starter
 * -----------------------------------------------------
 * This single-file React app focuses on VISUAL PERFECTION for a Base Mini App concept.
 * It includes a polished UI, animations, and a complete product flow using local state.
 *
 * You can paste this into a Next.js / React environment. For a Mini App on Base:
 *  - Replace mock wallet/connect with OnchainKit components
 *  - Add /.well-known/farcaster.json and <meta name="fc:miniapp" ...> (snippets below)
 *  - Wire onchain deposits/settlement to Base via OnchainKit + smart contract
 *
 * Design Language:
 *  - Colors: Base Blue (#0052FF), Piggy Pink (#FF89C2), Mint (#00C48C), Error (#FF5A5A)
 *  - Background: #F8FAFC, Text: #1E293B
 *  - Soft shadows, rounded-2xl, fluid spacing, subtle glass/neo effects
 *  - Framer Motion for microinteractions
 */

// -----------------------------
// Helpers & Mock Data Models
// -----------------------------

/** Member in a Piggybank */
type Member = {
  id: string;
  name: string;
  address?: string; // future: Base address / Farcaster fid link
  avatarHue?: number; // for generated avatar
  breaks: number; // number of broken rules
};

/** Rule types */
type RuleType = "WORD_BAN" | "POST_QUOTA" | "CUSTOM";

/** Rule */
type Rule = {
  id: string;
  label: string; // human-readable title
  type: RuleType;
  config: {
    bannedWords?: string[];
    minPostsPerWeek?: number;
    description?: string; // for CUSTOM
  };
  penaltyEth: number; // how much to add to the pot when broken
};

/** Infraction */
type Infraction = {
  id: string;
  memberId: string;
  ruleId: string;
  notes?: string;
  timestamp: number;
  penaltyEth: number;
};

/** Piggybank */
type Piggybank = {
  id: string;
  name: string;
  theme?: string; // e.g., "No Cursing November"
  createdAt: number;
  periodEndsAt?: number; // future: settlement schedule
  potEth: number;
  entryStakeEth: number;
  rules: Rule[];
  members: Member[];
  infractions: Infraction[];
  image?: string; // optional cover image URL
};

// Utility: uid
const uid = () => Math.random().toString(36).slice(2, 10);

// Utility: format ETH
const formatEth = (n: number) => `${n.toFixed(4)} ETH`;

// Utility: safe clamp
const clamp = (n: number, min = 0, max = 1_000_000) => Math.max(min, Math.min(max, n));

// Preseed a demo Piggybank for instant visuals
const seedPiggybank = (): Piggybank => {
  const m1: Member = { id: uid(), name: "Ava", avatarHue: 205, breaks: 1 };
  const m2: Member = { id: uid(), name: "Ben", avatarHue: 320, breaks: 2 };
  const m3: Member = { id: uid(), name: "Kai", avatarHue: 145, breaks: 0 };

  const r1: Rule = {
    id: uid(),
    label: "No Cursing",
    type: "WORD_BAN",
    config: { bannedWords: ["dang", "heck", "frick"] },
    penaltyEth: 0.002,
  };
  const r2: Rule = {
    id: uid(),
    label: "Daily Cast",
    type: "POST_QUOTA",
    config: { minPostsPerWeek: 7 },
    penaltyEth: 0.005,
  };
  const r3: Rule = {
    id: uid(),
    label: "Be Kind",
    type: "CUSTOM",
    config: { description: "No negative vibes in replies" },
    penaltyEth: 0.003,
  };

  return {
    id: uid(),
    name: "No-Curse November",
    theme: "Keep it wholesome, keep it fun",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    periodEndsAt: Date.now() + 1000 * 60 * 60 * 24 * 10,
    potEth: 0.032,
    entryStakeEth: 0.01,
    rules: [r1, r2, r3],
    members: [m1, m2, m3],
    infractions: [
      { id: uid(), memberId: m2.id, ruleId: r1.id, timestamp: Date.now()-86400000*2, penaltyEth: r1.penaltyEth, notes: "slip in group chat" },
      { id: uid(), memberId: m1.id, ruleId: r3.id, timestamp: Date.now()-86400000, penaltyEth: r3.penaltyEth, notes: "too spicy reply" },
      { id: uid(), memberId: m2.id, ruleId: r2.id, timestamp: Date.now()-3600000, penaltyEth: r2.penaltyEth, notes: "missed daily cast" },
    ],
    image: "", // optionally add a cover
  };
};

// -----------------------------
// Iconography (inline SVGs)
// -----------------------------

const PiggySVG: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 200 200" className={className} aria-hidden>
    <defs>
      <radialGradient id="piggyGrad" cx="50%" cy="40%" r="65%">
        <stop offset="0%" stopColor="#FFD4E8" />
        <stop offset="100%" stopColor="#FF89C2" />
      </radialGradient>
    </defs>
    <g>
      <ellipse cx="110" cy="120" rx="70" ry="50" fill="url(#piggyGrad)" />
      <circle cx="55" cy="120" r="18" fill="#FFABD6" />
      <ellipse cx="150" cy="95" rx="18" ry="14" fill="#FFC1DD" />
      <circle cx="155" cy="100" r="3" fill="#1E293B" />
      <path d="M40 118 q-12 8 0 16" stroke="#FF89C2" strokeWidth="6" fill="none" strokeLinecap="round"/>
      <rect x="95" y="78" width="30" height="8" rx="2" fill="#1E293B"/>
      <circle cx="90" cy="145" r="7" fill="#FF89C2" />
      <circle cx="130" cy="150" r="7" fill="#FF89C2" />
      <circle cx="160" cy="135" r="5" fill="#FF89C2" />
    </g>
  </svg>
);

const CoinSVG: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} aria-hidden>
    <circle cx="50" cy="50" r="40" fill="#FFDA4A" stroke="#F0B90B" strokeWidth="4" />
    <circle cx="50" cy="50" r="30" fill="none" stroke="#F0B90B" strokeWidth="3" />
  </svg>
);

// -----------------------------
// Reusable UI Elements
// -----------------------------

const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = "", children, ...props }) => (
  <button
    className={
      "group inline-flex items-center justify-center rounded-2xl px-5 py-3 text-white font-semibold shadow-lg " +
      "bg-[linear-gradient(135deg,#0052FF_0%,#7AA5FF_35%,#FF89C2_100%)] hover:opacity-95 active:scale-[.99] transition " +
      className
    }
    {...props}
  >
    {children}
  </button>
);

const SecondaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = "", children, ...props }) => (
  <button
    className={
      "inline-flex items-center justify-center rounded-2xl px-5 py-3 font-semibold border border-[#C7D2FE] text-[#1E293B] bg-white/70 backdrop-blur " +
      "hover:bg-white transition shadow-sm " +
      className
    }
    {...props}
  >
    {children}
  </button>
);

const Pill: React.FC<{ children: React.ReactNode; tone?: "success" | "error" | "neutral" } & React.HTMLAttributes<HTMLSpanElement>> = ({ children, tone = "neutral", className = "", ...props }) => {
  const palette = {
    success: "bg-[#E8FFF6] text-[#006C4E] border-[#B9F4DE]",
    error: "bg-[#FFF1F1] text-[#8F1D1D] border-[#F8CACA]",
    neutral: "bg-[#EEF2FF] text-[#1E293B] border-[#C7D2FE]",
  }[tone];
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm border ${palette} ${className}`} {...props}>
      {children}
    </span>
  );
};

const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>> = ({ label, hint, children, className = "", ...props }) => (
  <div className={`space-y-2 ${className}`} {...props}>
    <label className="block text-sm font-semibold text-[#0F172A]">{label}</label>
    {children}
    {hint && <p className="text-xs text-[#64748B]">{hint}</p>}
  </div>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = "", ...props }) => (
  <input
    className={
      "w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-[#0F172A] placeholder-[#94A3B8] shadow-sm focus:outline-none focus:ring-4 focus:ring-[#C7D2FE]"
      + " " + className
    }
    {...props}
  />
);

const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className = "", ...props }) => (
  <textarea
    className={
      "w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-[#0F172A] placeholder-[#94A3B8] shadow-sm focus:outline-none focus:ring-4 focus:ring-[#C7D2FE] min-h-[96px]"
      + " " + className
    }
    {...props}
  />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = "", children, ...props }) => (
  <select
    className={
      "w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-[#0F172A] shadow-sm focus:outline-none focus:ring-4 focus:ring-[#C7D2FE]"
      + " " + className
    }
    {...props}
  >
    {children}
  </select>
);

const Divider: React.FC = () => <div className="h-px w-full bg-gradient-to-r from-transparent via-[#E2E8F0] to-transparent my-6"/>;

// Generated avatar circle with initials
const Avatar: React.FC<{ name: string; hue?: number; size?: number }>
  = ({ name, hue = 205, size = 40 }) => {
  const initials = useMemo(() => name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase(), [name]);
  return (
    <div
      aria-label={`${name} avatar`}
      style={{ width: size, height: size, background: `hsl(${hue}, 90%, 90%)`, color: `hsl(${hue}, 40%, 25%)` }}
      className="flex items-center justify-center rounded-full font-semibold border border-white shadow-sm"
    >
      {initials}
    </div>
  );
};

// -----------------------------
// Coins Rain (for deposits & confetti-like effects)
// -----------------------------

const CoinsRain: React.FC<{ count?: number; triggerKey: number }>
  = ({ count = 12, triggerKey }) => {
  const coins = new Array(count).fill(null).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.3,
    scale: 0.6 + Math.random() * 0.7,
    duration: 0.8 + Math.random() * 0.6,
  }));
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {coins.map(c => (
        <motion.div
          key={`${triggerKey}-${c.id}`}
          initial={{ y: -40, opacity: 0, x: `${c.x}%`, scale: c.scale }}
          animate={{ y: [ -40, 20, 140, 220 ], opacity: [0, 1, 1, 0] }}
          transition={{ duration: c.duration, delay: c.delay, ease: "easeOut" }}
          className="absolute"
        >
          <CoinSVG className="w-6 h-6" />
        </motion.div>
      ))}
    </div>
  );
};

// -----------------------------
// App Shell
// -----------------------------

type View = "dashboard" | "create" | "detail";

const Header: React.FC<{
  onCreate: () => void;
  onHome: () => void;
  onConnect?: () => void;
  connected?: boolean;
}> = ({ onCreate, onHome, onConnect, connected }) => (
  <div className="sticky top-0 z-40 backdrop-blur bg-[#F8FAFC]/70 border-b border-[#E2E8F0]">
    <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
      <button onClick={onHome} className="flex items-center gap-3 group">
        <div className="relative">
          <PiggySVG className="w-9 h-9" />
          <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition" style={{ boxShadow: "0 0 0 8px rgba(255,137,194,0.15)" }} />
        </div>
        <div>
          <div className="text-sm tracking-wide text-[#64748B]">Mini App on Base</div>
          <div className="font-extrabold text-lg text-[#0F172A]">Piggy Protocol</div>
        </div>
      </button>

      <div className="flex items-center gap-3">
        <SecondaryButton onClick={onCreate}>Create Piggybank</SecondaryButton>
        <PrimaryButton onClick={onConnect}>
          {connected ? "Wallet Connected" : "Connect Wallet"}
        </PrimaryButton>
      </div>
    </div>
  </div>
);

// Hero Banner
const Hero: React.FC<{ piggyCount: number; totalPot: number }>
  = ({ piggyCount, totalPot }) => (
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
          <Pill>Active piggybanks: <strong className="ml-1">{piggyCount}</strong></Pill>
          <Pill tone="success">Total at stake: <strong className="ml-1">{formatEth(totalPot)}</strong></Pill>
        </div>
      </div>
      <div className="relative h-48 md:h-64">
        <motion.div
          className="absolute right-4 md:right-10 bottom-0"
          initial={{ y: 10 }}
          animate={{ y: [10, -6, 10] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        >
          <PiggySVG className="w-56 h-56 md:w-72 md:h-72 drop-shadow-xl" />
        </motion.div>
        <motion.div
          className="absolute right-24 md:right-40 bottom-24"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [0.8, 1], opacity: [0, 1] }}
          transition={{ repeat: Infinity, duration: 2.5, repeatDelay: 1.5 }}
        >
          <CoinSVG className="w-8 h-8" />
        </motion.div>
      </div>
    </div>
  </div>
);

// Dashboard Cards
const PiggyCard: React.FC<{ piggy: Piggybank; onOpen: () => void }>
  = ({ piggy, onOpen }) => {
  const leader = useMemo(() => {
    // lowest breaks wins (discipline score)
    const sorted = [...piggy.members].sort((a,b) => a.breaks - b.breaks);
    return sorted[0];
  }, [piggy]);

  return (
    <button onClick={onOpen} className="group text-left rounded-2xl p-5 bg-white border border-[#E2E8F0] shadow-sm hover:shadow-lg transition relative overflow-hidden">
      <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full opacity-10"
           style={{ background: "radial-gradient(circle, #FF89C2 0%, transparent 60%)" }} />
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-sm text-[#64748B]">Piggybank</div>
          <div className="font-bold text-lg text-[#0F172A]">{piggy.name}</div>
        </div>
        <Pill tone="success">Pot {formatEth(piggy.potEth)}</Pill>
      </div>
      <Divider />
      <div className="flex items-center gap-4">
        {piggy.members.map(m => (
          <div key={m.id} className="flex items-center gap-2">
            <Avatar name={m.name} hue={m.avatarHue} />
            <div>
              <div className="font-semibold text-[#0F172A]">{m.name}</div>
              <div className="text-xs text-[#64748B]">breaks: {m.breaks}</div>
            </div>
          </div>
        ))}
        <div className="ml-auto text-right">
          <div className="text-xs text-[#64748B]">Leader</div>
          <div className="font-semibold text-[#0F172A]">{leader?.name}</div>
        </div>
      </div>
    </button>
  );
};

// Create Piggybank Wizard
const CreatePiggybank: React.FC<{
  onCancel: () => void;
  onCreate: (p: Piggybank) => void;
}> = ({ onCancel, onCreate }) => {
  const [name, setName] = useState("");
  const [theme, setTheme] = useState("Be nice, post daily");
  const [entry, setEntry] = useState(0.01);

  // Members
  const [members, setMembers] = useState<Member[]>([
    { id: uid(), name: "You", avatarHue: 205, breaks: 0 },
  ]);
  const addMember = (name: string) => setMembers(prev => [...prev, { id: uid(), name, avatarHue: Math.floor(Math.random()*360), breaks: 0 }]);
  const removeMember = (id: string) => setMembers(prev => prev.filter(m => m.id !== id));

  // Rules
  const [rules, setRules] = useState<Rule[]>([]);
  const addRule = (r: Rule) => setRules(prev => [...prev, r]);
  const removeRule = (id: string) => setRules(prev => prev.filter(r => r.id !== id));

  // New Rule Draft
  const [ruleType, setRuleType] = useState<RuleType>("WORD_BAN");
  const [bannedWords, setBannedWords] = useState<string>("");
  const [minPostsPerWeek, setMinPostsPerWeek] = useState<number>(7);
  const [customDesc, setCustomDesc] = useState<string>("");
  const [penalty, setPenalty] = useState<number>(0.002);

  const onAddRule = () => {
    const id = uid();
    let label = "";
    const cfg: Rule["config"] = {};
    if (ruleType === "WORD_BAN") {
      const words = bannedWords.split(",").map(w => w.trim()).filter(Boolean);
      label = words.length ? `No ${words[0]}${words.length>1 ? " +" : ""}` : "No banned words";
      cfg.bannedWords = words;
    } else if (ruleType === "POST_QUOTA") {
      label = `Post at least ${minPostsPerWeek}/week`;
      cfg.minPostsPerWeek = clamp(minPostsPerWeek, 1, 100);
    } else {
      label = customDesc || "Custom rule";
      cfg.description = customDesc;
    }
    const rule: Rule = { id, label, type: ruleType, config: cfg, penaltyEth: clamp(penalty, 0.0001, 1) };
    addRule(rule);
    setBannedWords("");
    setCustomDesc("");
  };

  const canCreate = name.trim().length >= 3 && members.length >= 2 && rules.length >= 1;

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-3xl bg-white border border-[#E2E8F0] shadow-sm p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#0F172A]">Create a Piggybank</h2>
            <Pill>Entry stake: {formatEth(entry)}</Pill>
          </div>
          <Divider />
          <div className="grid md:grid-cols-2 gap-6">
            <Field label="Piggybank name" hint="Clear and playful works best">
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="No-Curse November" />
            </Field>
            <Field label="Theme / tagline" hint="Optional vibe line">
              <Input value={theme} onChange={e => setTheme(e.target.value)} placeholder="Keep it wholesome, keep it fun" />
            </Field>
            <Field label="Entry stake (ETH)" hint="Each member deposits this to join">
              <Input type="number" min={0.0001} step={0.001} value={entry}
                     onChange={e => setEntry(parseFloat(e.target.value || "0"))} />
            </Field>
          </div>
        </div>

        {/* Members */}
        <div className="rounded-3xl bg-white border border-[#E2E8F0] shadow-sm p-6">
          <h3 className="text-lg font-semibold text-[#0F172A]">Members</h3>
          <Divider />
          <div className="space-y-4">
            <MemberAdder onAdd={addMember} />
            <div className="grid sm:grid-cols-2 gap-4">
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-4 rounded-2xl border border-[#E2E8F0] p-3">
                  <Avatar name={m.name} hue={m.avatarHue} />
                  <div className="font-semibold text-[#0F172A]">{m.name}</div>
                  <button onClick={() => removeMember(m.id)} className="ml-auto text-[#EF4444] hover:underline">Remove</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rules */}
        <div className="rounded-3xl bg-white border border-[#E2E8F0] shadow-sm p-6">
          <h3 className="text-lg font-semibold text-[#0F172A]">Rules</h3>
          <Divider />
          <div className="grid md:grid-cols-5 gap-4">
            <Field label="Type" className="md:col-span-2">
              <Select value={ruleType} onChange={e => setRuleType(e.target.value as RuleType)}>
                <option value="WORD_BAN">Word ban</option>
                <option value="POST_QUOTA">Post quota</option>
                <option value="CUSTOM">Custom</option>
              </Select>
            </Field>
            {ruleType === "WORD_BAN" && (
              <Field label="Banned words" className="md:col-span-3" hint="Comma-separated">
                <Input value={bannedWords} onChange={e => setBannedWords(e.target.value)} placeholder="dang, heck, frick" />
              </Field>
            )}
            {ruleType === "POST_QUOTA" && (
              <Field label="Min posts per week" className="md:col-span-3">
                <Input type="number" min={1} max={100} value={minPostsPerWeek}
                       onChange={e => setMinPostsPerWeek(parseInt(e.target.value || "0"))} />
              </Field>
            )}
            {ruleType === "CUSTOM" && (
              <Field label="Description" className="md:col-span-3">
                <Input value={customDesc} onChange={e => setCustomDesc(e.target.value)} placeholder="Be kind in replies" />
              </Field>
            )}
            <Field label="Penalty (ETH)" className="md:col-span-2">
              <Input type="number" min={0.0001} step={0.001} value={penalty}
                     onChange={e => setPenalty(parseFloat(e.target.value || "0"))} />
            </Field>
            <div className="md:col-span-5">
              <SecondaryButton onClick={onAddRule}>Add rule</SecondaryButton>
            </div>
          </div>

          {rules.length > 0 && (
            <div className="mt-6 space-y-3">
              {rules.map(r => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC]">
                  <Pill>{r.label}</Pill>
                  <span className="text-sm text-[#64748B]">Penalty: {formatEth(r.penaltyEth)}</span>
                  <button className="ml-auto text-[#EF4444] hover:underline" onClick={() => removeRule(r.id)}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Summary */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 space-y-4">
          <div className="rounded-3xl bg-white border border-[#E2E8F0] shadow-sm p-6">
            <h4 className="font-semibold text-[#0F172A] mb-2">Summary</h4>
            <div className="space-y-2 text-sm text-[#334155]">
              <div><strong>Name:</strong> {name || "—"}</div>
              <div><strong>Theme:</strong> {theme || "—"}</div>
              <div><strong>Members:</strong> {members.length}</div>
              <div><strong>Rules:</strong> {rules.length}</div>
              <div><strong>Entry stake:</strong> {formatEth(entry)}</div>
            </div>
            <Divider />
            <div className="flex gap-3">
              <SecondaryButton onClick={onCancel} className="w-1/2">Cancel</SecondaryButton>
              <PrimaryButton
                disabled={!canCreate}
                onClick={() => {
                  const piggy: Piggybank = {
                    id: uid(),
                    name: name || "Untitled Piggybank",
                    theme,
                    createdAt: Date.now(),
                    periodEndsAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
                    potEth: members.length * entry, // initial deposits
                    entryStakeEth: entry,
                    rules,
                    members,
                    infractions: [],
                  };
                  onCreate(piggy);
                }}
                className="w-1/2"
              >
                Create
              </PrimaryButton>
            </div>
            {!canCreate && (
              <p className="mt-2 text-xs text-[#64748B]">Add at least 2 members and 1 rule; name must be ≥ 3 chars.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MemberAdder: React.FC<{ onAdd: (name: string) => void }>
  = ({ onAdd }) => {
  const [value, setValue] = useState("");
  return (
    <div className="flex gap-2">
      <Input value={value} onChange={e => setValue(e.target.value)} placeholder="Add member by name" />
      <SecondaryButton onClick={() => { if (value.trim()) { onAdd(value.trim()); setValue(""); } }}>Add</SecondaryButton>
    </div>
  );
};

// Piggybank Detail View
const PiggyDetail: React.FC<{
  piggy: Piggybank;
  onBack: () => void;
  onUpdate: (p: Piggybank) => void;
}> = ({ piggy, onBack, onUpdate }) => {
  const [local, setLocal] = useState<Piggybank>(piggy);
  const [rainKey, setRainKey] = useState(0);
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
    setRainKey(x => x + 1);
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
      <CoinsRain count={16} triggerKey={rainKey} />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-[#0052FF] hover:underline">← Back</button>
          <h2 className="text-2xl font-bold text-[#0F172A]">{local.name}</h2>
        </div>
        <div className="flex items-center gap-3">
          <Pill tone="success">Pot {formatEth(local.potEth)}</Pill>
          <PrimaryButton onClick={() => setOpenInfraction(true)}>Record infraction</PrimaryButton>
          <SecondaryButton onClick={settleAndPickWinner}>End & pick winner</SecondaryButton>
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
              <PiggySVG className="w-14 h-14" />
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
};

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
            <SecondaryButton onClick={onClose} className="w-1/2">Cancel</SecondaryButton>
            <PrimaryButton onClick={() => onSubmit(member, rule, notes)} className="w-1/2">Record</PrimaryButton>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// -----------------------------
// Main App
// -----------------------------

export default function PiggybankMiniApp() {
  const [view, setView] = useState<View>("dashboard");
  const [connected, setConnected] = useState(false);
  const [piggies, setPiggies] = useState<Piggybank[]>([seedPiggybank()]);
  const [active, setActive] = useState<Piggybank | null>(piggies[0]);

  const totalPot = useMemo(() => piggies.reduce((sum, p) => sum + p.potEth, 0), [piggies]);

  useEffect(() => {
    // Accessibility: focus on view change
    const title = document.getElementById("page-title");
    title?.focus();
  }, [view]);

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFC] text-[#1E293B]">
      <Header
        onCreate={() => setView("create")}
        onHome={() => setView("dashboard")}
        onConnect={() => setConnected(v => !v)}
        connected={connected}
      />

      {/* Page container */}
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        {view === "dashboard" && (
          <>
            <Hero piggyCount={piggies.length} totalPot={totalPot} />

            <h2 id="page-title" tabIndex={-1} className="sr-only">Dashboard</h2>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {piggies.map(p => (
                <PiggyCard key={p.id} piggy={p} onOpen={() => { setActive(p); setView("detail"); }} />
              ))}
              <button
                onClick={() => setView("create")}
                className="rounded-2xl p-5 border-dashed border-2 border-[#C7D2FE] text-left bg-white hover:shadow-md transition"
              >
                <div className="text-sm text-[#64748B]">Start a new one</div>
                <div className="font-bold text-lg text-[#0F172A]">Create a Piggybank</div>
                <p className="text-[#64748B] mt-2 text-sm">Define rules, invite friends, stake, and compete.</p>
              </button>
            </div>
          </>
        )}

        {view === "create" && (
          <>
            <h2 id="page-title" tabIndex={-1} className="text-2xl font-bold">Create</h2>
            <CreatePiggybank
              onCancel={() => setView("dashboard")}
              onCreate={(p) => {
                setPiggies(prev => [p, ...prev]);
                setActive(p);
                setView("detail");
              }}
            />
          </>
        )}

        {view === "detail" && active && (
          <>
            <h2 id="page-title" tabIndex={-1} className="sr-only">Detail</h2>
            <PiggyDetail
              piggy={active}
              onBack={() => setView("dashboard")}
              onUpdate={(updated) => {
                setPiggies(prev => prev.map(p => p.id === updated.id ? updated : p));
                setActive(updated);
              }}
            />
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-[#E2E8F0] bg-white/60 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-[#64748B] flex flex-wrap items-center justify-between gap-3">
          <div>© {new Date().getFullYear()} Piggy Protocol • Built for Base Mini Apps</div>
          <div className="flex items-center gap-3">
            <Pill>Primary: #0052FF</Pill>
            <Pill>Accent: #FF89C2</Pill>
            <Pill tone="success">Success: #00C48C</Pill>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------
   MINI APP & ONCHAIN INTEGRATION NOTES (paste into your app)
   ------------------------------------------------------

1) OnchainKit Provider (Base chain)

// app/providers.tsx
'use client'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { base } from 'viem/chains'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <OnchainKitProvider apiKey={process.env.NEXT_PUBLIC_CDP_API_KEY} chain={base}>
      {children}
    </OnchainKitProvider>
  )
}

// Example usage in your page:
// import { ConnectWallet, SendTransaction } from '@coinbase/onchainkit'

2) Mini App Manifest (Farcaster / Base Mini Apps)

// app/.well-known/farcaster.json/route.ts
import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json({
    accountAssociation: { header: '...', payload: '...', signature: '...' },
    frame: {
      version: 'next',
      name: 'Piggy Protocol',
      iconUrl: 'https://your-domain/icon.png',
      homeUrl: 'https://your-domain/',
      splashImageUrl: 'https://your-domain/splash.png',
      splashBackgroundColor: '#ffffff',
      primaryCategory: 'social',
      tags: ['base','piggybank','miniapp']
    }
  })
}

3) Embed Meta Tag (for rich card + launch button)

// in <head>
<meta name="fc:miniapp" content='{
  "version":"next",
  "imageUrl":"https://your-domain/embed.png",
  "button":{"title":"Open","action":{"type":"launch_miniapp","name":"Piggy Protocol","url":"https://your-domain/"}}
}' />

4) Smart Contract Sketch (optional)
- Track piggybanks, members, rules, penalties
- Functions: createPiggybank, join, reportInfraction(member, ruleId), settle()
- Require deposits and add penalties to pot; at settle, transfer to winner
- Can start with a single contract per piggybank or a factory that deploys minimal proxies
- Use events for UI (InfractionsRecorded, PotUpdated, Settled)

5) Accessibility & QA
- All interactive controls have visible labels
- Keyboard focus on major view changes
- Sufficient contrast with slate text on white/soft backgrounds
- Motion kept subtle; respects reduced motion if you wire prefers-reduced-motion
*/
