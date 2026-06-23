import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant =
  | "pending"
  | "approved"
  | "rejected"
  | "pass"
  | "fail"
  | "score";

interface BadgeProps {
  variant: BadgeVariant;
  /** Used when variant="score" to display the numeric value */
  score?: number;
  children?: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  pending:  "bg-ps-warn/10  text-ps-warn  border-ps-warn/20",
  approved: "bg-ps-ok/10   text-ps-ok    border-ps-ok/20",
  rejected: "bg-ps-err/10  text-ps-err   border-ps-err/20",
  pass:     "bg-ps-ok/10   text-ps-ok    border-ps-ok/20",
  fail:     "bg-ps-err/10  text-ps-err   border-ps-err/20",
  score:    "bg-ps-accent/10 text-ps-accent-soft border-ps-accent/20 font-mono",
};

const variantLabels: Partial<Record<BadgeVariant, string>> = {
  pending:  "pending",
  approved: "approved",
  rejected: "rejected",
  pass:     "pass",
  fail:     "fail",
};

export function Badge({ variant, score, children, className }: BadgeProps) {
  const label =
    variant === "score" && score !== undefined
      ? String(score)
      : (children ?? variantLabels[variant] ?? variant);

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center px-1.5 py-0.5",
        "text-[10px] font-semibold tracking-wide uppercase",
        "rounded border",
        variantStyles[variant],
        className
      )}
    >
      {label}
    </span>
  );
}
