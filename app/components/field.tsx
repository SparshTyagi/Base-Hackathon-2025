import React from 'react';

interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

export function Field({ label, hint, children, className = '', ...props }: FieldProps) {
  return (
    <div className={`space-y-2 ${className}`} {...props}>
      <label className="block text-sm font-semibold text-[#0F172A]">{label}</label>
      {children}
      {hint && <p className="text-xs text-[#64748B]">{hint}</p>}
    </div>
  );
}
