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
  previousScore?: number;
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

function ScoreDelta({ current, previous }: { current: number; previous: number }) {
  const delta = current - previous;
  if (delta === 0) return null;
  const positive = delta > 0;
  return (
    <span
      className="text-[10px] font-semibold font-mono"
      style={{ color: positive ? "var(--color-ps-ok)" : "var(--color-ps-err)" }}
    >
      {positive ? "▲" : "▼"}{Math.abs(delta)}
    </span>
  );
}

export function RunItem({ run, isActive, onClick }: RunItemProps) {
  const createdDate = new Date(run.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day:   "numeric",
  });

  return (
    <button
      onClick={onClick}
      aria-current={isActive ? "true" : undefined}
      className={cn(
        "w-full text-left px-3 py-2.5 rounded-lg border transition-colors",
        isActive
          ? "border-ps-border"
          : "border-transparent hover:border-ps-border"
      )}
      style={{
        background: isActive ? "var(--color-ps-raised)" : "transparent",
      }}
    >
      <p
        className="text-[11px] font-medium leading-snug"
        style={{ color: isActive ? "var(--color-ps-ink)" : "var(--color-ps-ink-dim)" }}
      >
        Run #{run.runNumber} · {run.productName}
      </p>
      <div className="flex items-center gap-2 mt-1">
        <span
          className="font-mono text-[10px] font-bold"
          style={{ color: "var(--color-ps-accent-soft)" }}
        >
          {run.score}
        </span>
        {run.previousScore !== undefined && (
          <ScoreDelta current={run.score} previous={run.previousScore} />
        )}
        <Badge variant={statusToBadge[run.reviewStatus]} />
        <span className="ml-auto text-[10px]" style={{ color: "var(--color-ps-ink-ghost)" }}>
          {createdDate}
        </span>
      </div>
    </button>
  );
}
