"use client";

import { Badge } from "@/components/atoms/Badge";
import type { BadgeVariant } from "@/components/atoms/Badge";
import { cn } from "@/lib/cn";

export type RunReviewStatus = "pending_review" | "approved" | "rejected";

export interface RunSummary {
  id: string;
  runNumber: number;
  productName: string;
  score: number;
  reviewStatus: RunReviewStatus;
  createdAt: string;
}

interface RunItemProps {
  run: RunSummary;
  isActive: boolean;
  onClick: () => void;
}

const statusToBadge: Record<RunReviewStatus, BadgeVariant> = {
  pending_review: "pending",
  approved:       "approved",
  rejected:       "rejected",
};

export function RunItem({ run, isActive, onClick }: RunItemProps) {
  const createdDate = new Date(run.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <button
      onClick={onClick}
      aria-current={isActive ? "true" : undefined}
      className={cn(
        "w-full text-left px-3 py-2.5 rounded-lg border transition-colors",
        isActive
          ? "bg-ps-raised border-ps-border"
          : "border-transparent hover:bg-ps-surface hover:border-ps-border"
      )}
    >
      {/* Run name */}
      <p className={cn("text-[11px] font-medium leading-snug", isActive ? "text-ps-ink" : "text-ps-ink-dim")}>
        Run #{run.runNumber} · {run.productName}
      </p>

      {/* Meta row */}
      <div className="flex items-center gap-2 mt-1">
        <span className="font-mono text-[10px] font-bold text-ps-accent-soft">
          {run.score}
        </span>
        <Badge variant={statusToBadge[run.reviewStatus]} />
        <span className="ml-auto text-[10px] text-ps-ink-ghost">{createdDate}</span>
      </div>
    </button>
  );
}
