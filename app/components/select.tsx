import React from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export function Select({ className = '', children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-[#0F172A] shadow-sm focus:outline-none focus:ring-4 focus:ring-[#C7D2FE]",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
