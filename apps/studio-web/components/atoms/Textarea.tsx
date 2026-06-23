"use client";

import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export function Textarea({ hasError, className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "w-full rounded-md px-3 py-2 text-[12px] leading-relaxed",
        "bg-ps-canvas border text-ps-ink placeholder:text-ps-ink-ghost",
        "outline-none transition-colors resize-none",
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
