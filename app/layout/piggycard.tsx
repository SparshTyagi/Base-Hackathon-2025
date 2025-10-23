import React, { useMemo } from 'react';
import { formatEth } from '@/lib/utils';
import { Avatar } from '@/components/avatar';
import { Pill } from '@/components/pill';
import { Divider } from '@/components/divider';
import { Piggybank } from '@/lib/types';

interface PiggyCardProps {
  piggy: Piggybank;
  onOpen: () => void;
}

export function PiggyCard({ piggy, onOpen }: PiggyCardProps) {
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
}
