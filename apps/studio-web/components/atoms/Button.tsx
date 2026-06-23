"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "ghost" | "danger" | "subtle";
export type ButtonSize    = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-ps-accent-dim text-ps-accent-soft border border-ps-accent hover:bg-ps-accent transition-colors",
  ghost:
    "text-ps-ink-dim border border-ps-border bg-transparent hover:bg-ps-raised hover:text-ps-ink transition-colors",
  danger:
    "bg-ps-err/10 text-ps-err border border-ps-err/30 hover:bg-ps-err/20 transition-colors",
  subtle:
    "bg-ps-raised text-ps-ink-dim border border-ps-border hover:text-ps-ink transition-colors",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-[11px] rounded-md",
  md: "px-4 py-2   text-[12px] rounded-md",
  lg: "px-5 py-2.5 text-[13px] rounded-lg",
};

export function Button({
  variant = "ghost",
  size = "md",
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold tracking-tight",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
