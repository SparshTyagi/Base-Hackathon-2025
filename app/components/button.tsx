import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export function Button({ className = '', variant = 'primary', children, ...props }: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center rounded-2xl px-5 py-3 font-semibold transition";
  
  const variantClasses = {
    primary: "bg-[linear-gradient(135deg,#0052FF_0%,#7AA5FF_35%,#FF89C2_100%)] text-white shadow-lg hover:opacity-95 active:scale-[.99]",
    secondary: "border border-[#C7D2FE] text-[#1E293B] bg-white/70 backdrop-blur hover:bg-white shadow-sm"
  };

  return (
    <button
      className={cn(baseClasses, variantClasses[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}
