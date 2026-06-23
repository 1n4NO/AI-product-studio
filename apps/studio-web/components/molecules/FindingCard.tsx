import type { AuditFinding } from "@product-studio/shared-types";
import { cn } from "@/lib/cn";

interface FindingCardProps {
  finding: AuditFinding;
  onAutoFix?: (finding: AuditFinding) => void;
  className?: string;
}

const severityBar: Record<AuditFinding["severity"], string> = {
  critical: "bg-ps-sev-critical",
  high:     "bg-ps-sev-high",
  medium:   "bg-ps-sev-medium",
  low:      "bg-ps-sev-low",
};

const categoryStyles: Record<AuditFinding["category"], string> = {
  accessibility: "bg-ps-accent/10  text-ps-accent-soft  border-ps-accent/20",
  readability:   "bg-ps-info/10    text-ps-info-soft    border-ps-info/20",
  performance:   "bg-ps-ok/10      text-ps-ok           border-ps-ok/20",
};

const SEVERITY_LABELS: Record<AuditFinding["severity"], string> = {
  critical: "Critical",
  high:     "High",
  medium:   "Medium",
  low:      "Low",
};

export function FindingCard({ finding, onAutoFix, className }: FindingCardProps) {
  const hasAutoFix = finding.severity === "critical" || finding.severity === "high";

  return (
    <article
      className={cn(
        "flex gap-3 p-3 rounded-lg",
        "bg-ps-surface border border-ps-border",
        className
      )}
    >
      {/* Severity bar */}
      <div
        className={cn("w-[3px] shrink-0 rounded-full self-stretch", severityBar[finding.severity])}
        aria-hidden="true"
      />

      <div className="flex-1 min-w-0">
        {/* Title row */}
        <div className="flex items-start gap-2 mb-1">
          <span className="flex-1 text-[12px] font-semibold text-ps-ink leading-snug">
            {finding.title}
          </span>
          <span
            className={cn(
              "shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border tracking-wide",
              categoryStyles[finding.category]
            )}
          >
            {finding.category}
          </span>
        </div>

        {/* Description */}
        <p className="text-[11px] text-ps-ink-dim leading-relaxed mb-2">
          {finding.description}
        </p>

        {/* Recommendation */}
        <p className="text-[11px] text-ps-ink-ghost leading-relaxed">
          <span className="text-ps-ink-dim font-medium">Fix: </span>
          {finding.recommendation}
        </p>

        {/* Auto-fix CTA */}
        {hasAutoFix && onAutoFix && (
          <button
            onClick={() => onAutoFix(finding)}
            className="mt-2 text-[11px] font-semibold text-ps-accent-soft hover:text-ps-accent transition-colors"
          >
            → Auto-fix available
          </button>
        )}

        {/* Severity label */}
        <div className="mt-2 text-[10px] text-ps-ink-ghost">
          Severity: <span className="font-semibold">{SEVERITY_LABELS[finding.severity]}</span>
        </div>
      </div>
    </article>
  );
}
