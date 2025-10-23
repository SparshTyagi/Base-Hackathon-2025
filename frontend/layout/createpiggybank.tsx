import React, { useState } from 'react';
import { uid, clamp, formatEth } from '@/lib/utils';
import { Button } from '@/components/button';
import { Field } from '@/components/field';
import { Input } from '@/components/input';
import { TextArea } from '@/components/textarea';
import { Select } from '@/components/select';
import { Pill } from '@/components/pill';
import { Divider } from '@/components/divider';
import { Avatar } from '@/components/avatar';
import { Member, Rule, RuleType, Piggybank } from '@/lib/types';

interface CreatePiggybankProps {
  onCancel: () => void;
  onCreate: (p: Piggybank) => void;
  userAddress?: string;
}

export function CreatePiggybank({ onCancel, onCreate, userAddress }: CreatePiggybankProps) {
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
              <Button variant="secondary" onClick={onAddRule}>Add rule</Button>
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
              <Button variant="secondary" onClick={onCancel} className="w-1/2">Cancel</Button>
              <Button
                variant="primary"
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
              </Button>
            </div>
            {!canCreate && (
              <p className="mt-2 text-xs text-[#64748B]">Add at least 2 members and 1 rule; name must be ≥ 3 chars.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const MemberAdder: React.FC<{ onAdd: (name: string) => void }> = ({ onAdd }) => {
  const [value, setValue] = useState("");
  return (
    <div className="flex gap-2">
      <Input value={value} onChange={e => setValue(e.target.value)} placeholder="Add member by name" />
      <Button variant="secondary" onClick={() => { if (value.trim()) { onAdd(value.trim()); setValue(""); } }}>Add</Button>
    </div>
  );
};
