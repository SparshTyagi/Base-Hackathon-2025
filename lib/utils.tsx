import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export const clamp = (n: number, min = 0, max = 1_000_000) =>
  Math.max(min, Math.min(max, n));

export const formatEth = (n: number) => `${n.toFixed(4)} ETH`;