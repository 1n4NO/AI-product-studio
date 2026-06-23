"use client";

import { useEffect, useState } from "react";
import type { ThemeTokens, Tone, Brief } from "@product-studio/shared-types";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/cn";

interface ThemePanelProps {
  brief: Brief;
  selectedTheme: ThemeTokens | null;
  onSelectTheme: (theme: ThemeTokens) => void;
}

interface ColorSwatch {
  label: string;
  key: keyof ThemeTokens["colors"] | string;
}

const SWATCHES: ColorSwatch[] = [
  { label: "Primary",    key: "primary" },
  { label: "Secondary",  key: "secondary" },
  { label: "Background", key: "background" },
  { label: "Surface",    key: "surface" },
  { label: "Accent",     key: "accent" },
];

function ThemeCard({
  theme,
  isSelected,
  onSelect,
}: {
  theme: ThemeTokens;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const bg      = theme.colors.background ?? "#0c0c0f";
  const surface = theme.colors.surface    ?? "#0f0f14";
  const text    = theme.colors.text       ?? "#e2e2f0";
  const primary = theme.colors.primary    ?? "#7c3aed";
  const border  = theme.colors.border     ?? "#1e1e26";

  return (
    <button
      onClick={onSelect}
      className={cn(
        "group relative w-full rounded-xl border-2 text-left transition-all outline-none",
        "focus-visible:ring-2 focus-visible:ring-offset-2",
        isSelected ? "ring-2" : "hover:border-opacity-80"
      )}
      style={{
        borderColor: isSelected ? primary : border,
        boxShadow: isSelected ? `0 0 0 1px ${primary}40, 0 4px 20px ${primary}20` : undefined,
      }}
      aria-pressed={isSelected}
    >
      {/* Preview canvas */}
      <div
        className="rounded-t-[10px] p-4 overflow-hidden"
        style={{ background: bg }}
      >
        {/* Mock nav bar */}
        <div
          className="flex items-center justify-between mb-4 px-3 py-2 rounded-lg"
          style={{ background: surface, border: `1px solid ${border}` }}
        >
          <div className="w-16 h-2 rounded" style={{ background: primary, opacity: 0.8 }} />
          <div className="flex gap-1.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-8 h-1.5 rounded" style={{ background: text, opacity: 0.2 }} />
            ))}
          </div>
        </div>

        {/* Mock hero area */}
        <div className="mb-3 px-2">
          <div className="h-3 w-3/4 rounded mb-2" style={{ background: text, opacity: 0.8 }} />
          <div className="h-2 w-full rounded mb-1" style={{ background: text, opacity: 0.35 }} />
          <div className="h-2 w-2/3 rounded mb-3" style={{ background: text, opacity: 0.35 }} />
          <div
            className="inline-flex px-3 py-1.5 rounded text-xs font-semibold"
            style={{
              background: primary,
              color: text,
              borderRadius: theme.radii.md,
            }}
          >
            CTA Button
          </div>
        </div>

        {/* Color swatches */}
        <div className="flex gap-1 mt-3">
          {SWATCHES.map((s) => (
            <div
              key={s.key}
              className="flex-1 h-3 rounded-sm"
              style={{
                background: theme.colors[s.key] ?? "#888",
                border: `1px solid ${border}`,
              }}
              title={`${s.label}: ${theme.colors[s.key] ?? "-"}`}
            />
          ))}
        </div>
      </div>

      {/* Card footer */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-b-[10px]"
        style={{ background: "var(--color-ps-raised)", borderTop: `1px solid var(--color-ps-border)` }}
      >
        <span className="text-sm font-medium" style={{ color: "var(--color-ps-ink)" }}>
          {theme.name}
        </span>
        {isSelected && (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{
              background: "var(--color-ps-accent-tint)",
              color: "var(--color-ps-accent-soft)",
            }}
          >
            Selected
          </span>
        )}
      </div>
    </button>
  );
}

export function ThemePanel({ brief, selectedTheme, onSelectTheme }: ThemePanelProps) {
  const [variants, setVariants] = useState<ThemeTokens[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tone, setTone] = useState<Tone>(brief.tone);

  async function loadVariants(t: Tone) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/protected/generate/theme", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tone: t,
          productName: brief.productName,
          brief: brief.valueProposition,
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "(no body)");
        throw new Error(`HTTP ${res.status}: ${body}`);
      }
      const data: ThemeTokens[] = await res.json();
      setVariants(data);
      // Auto-select first if nothing selected
      if (!selectedTheme && data[0]) onSelectTheme(data[0]);
    } catch (err) {
      console.error("[ThemePanel] Failed to load theme variants:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    setTone(brief.tone);
    loadVariants(brief.tone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brief.tone, brief.productName]);

  const tones: Tone[] = ["bold", "professional", "friendly", "playful", "minimal"];

  return (
    <div className="flex flex-col gap-6">
      {/* Tone switcher */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-ps-ink-ghost)" }}>
          Explore tone
        </p>
        <div className="flex flex-wrap gap-2">
          {tones.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTone(t);
                loadVariants(t);
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors border",
                tone === t ? "border-transparent" : "border-transparent"
              )}
              style={{
                background: tone === t ? "var(--color-ps-accent)" : "var(--color-ps-raised)",
                color: tone === t ? "#fff" : "var(--color-ps-ink-dim)",
                border: `1px solid ${tone === t ? "var(--color-ps-accent)" : "var(--color-ps-border)"}`,
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Theme variant cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-48 rounded-xl animate-pulse"
              style={{ background: "var(--color-ps-raised)" }}
            />
          ))}
        </div>
      ) : variants.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {variants.map((v) => (
            <ThemeCard
              key={v.name}
              theme={v}
              isSelected={selectedTheme?.name === v.name}
              onSelect={() => onSelectTheme(v)}
            />
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center h-40 rounded-xl border border-dashed gap-3"
          style={{ borderColor: "var(--color-ps-border)", color: "var(--color-ps-ink-ghost)" }}
        >
          <span className="text-sm">No themes loaded</span>
          <Button variant="ghost" size="sm" onClick={() => loadVariants(tone)}>
            Try again
          </Button>
        </div>
      )}

      {/* Selected theme token preview */}
      {selectedTheme && (
        <details className="group">
          <summary
            className="cursor-pointer text-xs font-semibold uppercase tracking-widest select-none"
            style={{ color: "var(--color-ps-ink-ghost)" }}
          >
            Design tokens ▸ {selectedTheme.name}
          </summary>
          <div
            className="mt-3 rounded-lg p-4 text-xs font-mono overflow-auto"
            style={{ background: "var(--color-ps-raised)", color: "var(--color-ps-ink-dim)", maxHeight: "220px" }}
          >
            {Object.entries(selectedTheme.colors).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2 mb-0.5">
                <span
                  className="inline-block w-3 h-3 rounded-sm border"
                  style={{ background: v, borderColor: "var(--color-ps-border)" }}
                />
                <span style={{ color: "var(--color-ps-ink-ghost)" }}>{k}:</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
