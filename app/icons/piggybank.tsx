import React from 'react';

interface PiggyBankSVGProps {
  className?: string;
}

export default function PiggyBankSVG({ className }: PiggyBankSVGProps) {
  return (
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
}
