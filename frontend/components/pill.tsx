import React from 'react';
import { cn } from '@/lib/utils';

interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "success" | "error" | "neutral";
}

export function Pill({ children, tone = "neutral", className = "", ...props }: PillProps) {
  const palette = {
    success: "bg-[#E8FFF6] text-[#006C4E] border-[#B9F4DE]",
    error: "bg-[#FFF1F1] text-[#8F1D1D] border-[#F8CACA]",
    neutral: "bg-[#EEF2FF] text-[#1E293B] border-[#C7D2FE]",
  }[tone];
  
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm border", palette, className)} {...props}>
      {children}
    </span>
  );
}
