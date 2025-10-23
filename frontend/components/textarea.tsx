import React from 'react';
import { cn } from '@/lib/utils';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function TextArea({ className = '', ...props }: TextAreaProps) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-[#0F172A] placeholder-[#94A3B8] shadow-sm focus:outline-none focus:ring-4 focus:ring-[#C7D2FE] min-h-[96px]",
        className
      )}
      {...props}
    />
  );
}
