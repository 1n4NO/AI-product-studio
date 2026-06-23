"use client";

import type { StudioRun } from "@/lib/types";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { ScoreRing } from "@/components/atoms/ScoreRing";

interface ExportsPanelProps {
  runs: StudioRun[];
  /** Called when the user wants to open a run's full Export view */
  onOpenRun?: (id: string) => void;
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportsPanel({ runs, onOpenRun }: ExportsPanelProps) {
  if (runs.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-24 text-center gap-3"
        style={{ color: "var(--color-ps-ink-ghost)" }}
      >
        <span className="text-4xl" aria-hidden="true">↑</span>
        <p className="text-sm font-medium" style={{ color: "var(--color-ps-ink-dim)" }}>
          No exports yet.
        </p>
        <p className="text-xs max-w-xs">
          Complete an audit run to export blueprints, themes, and audit reports.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div>
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-ps-ink)" }}>
          Export History
        </h2>
        <p className="text-[11px] mt-0.5" style={{ color: "var(--color-ps-ink-ghost)" }}>
          {runs.length} run{runs.length !== 1 ? "s" : ""} available for download. Hit{" "}
          <span className="font-semibold" style={{ color: "var(--color-ps-accent-soft)" }}>
            Open →
          </span>{" "}
          for the full export view with CSS variables and ZIP bundles.
        </p>
      </div>

      {runs.map((run) => {
        const slug = run.brief.productName.toLowerCase().replace(/\s+/g, "-");
        const criticalCount = run.auditReport.findings.filter((f) => f.severity === "critical").length;

        return (
          <div
            key={run.id}
            className="rounded-xl border overflow-hidden"
            style={{
              background:   "var(--color-ps-surface)",
              borderColor:  "var(--color-ps-border)",
            }}
          >
            {/* Run header */}
            <div
              className="flex items-center gap-4 px-4 py-3 border-b"
              style={{ borderColor: "var(--color-ps-border)" }}
            >
              <ScoreRing score={run.auditReport.score} size={44} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-[13px] font-semibold truncate"
                    style={{ color: "var(--color-ps-ink)" }}
                  >
                    {run.brief.productName}
                  </span>
                  <Badge
                    variant={
                      run.review.status === "approved" ? "approved" :
                      run.review.status === "rejected" ? "rejected" : "pending"
                    }
                  />
                  {criticalCount > 0 && (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                      style={{
                        background: "color-mix(in srgb, var(--color-ps-sev-critical) 15%, transparent)",
                        color: "var(--color-ps-sev-critical)",
                      }}
                    >
                      {criticalCount} critical
                    </span>
                  )}
                </div>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--color-ps-ink-ghost)" }}>
                  Run #{run.runNumber} · {new Date(run.createdAt).toLocaleDateString(undefined, {
                    month: "short", day: "numeric", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })} · {run.brief.tone} tone
                </p>
              </div>

              {onOpenRun && (
                <Button variant="ghost" size="sm" onClick={() => onOpenRun(run.id)}>
                  Open →
                </Button>
              )}
            </div>

            {/* Quick download row */}
            <div
              className="flex items-center gap-2 px-4 py-2.5 flex-wrap"
              style={{ background: "var(--color-ps-canvas)" }}
            >
              <span
                className="text-[10px] font-semibold uppercase tracking-widest mr-1 shrink-0"
                style={{ color: "var(--color-ps-ink-ghost)" }}
              >
                Quick download:
              </span>
              <Button
                variant="subtle"
                size="sm"
                onClick={() => downloadJson(`${slug}-blueprint.json`, run.blueprint)}
              >
                Blueprint JSON
              </Button>
              <Button
                variant="subtle"
                size="sm"
                onClick={() => downloadJson(`${slug}-audit.json`, run.auditReport)}
              >
                Audit Report
              </Button>
              <Button
                variant="subtle"
                size="sm"
                onClick={() => downloadJson(`${slug}-full-run.json`, run)}
              >
                Full Run JSON
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
