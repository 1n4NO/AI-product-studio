import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class strings, resolving conflicts correctly.
 * Use this everywhere instead of string concatenation.
 *
 * @example cn("px-4 py-2", condition && "bg-ps-accent", className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
