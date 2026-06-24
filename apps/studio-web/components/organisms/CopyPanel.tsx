"use client";

import { useEffect, useRef, useState } from "react";
import type { Brief, PageBlueprint } from "@product-studio/shared-types";
import type { PageCopy, SectionCopy } from "@/app/api/protected/generate/copy/route";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/cn";
import type { ProviderConfig } from "@/lib/providers";

interface CopyPanelProps {
  brief: Brief;
  blueprint: PageBlueprint | null;
  providerConfig?: ProviderConfig | null;
}

const SECTION_TYPE_LABELS: Record<string, string> = {
  hero: "Hero",
  problem: "Problem",
  solution: "Solution",
  features: "Features",
  "social-proof": "Social Proof",
  faq: "FAQ",
  cta: "CTA",
};

/* ─── Editable field ────────────────────────── */

function EditableField({
  label,
  value,
  multiline = false,
  onChange,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  onChange: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: "var(--color-ps-ink-ghost)" }}
      >
        {label}
      </span>
      {editing ? (
        multiline ? (
          <textarea
            ref={ref as React.RefObject<HTMLTextAreaElement>}
            value={value}
            rows={3}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setEditing(false)}
            className="w-full rounded px-2 py-1.5 text-sm resize-none outline-none"
            style={{
              background: "var(--color-ps-canvas)",
              border: "1px solid var(--color-ps-accent)",
              color: "var(--color-ps-ink)",
            }}
          />
        ) : (
          <input
            ref={ref as React.RefObject<HTMLInputElement>}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setEditing(false)}
            className="w-full rounded px-2 py-1.5 text-sm outline-none"
            style={{
              background: "var(--color-ps-canvas)",
              border: "1px solid var(--color-ps-accent)",
              color: "var(--color-ps-ink)",
            }}
          />
        )
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="group text-left rounded px-2 py-1.5 text-sm w-full transition-colors"
          style={{ color: "var(--color-ps-ink)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-ps-raised)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          title="Click to edit"
        >
          {value || <span style={{ color: "var(--color-ps-ink-ghost)" }}>—</span>}
          <span
            className="ml-1.5 opacity-0 group-hover:opacity-100 text-[10px] transition-opacity"
            style={{ color: "var(--color-ps-ink-ghost)" }}
          >
            ✎
          </span>
        </button>
      )}
    </div>
  );
}

/* ─── Copy card per section ─────────────────── */

function CopyCard({
  section,
  onChange,
}: {
  section: SectionCopy;
  onChange: (updated: SectionCopy) => void;
}) {
  const [copied, setCopied] = useState(false);

  function update(key: keyof SectionCopy, value: string | null) {
    onChange({ ...section, [key]: value });
  }

  async function handleCopyAll() {
    const text = [
      section.headline,
      section.subheadline,
      "",
      section.body,
      section.cta ? `CTA: ${section.cta}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div
      className="rounded-xl border flex flex-col gap-4 p-5 transition-colors"
      style={{
        background: "var(--color-ps-surface)",
        borderColor: "var(--color-ps-border)",
      }}
    >
      {/* Card header */}
      <div className="flex items-center justify-between">
        <span
          className="text-[11px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded"
          style={{
            background: "var(--color-ps-accent-tint)",
            color: "var(--color-ps-accent-soft)",
          }}
        >
          {SECTION_TYPE_LABELS[section.sectionId] ?? section.sectionId}
        </span>
        <button
          onClick={handleCopyAll}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-colors"
          style={{
            background: copied ? "var(--color-ps-ok)" : "var(--color-ps-raised)",
            color: copied ? "#fff" : "var(--color-ps-ink-dim)",
            border: `1px solid ${copied ? "var(--color-ps-ok)" : "var(--color-ps-border)"}`,
          }}
        >
          {copied ? "✓ Copied" : "Copy all"}
        </button>
      </div>

      {/* Fields */}
      <EditableField
        label="Headline"
        value={section.headline}
        onChange={(v) => update("headline", v)}
      />
      <EditableField
        label="Subheadline"
        value={section.subheadline}
        onChange={(v) => update("subheadline", v)}
      />
      <EditableField
        label="Body"
        value={section.body}
        multiline
        onChange={(v) => update("body", v)}
      />
      {section.cta !== null && (
        <EditableField
          label="CTA"
          value={section.cta ?? ""}
          onChange={(v) => update("cta", v)}
        />
      )}
    </div>
  );
}

/* ─── CopyPanel ─────────────────────────────── */

export function CopyPanel({ brief, blueprint, providerConfig }: CopyPanelProps) {
  const [pageCopy, setPageCopy] = useState<PageCopy | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [allCopied, setAllCopied] = useState(false);

  async function loadCopy() {
    if (!blueprint) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/protected/generate/copy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          brief,
          blueprint,
          ...(providerConfig && providerConfig.provider !== "auto" && {
            _provider: providerConfig.provider,
            _apiKey:   providerConfig.apiKey,
            _model:    providerConfig.model,
          }),
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "(no body)");
        throw new Error(`HTTP ${res.status}: ${body}`);
      }
      const data: PageCopy = await res.json();
      setPageCopy(data);
    } catch (err) {
      console.error("[CopyPanel] Failed to load copy:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCopy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blueprint?.title]);

  function updateSection(updated: SectionCopy) {
    setPageCopy((prev) =>
      prev
        ? {
            ...prev,
            sections: prev.sections.map((s) =>
              s.sectionId === updated.sectionId ? updated : s
            ),
          }
        : prev
    );
  }

  async function handleCopyAll() {
    if (!pageCopy) return;
    const lines: string[] = [];
    for (const s of pageCopy.sections) {
      lines.push(`## ${SECTION_TYPE_LABELS[s.sectionId] ?? s.sectionId}`);
      lines.push(`Headline: ${s.headline}`);
      if (s.subheadline) lines.push(`Subheadline: ${s.subheadline}`);
      lines.push(`Body: ${s.body}`);
      if (s.cta) lines.push(`CTA: ${s.cta}`);
      lines.push("");
    }
    await navigator.clipboard.writeText(lines.join("\n"));
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 1800);
  }

  if (!blueprint) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 text-center"
        style={{ color: "var(--color-ps-ink-ghost)" }}
      >
        <span className="text-3xl mb-3">✍</span>
        <p className="text-sm">Generate a blueprint first to produce copy.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-ps-ink-ghost)" }}>
            Landing Page Copy
          </span>
          <span className="text-sm mt-0.5" style={{ color: "var(--color-ps-ink-dim)" }}>
            Click any field to edit. Changes are local to this session.
          </span>
        </div>
        <div className="flex gap-2 shrink-0">
          {pageCopy && (
            <Button variant="ghost" size="sm" onClick={handleCopyAll}>
              {allCopied ? "✓ All copied" : "Copy all sections"}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={loadCopy} disabled={isLoading}>
            {isLoading ? "Generating…" : "↺ Regenerate"}
          </Button>
        </div>
      </div>

      {/* Copy cards */}
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: blueprint.sections.length }).map((_, i) => (
            <div
              key={i}
              className="h-36 rounded-xl animate-pulse"
              style={{ background: "var(--color-ps-raised)" }}
            />
          ))}
        </div>
      ) : pageCopy ? (
        <div className="flex flex-col gap-4">
          {pageCopy.sections.map((s) => (
            <CopyCard key={s.sectionId} section={s} onChange={updateSection} />
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed gap-3"
          style={{ borderColor: "var(--color-ps-border)", color: "var(--color-ps-ink-ghost)" }}
        >
          <span className="text-sm">Copy generation failed</span>
          <Button variant="ghost" size="sm" onClick={loadCopy}>Try again</Button>
        </div>
      )}
    </div>
  );
}
