"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const STEPS = [
  {
    icon: "✦",
    label: "Brief",
    desc: "Describe your product, audience, tone, and conversion goal.",
    accent: "var(--color-ps-accent)",
  },
  {
    icon: "◧",
    label: "Blueprint",
    desc: "AI generates page architecture, visual theme, and copy variants.",
    accent: "var(--color-ps-info)",
  },
  {
    icon: "◈",
    label: "Audit",
    desc: "Automated UX scoring across accessibility, readability, and performance.",
    accent: "var(--color-ps-ok)",
  },
  {
    icon: "↑",
    label: "Export",
    desc: "Download production-ready JSON, CSS tokens, and ZIP bundle.",
    accent: "var(--color-ps-warn)",
  },
] as const;

interface OnboardingHeroProps {
  onDismiss?: () => void;
}

export function OnboardingHero({ onDismiss }: OnboardingHeroProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={cn(
        "mb-6 rounded-2xl border overflow-hidden",
        "transition-all duration-500 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      )}
      style={{
        background: "var(--color-ps-surface)",
        borderColor: "var(--color-ps-border)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-4 pb-3">
        <div>
          <p
            className="text-[13px] font-semibold tracking-tight"
            style={{ color: "var(--color-ps-ink)" }}
          >
            Welcome to Product Studio
          </p>
          <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "var(--color-ps-ink-ghost)" }}>
            Fill in your brief below and hit{" "}
            <span className="font-semibold" style={{ color: "var(--color-ps-accent-soft)" }}>
              Generate →
            </span>{" "}
            to start the AI design pipeline.
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-4 shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[11px] transition-colors hover:bg-ps-raised"
            style={{ color: "var(--color-ps-ink-ghost)" }}
            aria-label="Dismiss getting started guide"
          >
            ✕
          </button>
        )}
      </div>

      {/* 4-step pipeline */}
      <div
        className="grid grid-cols-4 border-t"
        style={{ borderColor: "var(--color-ps-border)" }}
      >
        {STEPS.map((step, i) => (
          <StepCell key={step.label} step={step} index={i} isLast={i === STEPS.length - 1} />
        ))}
      </div>
    </div>
  );
}

interface StepCellProps {
  step: (typeof STEPS)[number];
  index: number;
  isLast: boolean;
}

function StepCell({ step, index, isLast }: StepCellProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 180 + index * 90);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div
      className={cn(
        "flex flex-col gap-2 px-4 py-3 transition-all duration-500 ease-out",
        !isLast && "border-r",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      )}
      style={{ borderColor: "var(--color-ps-border)" }}
    >
      {/* Icon + label */}
      <div className="flex items-center gap-2">
        <span
          className="w-6 h-6 rounded-md flex items-center justify-center text-[12px] shrink-0 font-bold"
          style={{ background: `color-mix(in srgb, ${step.accent} 15%, transparent)`, color: step.accent }}
          aria-hidden="true"
        >
          {step.icon}
        </span>
        <div className="flex items-baseline gap-1">
          <span
            className="text-[9px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--color-ps-ink-ghost)" }}
          >
            {index + 1}.
          </span>
          <span className="text-[12px] font-semibold" style={{ color: "var(--color-ps-ink)" }}>
            {step.label}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-[11px] leading-relaxed" style={{ color: "var(--color-ps-ink-ghost)" }}>
        {step.desc}
      </p>
    </div>
  );
}
