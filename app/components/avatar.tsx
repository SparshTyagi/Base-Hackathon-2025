import React, { useMemo } from 'react';

interface AvatarProps {
  name: string;
  hue?: number;
  size?: number;
}

export function Avatar({ name, hue = 205, size = 40 }: AvatarProps) {
  const initials = useMemo(() => 
    name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase(), 
    [name]
  );
  
  return (
    <div
      aria-label={`${name} avatar`}
      style={{ 
        width: size, 
        height: size, 
        background: `hsl(${hue}, 90%, 90%)`, 
        color: `hsl(${hue}, 40%, 25%)` 
      }}
      className="flex items-center justify-center rounded-full font-semibold border border-white shadow-sm"
    >
      {initials}
    </div>
  );
}
