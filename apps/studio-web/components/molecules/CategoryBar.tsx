import { cn } from "@/lib/cn";

export type AuditCategory = "accessibility" | "readability" | "performance";

interface CategoryBarProps {
  category: AuditCategory;
  score: number;   // 0–100
  className?: string;
}

const CATEGORY_LABELS: Record<AuditCategory, string> = {
  accessibility: "Accessibility",
  readability:   "Readability",
  performance:   "Performance",
};

function barColor(score: number): string {
  if (score >= 80) return "bg-ps-ok";
  if (score >= 60) return "bg-ps-accent";
  if (score >= 40) return "bg-ps-warn";
  return "bg-ps-err";
}

function textColor(score: number): string {
  if (score >= 80) return "text-ps-ok";
  if (score >= 60) return "text-ps-accent-soft";
  if (score >= 40) return "text-ps-warn";
  return "text-ps-err";
}

export function CategoryBar({ category, score, className }: CategoryBarProps) {
  const clamped = Math.max(0, Math.min(100, score));

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="w-24 shrink-0 text-[11px] text-ps-ink-ghost">
        {CATEGORY_LABELS[category]}
      </span>

      <div
        className="flex-1 h-[5px] bg-ps-border rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${CATEGORY_LABELS[category]}: ${clamped}`}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-500", barColor(clamped))}
          style={{ width: `${clamped}%` }}
        />
      </div>

      <span className={cn("w-7 text-right text-[11px] font-mono font-bold tabular-nums", textColor(clamped))}>
        {clamped}
      </span>
    </div>
  );
}
