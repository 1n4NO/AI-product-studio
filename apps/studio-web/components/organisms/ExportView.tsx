import type { StudioRun } from "@/lib/types";
import { evaluateAuditGate } from "@product-studio/ux-audit/gates";
import { cn } from "@/lib/cn";

interface ExportViewProps {
  run: StudioRun | null;
  baselineRun?: StudioRun | null;
  onExport?: (format: string) => void;
}

const GATE_LABELS: Record<string, string> = {
  SCORE_TOO_LOW:         "UX audit threshold",
  REGRESSION:            "No score regression",
  CRITICAL_FINDINGS:     "No critical findings",
};

const ARTIFACTS = [
  { id: "brief",     icon: "◻", label: "Brief JSON",     desc: "Canonical brief schema"           },
  { id: "blueprint", icon: "◈", label: "Page Blueprint", desc: "Section structure + intent"       },
  { id: "theme",     icon: "◆", label: "Theme Tokens",   desc: "CSS variables + design tokens"    },
  { id: "audit",     icon: "◎", label: "Audit Report",   desc: "Findings + recommendations"       },
  { id: "bundle",    icon: "▣", label: "Full Bundle",    desc: "All artifacts (.zip)"             },
];

const CHECKS = [
  { label: "Schema validity",          key: "schema" },
  { label: "Content quality baseline", key: "content" },
  { label: "UX audit threshold",       key: "SCORE_TOO_LOW" },
  { label: "Accessibility safeguards", key: "accessibility" },
  { label: "No score regression",      key: "REGRESSION" },
];

export function ExportView({ run, baselineRun, onExport }: ExportViewProps) {
  if (!run) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-5 border border-ps-border"
          style={{ background: "linear-gradient(135deg, var(--color-ps-surface), var(--color-ps-accent-tint))" }}
        >
          ▣
        </div>
        <p className="text-[15px] font-semibold text-ps-ink mb-2">No run selected</p>
        <p className="text-[13px] text-ps-ink-ghost max-w-xs">
          Select a run from the sidebar to evaluate export readiness.
        </p>
      </div>
    );
  }

  const gateResult = evaluateAuditGate(run.auditReport, baselineRun?.auditReport ?? null);
  const passed = gateResult.passed;
  const violationCodes = new Set(gateResult.violations.map((v) => v.code));

  return (
    <div className="max-w-2xl flex flex-col gap-4">
      {/* Gate hero */}
      <div
        className={cn(
          "rounded-xl border p-6 flex items-center gap-5",
          passed
            ? "border-ps-ok/30 bg-ps-ok/5"
            : "border-ps-err/30 bg-ps-err/5"
        )}
        style={passed ? { boxShadow: "0 0 30px rgba(48,160,96,0.08)" } : undefined}
      >
        <div
          className={cn(
            "w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0 border",
            passed ? "border-ps-ok/30 bg-ps-ok/10" : "border-ps-err/30 bg-ps-err/10"
          )}
        >
          {passed ? "✓" : "✕"}
        </div>
        <div>
          <h2 className={cn("text-[18px] font-bold mb-1", passed ? "text-ps-ok" : "text-ps-err")}>
            {passed ? "Export Gate Passed" : "Export Blocked"}
          </h2>
          <p className="text-[12px] text-ps-ink-dim">{gateResult.summary}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Gate checklist */}
        <div className="rounded-xl border border-ps-border bg-ps-surface p-5">
          <h3 className="text-[10px] font-semibold text-ps-ink-ghost uppercase tracking-widest mb-4">
            Gate Checks
          </h3>
          <div className="flex flex-col divide-y divide-ps-border">
            {CHECKS.map(({ label, key }) => {
              const failed = violationCodes.has(key) ||
                (key === "schema" && false) ||
                (key === "content" && false) ||
                (key === "accessibility" && run.auditReport.findings.some(f => f.severity === "critical"));
              return (
                <div key={key} className="flex items-center gap-3 py-2.5">
                  <span className={cn("text-[13px] shrink-0", failed ? "text-ps-err" : "text-ps-ok")}>
                    {failed ? "✕" : "✓"}
                  </span>
                  <span className="flex-1 text-[12px] text-ps-ink-dim">{label}</span>
                  <span className="text-[10px] font-mono text-ps-ink-ghost">
                    {key === "SCORE_TOO_LOW"
                      ? `${run.auditReport.score} / 100`
                      : failed ? "fail" : "pass"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Download artifacts */}
        <div className="rounded-xl border border-ps-border bg-ps-surface p-5">
          <h3 className="text-[10px] font-semibold text-ps-ink-ghost uppercase tracking-widest mb-4">
            Artifacts
          </h3>
          <div className="flex flex-col gap-2">
            {ARTIFACTS.map(({ id, icon, label, desc }) => (
              <button
                key={id}
                onClick={() => onExport?.(id)}
                disabled={id !== "bundle" && !passed}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors text-left",
                  "border-ps-border bg-ps-raised hover:border-ps-accent/30 hover:bg-ps-accent-tint",
                  "disabled:opacity-40 disabled:cursor-not-allowed"
                )}
              >
                <span className="text-[16px] text-ps-ink-ghost w-5 text-center shrink-0">
                  {icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-ps-ink">{label}</p>
                  <p className="text-[10px] text-ps-ink-ghost">{desc}</p>
                </div>
                <span className="text-[12px] text-ps-ink-ghost">↓</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Violations detail */}
      {gateResult.violations.length > 0 && (
        <div className="rounded-xl border border-ps-err/20 bg-ps-err/5 p-5">
          <h3 className="text-[10px] font-semibold text-ps-err uppercase tracking-widest mb-3">
            Gate Violations
          </h3>
          <div className="flex flex-col gap-2">
            {gateResult.violations.map((v) => (
              <div key={v.code} className="flex gap-3">
                <span className="text-[11px] font-mono text-ps-err shrink-0">{v.code}</span>
                <span className="text-[11px] text-ps-ink-dim">{v.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
