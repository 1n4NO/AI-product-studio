"use client";

import { useState } from "react";
import type { StudioRun } from "@/lib/types";
import { ScoreRing } from "@/components/atoms/ScoreRing";
import { Badge } from "@/components/atoms/Badge";
import { CategoryBar } from "@/components/molecules/CategoryBar";
import { cn } from "@/lib/cn";

interface ComparePanelProps {
  runs: StudioRun[];
}

type FindingSeverity = "critical" | "high" | "medium" | "low";

const SEV_COLORS: Record<FindingSeverity, string> = {
  critical: "var(--color-ps-sev-critical)",
  high:     "var(--color-ps-sev-high)",
  medium:   "var(--color-ps-sev-medium)",
  low:      "var(--color-ps-sev-low)",
};

function DeltaBadge({ a, b, invert = false }: { a: number; b: number; invert?: boolean }) {
  const delta = b - a;
  if (delta === 0) return <span style={{ color: "var(--color-ps-ink-ghost)" }} className="text-xs font-mono">—</span>;
  const positive = invert ? delta < 0 : delta > 0;
  return (
    <span
      className="text-xs font-mono font-semibold"
      style={{ color: positive ? "var(--color-ps-ok)" : "var(--color-ps-err)" }}
    >
      {delta > 0 ? "▲" : "▼"}{Math.abs(delta)}
    </span>
  );
}

function RunSelector({
  label,
  runs,
  selectedId,
  onSelect,
}: {
  label: string;
  runs: StudioRun[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 flex-1">
      <label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-ps-ink-ghost)" }}>
        {label}
      </label>
      <select
        value={selectedId}
        onChange={(e) => onSelect(e.target.value)}
        className="rounded-lg px-3 py-2 text-sm outline-none appearance-none"
        style={{
          background:  "var(--color-ps-raised)",
          border:      "1px solid var(--color-ps-border)",
          color:       "var(--color-ps-ink)",
          cursor:      "pointer",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-ps-accent)")}
        onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--color-ps-border)")}
      >
        <option value="">Select run…</option>
        {runs.map((r) => (
          <option key={r.id} value={r.id}>
            Run #{r.runNumber} · {r.brief.productName} · {r.auditReport.score}/100
          </option>
        ))}
      </select>
    </div>
  );
}

function RunColumn({ run, label }: { run: StudioRun; label: string }) {
  const report = run.auditReport;
  const sevCounts = (["critical", "high", "medium", "low"] as FindingSeverity[]).map((sev) => ({
    sev,
    count: report.findings.filter((f) => f.severity === sev).length,
  }));

  return (
    <div className="flex flex-col gap-5 flex-1">
      {/* Header */}
      <div
        className="rounded-xl border p-4 flex flex-col items-center gap-3"
        style={{ background: "var(--color-ps-surface)", borderColor: "var(--color-ps-border)" }}
      >
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-ps-ink-ghost)" }}>
          {label}
        </span>
        <ScoreRing score={report.score} size={90} />
        <div className="text-center">
          <p className="text-xs font-medium" style={{ color: "var(--color-ps-ink)" }}>
            Run #{run.runNumber} · {run.brief.productName}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--color-ps-ink-ghost)" }}>
            {new Date(run.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <Badge variant={
          run.review.status === "approved" ? "approved" :
          run.review.status === "rejected" ? "rejected" : "pending"
        } />
      </div>

      {/* Category scores */}
      <div
        className="rounded-xl border p-4 flex flex-col gap-3"
        style={{ background: "var(--color-ps-surface)", borderColor: "var(--color-ps-border)" }}
      >
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-ps-ink-ghost)" }}>
          Category Scores
        </span>
        <CategoryBar category="accessibility" score={report.categoryScores.accessibility} />
        <CategoryBar category="readability"   score={report.categoryScores.readability}   />
        <CategoryBar category="performance"   score={report.categoryScores.performance}   />
      </div>

      {/* Severity counts */}
      <div
        className="rounded-xl border p-4 flex flex-col gap-2"
        style={{ background: "var(--color-ps-surface)", borderColor: "var(--color-ps-border)" }}
      >
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-ps-ink-ghost)" }}>
          Findings
        </span>
        {sevCounts.map(({ sev, count }) => (
          <div key={sev} className="flex items-center justify-between">
            <span className="text-xs capitalize" style={{ color: "var(--color-ps-ink-dim)" }}>{sev}</span>
            <span
              className="text-xs font-mono font-semibold"
              style={{ color: count > 0 ? SEV_COLORS[sev] : "var(--color-ps-ink-ghost)" }}
            >
              {count}
            </span>
          </div>
        ))}
      </div>

      {/* Tone */}
      <div
        className="rounded-xl border px-4 py-3 flex items-center justify-between"
        style={{ background: "var(--color-ps-surface)", borderColor: "var(--color-ps-border)" }}
      >
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-ps-ink-ghost)" }}>Tone</span>
        <span className="text-xs capitalize font-medium" style={{ color: "var(--color-ps-ink)" }}>{run.brief.tone}</span>
      </div>
    </div>
  );
}

function DeltaColumn({ a, b }: { a: StudioRun; b: StudioRun }) {
  const ra = a.auditReport;
  const rb = b.auditReport;
  const sevs = ["critical", "high", "medium", "low"] as FindingSeverity[];

  return (
    <div className="flex flex-col gap-5 w-20 shrink-0">
      {/* Score delta */}
      <div
        className="rounded-xl border p-4 flex flex-col items-center justify-center gap-2"
        style={{ background: "var(--color-ps-surface)", borderColor: "var(--color-ps-border)", minHeight: 210 }}
      >
        <span className="text-[9px] font-semibold uppercase tracking-widest text-center" style={{ color: "var(--color-ps-ink-ghost)" }}>
          Δ Score
        </span>
        <DeltaBadge a={ra.score} b={rb.score} />
      </div>

      {/* Category deltas */}
      <div
        className="rounded-xl border p-4 flex flex-col justify-around gap-3"
        style={{ background: "var(--color-ps-surface)", borderColor: "var(--color-ps-border)" }}
      >
        <span className="text-[9px] font-semibold uppercase tracking-widest text-center" style={{ color: "var(--color-ps-ink-ghost)" }}>
          Δ Cat.
        </span>
        <div className="flex items-center justify-center">
          <DeltaBadge a={ra.categoryScores.accessibility} b={rb.categoryScores.accessibility} />
        </div>
        <div className="flex items-center justify-center">
          <DeltaBadge a={ra.categoryScores.readability} b={rb.categoryScores.readability} />
        </div>
        <div className="flex items-center justify-center">
          <DeltaBadge a={ra.categoryScores.performance} b={rb.categoryScores.performance} />
        </div>
      </div>

      {/* Finding deltas */}
      <div
        className="rounded-xl border p-4 flex flex-col gap-2"
        style={{ background: "var(--color-ps-surface)", borderColor: "var(--color-ps-border)" }}
      >
        <span className="text-[9px] font-semibold uppercase tracking-widest text-center" style={{ color: "var(--color-ps-ink-ghost)" }}>
          Δ
        </span>
        {sevs.map((sev) => {
          const countA = ra.findings.filter((f) => f.severity === sev).length;
          const countB = rb.findings.filter((f) => f.severity === sev).length;
          return (
            <div key={sev} className="flex justify-center">
              <DeltaBadge a={countA} b={countB} invert />
            </div>
          );
        })}
      </div>

      {/* Spacer to match tone row */}
      <div className="h-[46px]" />
    </div>
  );
}

export function ComparePanel({ runs }: ComparePanelProps) {
  const [idA, setIdA] = useState(runs[1]?.id ?? "");
  const [idB, setIdB] = useState(runs[0]?.id ?? "");

  const runA = runs.find((r) => r.id === idA) ?? null;
  const runB = runs.find((r) => r.id === idB) ?? null;

  if (runs.length < 2) {
    return (
      <div
        className="flex flex-col items-center justify-center py-24 text-center gap-3"
        style={{ color: "var(--color-ps-ink-ghost)" }}
      >
        <span className="text-4xl">⚖</span>
        <p className="text-sm font-medium" style={{ color: "var(--color-ps-ink-dim)" }}>
          You need at least 2 runs to compare.
        </p>
        <p className="text-xs max-w-xs">
          Generate a run, make changes to your brief, then generate again to see a diff.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Run selectors */}
      <div className="flex gap-4 items-end">
        <RunSelector label="Baseline (A)" runs={runs} selectedId={idA} onSelect={setIdA} />
        <span className="pb-2 font-mono text-sm" style={{ color: "var(--color-ps-ink-ghost)" }}>vs</span>
        <RunSelector label="Candidate (B)" runs={runs} selectedId={idB} onSelect={setIdB} />
      </div>

      {/* Comparison grid */}
      {runA && runB ? (
        runA.id === runB.id ? (
          <div
            className="rounded-xl border p-8 text-center text-sm"
            style={{ borderColor: "var(--color-ps-border)", color: "var(--color-ps-ink-ghost)" }}
          >
            Select two different runs to compare.
          </div>
        ) : (
          <div className="flex gap-4 items-start">
            <RunColumn run={runA} label="Baseline A" />
            <DeltaColumn a={runA} b={runB} />
            <RunColumn run={runB} label="Candidate B" />
          </div>
        )
      ) : (
        <div
          className="rounded-xl border p-8 text-center text-sm"
          style={{ borderColor: "var(--color-ps-border)", color: "var(--color-ps-ink-ghost)" }}
        >
          Select both runs above to start comparing.
        </div>
      )}
    </div>
  );
}
