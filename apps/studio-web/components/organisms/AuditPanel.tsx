import type { AuditReport, AuditFinding } from "@/lib/types";
import { ScoreRing } from "@/components/atoms/ScoreRing";
import { CategoryBar } from "@/components/molecules/CategoryBar";
import { FindingCard } from "@/components/molecules/FindingCard";
import { cn } from "@/lib/cn";

interface AuditPanelProps {
  auditReport: AuditReport | null;
  onAutoFix?: (finding: AuditFinding) => void;
  isGenerating?: boolean;
}

const SEVERITY_ORDER: AuditFinding["severity"][] = ["critical", "high", "medium", "low"];

const SEVERITY_LABELS: Record<AuditFinding["severity"], string> = {
  critical: "Critical",
  high:     "High",
  medium:   "Medium",
  low:      "Low",
};

const SEVERITY_COLORS: Record<AuditFinding["severity"], string> = {
  critical: "text-ps-sev-critical",
  high:     "text-ps-sev-high",
  medium:   "text-ps-sev-medium",
  low:      "text-ps-sev-low",
};

export function AuditPanel({ auditReport, onAutoFix, isGenerating }: AuditPanelProps) {
  if (isGenerating) {
    return (
      <div className="grid grid-cols-[260px_1fr] gap-5">
        <div className="rounded-xl border border-ps-border bg-ps-surface p-5 animate-pulse">
          <div className="w-28 h-28 rounded-full bg-ps-raised mx-auto mb-6" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-3 items-center mb-3">
              <div className="h-2 bg-ps-raised rounded flex-1" />
              <div className="w-6 h-3 bg-ps-raised rounded" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-ps-surface border border-ps-border animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!auditReport) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-5 border border-ps-border"
          style={{ background: "linear-gradient(135deg, var(--color-ps-surface), var(--color-ps-accent-tint))" }}
        >
          ◎
        </div>
        <p className="text-[15px] font-semibold text-ps-ink mb-2">No audit yet</p>
        <p className="text-[13px] text-ps-ink-ghost max-w-xs">
          Generate a run to see UX audit scores and findings.
        </p>
      </div>
    );
  }

  // Group findings by severity
  const grouped = SEVERITY_ORDER.reduce<Record<AuditFinding["severity"], AuditFinding[]>>(
    (acc, sev) => {
      acc[sev] = auditReport.findings.filter((f) => f.severity === sev);
      return acc;
    },
    { critical: [], high: [], medium: [], low: [] }
  );

  return (
    <div className="grid grid-cols-[260px_1fr] gap-5 items-start">
      {/* ── Left: score card ── */}
      <aside className="rounded-xl border border-ps-border bg-ps-surface p-5 sticky top-0">
        {/* Score ring */}
        <div className="flex justify-center mb-5">
          <ScoreRing score={auditReport.score} size={120} />
        </div>

        {/* Category bars */}
        <div className="flex flex-col gap-3 mb-5 pb-5 border-b border-ps-border">
          <CategoryBar category="accessibility" score={auditReport.categoryScores.accessibility} />
          <CategoryBar category="readability"   score={auditReport.categoryScores.readability} />
          <CategoryBar category="performance"   score={auditReport.categoryScores.performance} />
        </div>

        {/* Severity summary */}
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-semibold text-ps-ink-ghost uppercase tracking-widest mb-1">
            Findings
          </p>
          {SEVERITY_ORDER.map((sev) => {
            const count = grouped[sev].length;
            if (count === 0) return null;
            return (
              <div key={sev} className="flex items-center justify-between">
                <span className="text-[11px] text-ps-ink-ghost">{SEVERITY_LABELS[sev]}</span>
                <span className={cn("text-[12px] font-bold font-mono tabular-nums", SEVERITY_COLORS[sev])}>
                  {count}
                </span>
              </div>
            );
          })}
          {auditReport.findings.length === 0 && (
            <p className="text-[11px] text-ps-ok font-medium">No findings — clean pass!</p>
          )}
        </div>
      </aside>

      {/* ── Right: findings list ── */}
      <main className="flex flex-col gap-5">
        {auditReport.findings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-ps-border bg-ps-surface text-center">
            <span className="text-3xl mb-3">✓</span>
            <p className="text-[14px] font-semibold text-ps-ok mb-1">All checks passed</p>
            <p className="text-[12px] text-ps-ink-ghost">No UX issues detected in this run.</p>
          </div>
        ) : (
          SEVERITY_ORDER.map((sev) => {
            const findings = grouped[sev];
            if (findings.length === 0) return null;
            return (
              <section key={sev}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={cn("w-2 h-2 rounded-full shrink-0", {
                    "bg-ps-sev-critical": sev === "critical",
                    "bg-ps-sev-high":     sev === "high",
                    "bg-ps-sev-medium":   sev === "medium",
                    "bg-ps-sev-low":      sev === "low",
                  })} />
                  <h3 className={cn("text-[11px] font-bold uppercase tracking-widest", SEVERITY_COLORS[sev])}>
                    {SEVERITY_LABELS[sev]}
                  </h3>
                  <span className="text-[10px] text-ps-ink-ghost font-mono">{findings.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {findings.map((f) => (
                    <FindingCard key={f.id} finding={f} onAutoFix={onAutoFix} />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </main>
    </div>
  );
}
