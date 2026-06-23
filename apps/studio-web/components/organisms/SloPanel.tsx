"use client";

import { useMemo } from "react";
import type { StudioRun } from "@/lib/types";
import { AnimatedNumber } from "@/components/atoms/AnimatedNumber";

interface SloPanelProps {
  runs: StudioRun[];
  passThreshold?: number;
}

/* ── Sparkline ────────────────────────────────────────────────────────── */

function Sparkline({ scores, threshold }: { scores: number[]; threshold: number }) {
  if (scores.length < 2) {
    return (
      <p className="py-4 text-center text-[11px]" style={{ color: "var(--color-ps-ink-ghost)" }}>
        Need ≥ 2 runs for a trend line.
      </p>
    );
  }

  const W = 320, H = 72, PAD = 10;
  const lo = Math.min(...scores, 0);
  const hi = Math.max(...scores, 100);
  const range = hi - lo || 1;

  const toXY = (s: number, i: number) => ({
    x: PAD + (i / (scores.length - 1)) * (W - PAD * 2),
    y: H - PAD - ((s - lo) / range) * (H - PAD * 2),
  });

  const pts = scores.map((s, i) => toXY(s, i));
  const polyPts = pts.map((p) => `${p.x},${p.y}`).join(" ");

  const areaClose = `L${pts[pts.length - 1].x},${H - PAD} L${pts[0].x},${H - PAD} Z`;
  const areaPath  = `M${pts.map((p) => `${p.x},${p.y}`).join(" L")} ${areaClose}`;

  const threshY = H - PAD - ((threshold - lo) / range) * (H - PAD * 2);
  const showThresh = threshY >= PAD && threshY <= H - PAD;

  const last = pts[pts.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      aria-label="Score trend sparkline"
      overflow="visible"
    >
      <defs>
        <linearGradient id="slo-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="var(--color-ps-accent)" stopOpacity={0.22} />
          <stop offset="100%" stopColor="var(--color-ps-accent)" stopOpacity={0}    />
        </linearGradient>
      </defs>

      {/* Threshold rule */}
      {showThresh && (
        <>
          <line
            x1={PAD} y1={threshY} x2={W - PAD} y2={threshY}
            stroke="var(--color-ps-warn)"
            strokeWidth={1}
            strokeDasharray="4 3"
            opacity={0.6}
          />
          <text
            x={W - PAD - 2}
            y={threshY - 3}
            textAnchor="end"
            fontSize={8}
            fill="var(--color-ps-warn)"
            opacity={0.8}
          >
            SLO {threshold}
          </text>
        </>
      )}

      {/* Area fill */}
      <path d={areaPath} fill="url(#slo-fill)" />

      {/* Line */}
      <polyline
        points={polyPts}
        fill="none"
        stroke="var(--color-ps-accent)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Dot at each data point */}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 3.5 : 2} fill="var(--color-ps-accent)" opacity={i === pts.length - 1 ? 1 : 0.5} />
      ))}

      {/* Last value label */}
      <text
        x={last.x}
        y={last.y - 7}
        textAnchor="middle"
        fontSize={9}
        fontWeight="700"
        fill="var(--color-ps-accent)"
      >
        {scores[scores.length - 1]}
      </text>
    </svg>
  );
}

/* ── Mini stacked bar chart ───────────────────────────────────────────── */

function CriticalBars({ data }: { data: { critical: number; high: number }[] }) {
  const maxTotal = Math.max(...data.map((d) => d.critical + d.high), 1);
  const W = 320, H = 52, barWidth = Math.max(6, (W - 20) / data.length - 3);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} aria-label="Critical and high findings per run">
      {data.map((d, i) => {
        const total   = d.critical + d.high;
        const barH    = Math.max((total / maxTotal) * (H - 12), total > 0 ? 2 : 0);
        const x       = 10 + i * ((W - 20) / data.length);
        const critH   = (d.critical / maxTotal) * (H - 12);
        const highH   = Math.max(barH - critH, d.high > 0 ? 1 : 0);
        return (
          <g key={i}>
            {/* High (bottom of stack) */}
            {highH > 0 && (
              <rect
                x={x}
                y={H - 4 - barH + critH}
                width={barWidth}
                height={highH}
                fill="var(--color-ps-sev-high)"
                rx={1}
                opacity={0.75}
              />
            )}
            {/* Critical (top of stack) */}
            {critH > 0 && (
              <rect
                x={x}
                y={H - 4 - barH}
                width={barWidth}
                height={critH}
                fill="var(--color-ps-sev-critical)"
                rx={1}
              />
            )}
            {/* Zero state */}
            {total === 0 && (
              <rect
                x={x}
                y={H - 6}
                width={barWidth}
                height={2}
                fill="var(--color-ps-border)"
                rx={1}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ── Category bar ─────────────────────────────────────────────────────── */

function CatBar({ label, score }: { label: string; score: number }) {
  const color = score >= 70 ? "var(--color-ps-ok)" : score >= 50 ? "var(--color-ps-warn)" : "var(--color-ps-err)";
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-[11px] capitalize shrink-0" style={{ color: "var(--color-ps-ink-dim)" }}>
        {label}
      </span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-ps-raised)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="w-7 text-right text-[11px] font-mono shrink-0" style={{ color: "var(--color-ps-ink)" }}>
        {score}
      </span>
    </div>
  );
}

/* ── KPI card ─────────────────────────────────────────────────────────── */

function KpiCard({ label, value, suffix, color }: { label: string; value: number; suffix: string; color: string }) {
  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-1"
      style={{ background: "var(--color-ps-surface)", borderColor: "var(--color-ps-border)" }}
    >
      <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-ps-ink-ghost)" }}>
        {label}
      </span>
      <div className="flex items-baseline gap-0.5">
        <span className="text-2xl font-bold font-mono leading-none" style={{ color }}>
          <AnimatedNumber value={value} />
        </span>
        <span className="text-xs ml-0.5" style={{ color: "var(--color-ps-ink-ghost)" }}>{suffix}</span>
      </div>
    </div>
  );
}

/* ── Chart card ───────────────────────────────────────────────────────── */

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-2"
      style={{ background: "var(--color-ps-surface)", borderColor: "var(--color-ps-border)" }}
    >
      <div>
        <p className="text-[11px] font-semibold" style={{ color: "var(--color-ps-ink)" }}>{title}</p>
        {subtitle && (
          <p className="text-[10px] mt-0.5" style={{ color: "var(--color-ps-ink-ghost)" }}>{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

/* ── Main panel ───────────────────────────────────────────────────────── */

export function SloPanel({ runs, passThreshold = 70 }: SloPanelProps) {
  const stats = useMemo(() => {
    if (runs.length === 0) return null;

    // Chronological order for charts (oldest first)
    const chrono = [...runs].reverse();
    const scores = chrono.map((r) => r.auditReport.score);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const passCount = runs.filter((r) => r.auditReport.score >= passThreshold).length;
    const passRate = Math.round((passCount / runs.length) * 100);

    const catAvgs = {
      accessibility: Math.round(runs.reduce((a, r) => a + r.auditReport.categoryScores.accessibility, 0) / runs.length),
      readability:   Math.round(runs.reduce((a, r) => a + r.auditReport.categoryScores.readability,   0) / runs.length),
      performance:   Math.round(runs.reduce((a, r) => a + r.auditReport.categoryScores.performance,   0) / runs.length),
    };

    const worstCat = (Object.entries(catAvgs) as [string, number][]).sort((a, b) => a[1] - b[1])[0];

    const barData = chrono.map((r) => ({
      critical: r.auditReport.findings.filter((f) => f.severity === "critical").length,
      high:     r.auditReport.findings.filter((f) => f.severity === "high").length,
    }));

    const trend = scores.length >= 2 ? scores[scores.length - 1] - scores[0] : 0;

    return { scores, avgScore, passRate, catAvgs, worstCat, barData, trend };
  }, [runs, passThreshold]);

  if (runs.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-24 text-center gap-3"
        style={{ color: "var(--color-ps-ink-ghost)" }}
      >
        <span className="text-4xl" aria-hidden="true">◈</span>
        <p className="text-sm font-medium" style={{ color: "var(--color-ps-ink-dim)" }}>
          No runs to monitor yet.
        </p>
        <p className="text-xs max-w-xs">
          SLO metrics appear once you have at least one completed audit run.
        </p>
      </div>
    );
  }

  const s = stats!;

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      {/* Title */}
      <div>
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-ps-ink)" }}>
          SLO Monitor
        </h2>
        <p className="text-[11px] mt-0.5" style={{ color: "var(--color-ps-ink-ghost)" }}>
          Quality health across {runs.length} run{runs.length !== 1 ? "s" : ""}. Pass
          threshold: {passThreshold}/100.
          {s.trend !== 0 && (
            <span
              className="ml-2 font-semibold"
              style={{ color: s.trend > 0 ? "var(--color-ps-ok)" : "var(--color-ps-err)" }}
            >
              {s.trend > 0 ? "▲" : "▼"} {Math.abs(s.trend)} pts trend
            </span>
          )}
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard
          label="Avg Score"
          value={s.avgScore}
          suffix="/100"
          color={s.avgScore >= passThreshold ? "var(--color-ps-ok)" : "var(--color-ps-warn)"}
        />
        <KpiCard
          label="Pass Rate"
          value={s.passRate}
          suffix="%"
          color={s.passRate >= 75 ? "var(--color-ps-ok)" : s.passRate >= 50 ? "var(--color-ps-warn)" : "var(--color-ps-err)"}
        />
        <KpiCard
          label="Total Runs"
          value={runs.length}
          suffix=""
          color="var(--color-ps-accent)"
        />
      </div>

      {/* Score trend sparkline */}
      <ChartCard
        title="Score Trend"
        subtitle="Chronological — dashed line = pass threshold"
      >
        <Sparkline scores={s.scores} threshold={passThreshold} />
      </ChartCard>

      {/* Critical/high findings bar */}
      <ChartCard
        title="Critical & High Findings Per Run"
        subtitle="Red = critical  ·  Orange = high  ·  Left = oldest"
      >
        <CriticalBars data={s.barData} />
      </ChartCard>

      {/* Category averages */}
      <ChartCard title="Category Averages">
        <div className="flex flex-col gap-2.5 pt-1">
          {(Object.entries(s.catAvgs) as [string, number][]).map(([cat, avg]) => (
            <CatBar key={cat} label={cat} score={avg} />
          ))}
        </div>
        {s.worstCat && (
          <p className="mt-3 text-[10px]" style={{ color: "var(--color-ps-ink-ghost)" }}>
            ↳ Weakest category:{" "}
            <span className="capitalize font-semibold" style={{ color: "var(--color-ps-err)" }}>
              {s.worstCat[0]}
            </span>{" "}
            (avg {s.worstCat[1]}/100) — focus improvement here first.
          </p>
        )}
      </ChartCard>
    </div>
  );
}
