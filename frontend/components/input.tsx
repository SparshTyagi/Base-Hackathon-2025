import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-[#0F172A] placeholder-[#94A3B8] shadow-sm focus:outline-none focus:ring-4 focus:ring-[#C7D2FE]",
        className
      )}
      {...props}
    />
  );
}
