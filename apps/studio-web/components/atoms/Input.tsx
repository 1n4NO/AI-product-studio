"use client";

import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export function Input({ hasError, className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full rounded-md px-3 py-2 text-[12px]",
        "bg-ps-canvas border text-ps-ink placeholder:text-ps-ink-ghost",
        "outline-none transition-colors",
        hasError
          ? "border-ps-err focus:border-ps-err"
          : "border-ps-border focus:border-ps-accent",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  );
}
