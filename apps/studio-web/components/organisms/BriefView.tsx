"use client";

import type { Brief } from "@/lib/types";
import { FormField } from "@/components/molecules/FormField";
import { ToneSelector } from "@/components/molecules/ToneSelector";
import { ConstraintList } from "@/components/molecules/ConstraintTag";
import { cn } from "@/lib/cn";

interface BriefViewProps {
  brief: Brief;
  onChange: (brief: Brief) => void;
  isGenerating?: boolean;
}

const TONE_LABELS: Record<Brief["tone"], string> = {
  professional: "Professional",
  friendly: "Friendly",
  bold: "Bold",
  playful: "Playful",
  minimal: "Minimal",
};

export function BriefView({ brief, onChange, isGenerating }: BriefViewProps) {
  function set<K extends keyof Brief>(key: K, value: Brief[K]) {
    onChange({ ...brief, [key]: value });
  }

  return (
    <div className="grid grid-cols-[1fr_320px] gap-5 items-start">
      {/* ── Left: form ── */}
      <div className="flex flex-col gap-4">
        {/* Product section */}
        <section className="rounded-xl border border-ps-border bg-ps-surface p-5">
          <h2 className="text-[10px] font-semibold text-ps-ink-ghost uppercase tracking-widest mb-4">
            Product
          </h2>
          <div className="flex flex-col gap-4">
            <FormField
              id="product-name"
              label="Product Name"
              required
              value={brief.productName}
              onChange={(v) => set("productName", v)}
              placeholder="e.g. Acme Studio"
            />
            <FormField
              id="value-prop"
              label="Value Proposition"
              as="textarea"
              rows={3}
              value={brief.valueProposition}
              onChange={(v) => set("valueProposition", v)}
              placeholder="One sentence: what you do, for whom, and why it matters."
            />
            <FormField
              id="audience"
              label="Target Audience"
              value={brief.audience}
              onChange={(v) => set("audience", v)}
              placeholder="e.g. Startup founders launching SaaS products"
            />
          </div>
        </section>

        {/* Tone section */}
        <section className="rounded-xl border border-ps-border bg-ps-surface p-5">
          <h2 className="text-[10px] font-semibold text-ps-ink-ghost uppercase tracking-widest mb-3">
            Tone
          </h2>
          <p className="text-[11px] text-ps-ink-ghost mb-3">
            Sets the voice across all generated copy.
          </p>
          <ToneSelector
            value={brief.tone}
            onChange={(v) => set("tone", v)}
          />
        </section>

        {/* Constraints + CTA section */}
        <section className="rounded-xl border border-ps-border bg-ps-surface p-5">
          <h2 className="text-[10px] font-semibold text-ps-ink-ghost uppercase tracking-widest mb-3">
            Constraints & CTA
          </h2>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[11px] font-medium text-ps-ink-dim mb-2">
                Constraints
              </p>
              <ConstraintList
                constraints={brief.constraints}
                onChange={(v) => set("constraints", v)}
              />
            </div>
            <FormField
              id="cta-goal"
              label="Primary CTA Goal"
              value={brief.ctaGoal}
              onChange={(v) => set("ctaGoal", v)}
              placeholder="e.g. Start free trial"
            />
          </div>
        </section>
      </div>

      {/* ── Right: live preview ── */}
      <aside className="sticky top-0">
        <div
          className="rounded-xl border border-ps-border overflow-hidden"
          style={{
            background:
              "linear-gradient(160deg, var(--color-ps-surface) 0%, var(--color-ps-accent-tint) 100%)",
            boxShadow: "0 0 40px rgba(124,58,237,0.06)",
          }}
        >
          {/* Card header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-ps-border">
            <span className="text-[10px] font-semibold text-ps-ink-ghost uppercase tracking-widest">
              Brief Preview
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-medium text-ps-ok">
              <span className="w-1.5 h-1.5 rounded-full bg-ps-ok animate-pulse" />
              Live
            </span>
          </div>

          {/* Card body */}
          <div className="p-5">
            {/* Product name */}
            <h3
              className={cn(
                "text-[22px] font-bold tracking-tight leading-tight mb-1 transition-opacity",
                isGenerating ? "opacity-40" : "opacity-100"
              )}
              style={{
                backgroundImage:
                  "linear-gradient(135deg, var(--color-ps-ink) 30%, var(--color-ps-accent-soft) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {brief.productName || "Your Product"}
            </h3>

            {/* Audience */}
            <p className="text-[11px] text-ps-ink-ghost mb-4">
              For {brief.audience || "your audience"}
            </p>

            {/* Value prop */}
            <p className="text-[13px] text-ps-ink-dim leading-relaxed pb-4 mb-4 border-b border-ps-border">
              {brief.valueProposition || "Describe your value proposition above."}
            </p>

            {/* Tone + constraint chips */}
            <div className="flex flex-wrap gap-1.5 mb-5">
              <span className="px-2 py-1 rounded-md text-[10px] font-semibold bg-ps-accent/10 text-ps-accent-soft border border-ps-accent/20">
                {TONE_LABELS[brief.tone]}
              </span>
              {brief.constraints.map((c, i) => (
                <span
                  key={i}
                  className="px-2 py-1 rounded-md text-[10px] bg-ps-raised text-ps-ink-ghost border border-ps-border"
                >
                  {c}
                </span>
              ))}
            </div>

            {/* CTA preview */}
            <div>
              <p className="text-[10px] text-ps-ink-ghost mb-2">Primary CTA</p>
              <div
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-[12px] font-semibold text-white tracking-tight"
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-ps-accent-dim), var(--color-ps-accent))",
                  boxShadow: "0 4px 16px rgba(124,58,237,0.25)",
                }}
              >
                {brief.ctaGoal || "Your CTA"} →
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
