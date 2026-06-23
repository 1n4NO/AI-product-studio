"use client";

import { useEffect } from "react";
import { BRIEF_TEMPLATES, type BriefTemplate } from "@/lib/briefTemplates";
import type { Brief } from "@product-studio/shared-types";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/cn";

interface TemplateDrawerProps {
  isOpen:    boolean;
  onClose:   () => void;
  onSelect:  (brief: Brief) => void;
}

const TONE_CHIPS: Record<string, string> = {
  bold:          "var(--color-ps-accent)",
  playful:       "var(--color-ps-warn)",
  sophisticated: "var(--color-ps-info-soft)",
  energetic:     "#f97316",
  minimal:       "var(--color-ps-ink-ghost)",
  warm:          "#f59e0b",
};

export function TemplateDrawer({ isOpen, onClose, onSelect }: TemplateDrawerProps) {
  /* Escape to close */
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    }
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [isOpen, onClose]);

  /* Trap body scroll */
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else         document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  function pick(template: BriefTemplate) {
    onSelect({ ...template.brief });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-drawer-title"
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background:  "var(--color-ps-canvas)",
          border:      "1px solid var(--color-ps-border)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ borderColor: "var(--color-ps-border)" }}
        >
          <div>
            <h2
              id="template-drawer-title"
              className="text-sm font-semibold"
              style={{ color: "var(--color-ps-ink)" }}
            >
              Start from a template
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--color-ps-ink-ghost)" }}>
              Pick a brief preset — you can edit every field after loading.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-[12px] transition-colors hover:bg-ps-raised"
            style={{ color: "var(--color-ps-ink-ghost)" }}
            aria-label="Close templates"
          >
            ✕
          </button>
        </div>

        {/* Grid of template cards */}
        <div className="overflow-y-auto p-6 grid grid-cols-2 gap-4">
          {BRIEF_TEMPLATES.map((t) => (
            <TemplateCard key={t.id} template={t} onSelect={pick} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TemplateCard({
  template,
  onSelect,
}: {
  template: BriefTemplate;
  onSelect: (t: BriefTemplate) => void;
}) {
  const accentColor = TONE_CHIPS[template.brief.tone] ?? "var(--color-ps-accent)";

  return (
    <button
      onClick={() => onSelect(template)}
      className={cn(
        "flex flex-col gap-3 p-4 rounded-xl border text-left",
        "transition-all duration-150 group",
        "hover:border-ps-accent/50"
      )}
      style={{
        background:   "var(--color-ps-surface)",
        borderColor:  "var(--color-ps-border)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-ps-accent)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-ps-border)")}
    >
      {/* Icon + label row */}
      <div className="flex items-center gap-2.5">
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[15px] shrink-0"
          style={{ background: `color-mix(in srgb, ${accentColor} 15%, transparent)`, color: accentColor }}
          aria-hidden="true"
        >
          {template.icon}
        </span>
        <div>
          <p className="text-[13px] font-semibold" style={{ color: "var(--color-ps-ink)" }}>
            {template.label}
          </p>
          <span
            className="text-[10px] capitalize font-medium"
            style={{ color: accentColor }}
          >
            {template.brief.tone}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-[11px] leading-relaxed" style={{ color: "var(--color-ps-ink-ghost)" }}>
        {template.description}
      </p>

      {/* Preview details */}
      <div
        className="rounded-lg p-2.5 flex flex-col gap-1 mt-auto"
        style={{ background: "var(--color-ps-raised)" }}
      >
        <p
          className="text-[10px] font-semibold truncate"
          style={{ color: "var(--color-ps-ink)" }}
        >
          {template.brief.productName}
        </p>
        <p className="text-[10px] truncate" style={{ color: "var(--color-ps-ink-ghost)" }}>
          CTA: {template.brief.ctaGoal}
        </p>
      </div>

      {/* Load label — visible on hover */}
      <div className="flex justify-end">
        <span
          className="text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: "var(--color-ps-accent-soft)" }}
        >
          Load template →
        </span>
      </div>
    </button>
  );
}
