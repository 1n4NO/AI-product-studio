"use client";

import { useState, useMemo } from "react";
import type { AuditReport, AuditFinding } from "@/lib/types";
import { ScoreRing } from "@/components/atoms/ScoreRing";
import { CategoryBar } from "@/components/molecules/CategoryBar";
import { FindingCard } from "@/components/molecules/FindingCard";
import { cn } from "@/lib/cn";

interface AuditPanelProps {
  auditReport:  AuditReport | null;
  onAutoFix?:   (finding: AuditFinding) => void;
  isGenerating?: boolean;
}

type Severity = AuditFinding["severity"];
type Category = "accessibility" | "readability" | "performance";

const ALL_SEVERITIES: Severity[]  = ["critical", "high", "medium", "low"];
const ALL_CATEGORIES: Category[]  = ["accessibility", "readability", "performance"];

const SEV_COLORS: Record<Severity, string> = {
  critical: "var(--color-ps-sev-critical)",
  high:     "var(--color-ps-sev-high)",
  medium:   "var(--color-ps-sev-medium)",
  low:      "var(--color-ps-sev-low)",
};

const SEV_BG: Record<Severity, string> = {
  critical: "color-mix(in srgb, var(--color-ps-sev-critical) 15%, transparent)",
  high:     "color-mix(in srgb, var(--color-ps-sev-high)     15%, transparent)",
  medium:   "color-mix(in srgb, var(--color-ps-sev-medium)   15%, transparent)",
  low:      "color-mix(in srgb, var(--color-ps-sev-low)      15%, transparent)",
};

const CAT_LABEL: Record<Category, string> = {
  accessibility: "A11y",
  readability:   "Read",
  performance:   "Perf",
};

/* ── Skeleton loading state ────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="grid grid-cols-[240px_1fr] gap-5">
      <div
        className="rounded-xl border p-5 animate-pulse"
        style={{ borderColor: "var(--color-ps-border)", background: "var(--color-ps-surface)" }}
      >
        <div className="w-28 h-28 rounded-full mx-auto mb-6" style={{ background: "var(--color-ps-raised)" }} />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3 items-center mb-3">
            <div className="h-2 flex-1 rounded" style={{ background: "var(--color-ps-raised)" }} />
            <div className="w-6 h-3 rounded"    style={{ background: "var(--color-ps-raised)" }} />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 rounded-xl border animate-pulse"
            style={{ background: "var(--color-ps-surface)", borderColor: "var(--color-ps-border)" }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Filter chip ───────────────────────────────────────────────────────── */
function FilterChip({
  label,
  active,
  color,
  bg,
  onClick,
}: {
  label:   string;
  active:  boolean;
  color:   string;
  bg?:     string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all"
      style={{
        background:  active ? (bg ?? "var(--color-ps-raised)") : "transparent",
        color:       active ? color : "var(--color-ps-ink-ghost)",
        border:      `1px solid ${active ? color : "var(--color-ps-border)"}`,
      }}
    >
      {label}
    </button>
  );
}

/* ── Main panel ────────────────────────────────────────────────────────── */
export function AuditPanel({ auditReport, onAutoFix, isGenerating }: AuditPanelProps) {
  /* Filter state */
  const [severities, setSeverities] = useState<Set<Severity>>(new Set());
  const [categories, setCategories] = useState<Set<Category>>(new Set());
  const [query, setQuery]           = useState("");

  if (isGenerating) return <Skeleton />;

  if (!auditReport) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-5 border"
          style={{
            background:  "linear-gradient(135deg, var(--color-ps-surface), var(--color-ps-accent-tint))",
            borderColor: "var(--color-ps-border)",
          }}
        >
          ◎
        </div>
        <p className="text-[15px] font-semibold mb-2" style={{ color: "var(--color-ps-ink)" }}>
          No audit yet
        </p>
        <p className="text-[13px] max-w-xs" style={{ color: "var(--color-ps-ink-ghost)" }}>
          Generate a run to see UX audit scores and findings.
        </p>
      </div>
    );
  }

  /* ── Helpers ── */
  function toggleSev(s: Severity) {
    setSeverities((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  }

  function toggleCat(c: Category) {
    setCategories((prev) => {
      const next = new Set(prev);
      next.has(c) ? next.delete(c) : next.add(c);
      return next;
    });
  }

  const hasFilters = severities.size > 0 || categories.size > 0 || query.trim() !== "";

  function clearFilters() {
    setSeverities(new Set());
    setCategories(new Set());
    setQuery("");
  }

  /* ── Filtered findings ── */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return auditReport.findings.filter((f) => {
      if (severities.size > 0 && !severities.has(f.severity)) return false;
      if (categories.size > 0) {
        // Map finding category field (if present) or derive from ruleId/description
        const cat = (f as AuditFinding & { category?: string }).category as Category | undefined;
        if (cat && !categories.has(cat)) return false;
      }
      if (q && !f.title.toLowerCase().includes(q) && !f.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [auditReport.findings, severities, categories, query]);

  /* Group filtered findings by severity */
  const grouped = ALL_SEVERITIES.reduce<Record<Severity, AuditFinding[]>>(
    (acc, sev) => { acc[sev] = filtered.filter((f) => f.severity === sev); return acc; },
    { critical: [], high: [], medium: [], low: [] }
  );

  const activeFilterCount = severities.size + categories.size + (query.trim() ? 1 : 0);

  return (
    <div className="flex flex-col gap-4">

      {/* ── Filter bar ── */}
      <div
        className="flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-xl border"
        style={{ background: "var(--color-ps-surface)", borderColor: "var(--color-ps-border)" }}
      >
        {/* Search */}
        <div className="relative flex-1 min-w-[140px]">
          <span
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] pointer-events-none"
            style={{ color: "var(--color-ps-ink-ghost)" }}
            aria-hidden="true"
          >
            ⌕
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search findings…"
            className="w-full pl-6 pr-3 py-1 rounded-lg text-[11px] outline-none bg-transparent"
            style={{
              background:  "var(--color-ps-raised)",
              border:      "1px solid var(--color-ps-border)",
              color:       "var(--color-ps-ink)",
            }}
            onFocus={(e)  => (e.currentTarget.style.borderColor = "var(--color-ps-accent)")}
            onBlur={(e)   => (e.currentTarget.style.borderColor = "var(--color-ps-border)")}
          />
        </div>

        {/* Severity chips */}
        <div className="flex items-center gap-1.5">
          {ALL_SEVERITIES.map((s) => (
            <FilterChip
              key={s}
              label={s.charAt(0).toUpperCase() + s.slice(1)}
              active={severities.has(s)}
              color={SEV_COLORS[s]}
              bg={SEV_BG[s]}
              onClick={() => toggleSev(s)}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-4 shrink-0" style={{ background: "var(--color-ps-border)" }} />

        {/* Category chips */}
        <div className="flex items-center gap-1.5">
          {ALL_CATEGORIES.map((c) => (
            <FilterChip
              key={c}
              label={CAT_LABEL[c]}
              active={categories.has(c)}
              color="var(--color-ps-accent-soft)"
              bg="var(--color-ps-accent-tint)"
              onClick={() => toggleCat(c)}
            />
          ))}
        </div>

        {/* Clear + count */}
        {hasFilters && (
          <>
            <button
              onClick={clearFilters}
              className="text-[10px] px-2 py-1 rounded-md transition-colors hover:bg-ps-raised"
              style={{ color: "var(--color-ps-ink-ghost)" }}
            >
              Clear
            </button>
            <span
              className="text-[10px] font-mono font-semibold"
              style={{ color: "var(--color-ps-ink-ghost)" }}
            >
              {filtered.length}/{auditReport.findings.length}
            </span>
          </>
        )}
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-[240px_1fr] gap-5 items-start">
        {/* Score card */}
        <aside
          className="rounded-xl border p-5 sticky top-0"
          style={{ background: "var(--color-ps-surface)", borderColor: "var(--color-ps-border)" }}
        >
          <div className="flex justify-center mb-5">
            <ScoreRing score={auditReport.score} size={120} />
          </div>

          <div className="flex flex-col gap-3 mb-5 pb-5 border-b" style={{ borderColor: "var(--color-ps-border)" }}>
            <CategoryBar category="accessibility" score={auditReport.categoryScores.accessibility} />
            <CategoryBar category="readability"   score={auditReport.categoryScores.readability}   />
            <CategoryBar category="performance"   score={auditReport.categoryScores.performance}   />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--color-ps-ink-ghost)" }}>
              Findings
            </p>
            {ALL_SEVERITIES.map((sev) => {
              const total    = auditReport.findings.filter((f) => f.severity === sev).length;
              const visible  = grouped[sev].length;
              if (total === 0) return null;
              return (
                <div key={sev} className="flex items-center justify-between">
                  <span className="text-[11px]" style={{ color: "var(--color-ps-ink-ghost)" }}>
                    {sev.charAt(0).toUpperCase() + sev.slice(1)}
                  </span>
                  <span className="text-[12px] font-bold font-mono tabular-nums" style={{ color: SEV_COLORS[sev] }}>
                    {hasFilters ? `${visible}/${total}` : total}
                  </span>
                </div>
              );
            })}
            {auditReport.findings.length === 0 && (
              <p className="text-[11px] font-medium" style={{ color: "var(--color-ps-ok)" }}>
                No findings — clean pass!
              </p>
            )}
          </div>
        </aside>

        {/* Findings list */}
        <main className="flex flex-col gap-5">
          {filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 rounded-xl border text-center"
              style={{ background: "var(--color-ps-surface)", borderColor: "var(--color-ps-border)" }}
            >
              {auditReport.findings.length === 0 ? (
                <>
                  <span className="text-3xl mb-3">✓</span>
                  <p className="text-[14px] font-semibold mb-1" style={{ color: "var(--color-ps-ok)" }}>
                    All checks passed
                  </p>
                  <p className="text-[12px]" style={{ color: "var(--color-ps-ink-ghost)" }}>
                    No UX issues detected in this run.
                  </p>
                </>
              ) : (
                <>
                  <span className="text-3xl mb-3" style={{ color: "var(--color-ps-ink-ghost)" }}>⊘</span>
                  <p className="text-[13px] font-medium mb-1" style={{ color: "var(--color-ps-ink-dim)" }}>
                    No findings match your filters
                  </p>
                  <button
                    onClick={clearFilters}
                    className="text-[11px] mt-2 underline"
                    style={{ color: "var(--color-ps-accent-soft)" }}
                  >
                    Clear filters
                  </button>
                </>
              )}
            </div>
          ) : (
            ALL_SEVERITIES.map((sev) => {
              const findings = grouped[sev];
              if (findings.length === 0) return null;
              return (
                <section key={sev}>
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: SEV_COLORS[sev] }}
                    />
                    <h3
                      className="text-[11px] font-bold uppercase tracking-widest"
                      style={{ color: SEV_COLORS[sev] }}
                    >
                      {sev.charAt(0).toUpperCase() + sev.slice(1)}
                    </h3>
                    <span className="text-[10px] font-mono" style={{ color: "var(--color-ps-ink-ghost)" }}>
                      {findings.length}
                    </span>
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
    </div>
  );
}
