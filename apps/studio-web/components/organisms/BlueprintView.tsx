import type { PageBlueprint, PageSection } from "@product-studio/shared-types";
import { cn } from "@/lib/cn";

interface BlueprintViewProps {
  blueprint: PageBlueprint | null;
  isGenerating?: boolean;
}

const SECTION_ICONS: Record<PageSection["type"], string> = {
  hero:           "◈",
  problem:        "▲",
  solution:       "◆",
  features:       "⬡",
  "social-proof": "★",
  faq:            "?",
  cta:            "→",
};

const SECTION_COLORS: Record<PageSection["type"], string> = {
  hero:           "text-ps-accent-soft  bg-ps-accent/10  border-ps-accent/20",
  problem:        "text-ps-err          bg-ps-err/10     border-ps-err/20",
  solution:       "text-ps-ok           bg-ps-ok/10      border-ps-ok/20",
  features:       "text-ps-info-soft    bg-ps-info/10    border-ps-info/20",
  "social-proof": "text-ps-warn         bg-ps-warn/10    border-ps-warn/20",
  faq:            "text-ps-ink-dim      bg-ps-raised     border-ps-border",
  cta:            "text-ps-accent-soft  bg-ps-accent/10  border-ps-accent/20",
};

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-ps-border bg-ps-surface p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-ps-raised shrink-0" />
        <div className="flex-1">
          <div className="h-3 bg-ps-raised rounded w-24 mb-2" />
          <div className="h-2 bg-ps-raised rounded w-full mb-1.5" />
          <div className="h-2 bg-ps-raised rounded w-3/4 mb-4" />
          <div className="flex gap-2">
            <div className="h-5 bg-ps-raised rounded w-20" />
            <div className="h-5 bg-ps-raised rounded w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function BlueprintView({ blueprint, isGenerating }: BlueprintViewProps) {
  if (isGenerating) {
    return (
      <div className="max-w-2xl">
        <div className="mb-6">
          <div className="h-5 bg-ps-raised rounded w-48 mb-2 animate-pulse" />
          <div className="h-3 bg-ps-raised rounded w-72 animate-pulse" />
        </div>
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (!blueprint) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-5 border border-ps-border"
          style={{ background: "linear-gradient(135deg, var(--color-ps-surface), var(--color-ps-accent-tint))" }}
        >
          ◈
        </div>
        <p className="text-[15px] font-semibold text-ps-ink mb-2">No blueprint yet</p>
        <p className="text-[13px] text-ps-ink-ghost max-w-xs">
          Fill in the brief and hit Generate to produce a page structure.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-[16px] font-bold text-ps-ink tracking-tight mb-1">
          {blueprint.title}
        </h2>
        <p className="text-[12px] text-ps-ink-dim">{blueprint.summary}</p>
      </div>

      {/* Section flow */}
      <div className="relative flex flex-col gap-3">
        {/* Vertical connector line */}
        <div
          className="absolute left-[19px] top-10 bottom-10 w-px"
          style={{ background: "linear-gradient(to bottom, var(--color-ps-accent), transparent)" }}
          aria-hidden="true"
        />

        {blueprint.sections.map((section, idx) => {
          const colors = SECTION_COLORS[section.type];
          const icon   = SECTION_ICONS[section.type];

          return (
            <article
              key={section.id}
              className="relative flex items-start gap-4 rounded-xl border border-ps-border bg-ps-surface p-5 transition-colors hover:border-ps-accent/30"
            >
              {/* Step badge */}
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center text-[16px] font-bold shrink-0 border",
                  colors
                )}
              >
                {icon}
              </div>

              <div className="flex-1 min-w-0">
                {/* Type + step number */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-ps-ink-ghost">
                    {idx + 1} / {blueprint.sections.length}
                  </span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border",
                    colors
                  )}>
                    {section.type}
                  </span>
                </div>

                {/* Intent */}
                <p className="text-[13px] font-medium text-ps-ink leading-snug mb-3">
                  {section.intent}
                </p>

                {/* Required components */}
                <div className="flex flex-wrap gap-1.5">
                  {section.requiredComponents.map((comp) => (
                    <span
                      key={comp}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono text-ps-ink-ghost bg-ps-raised border border-ps-border"
                    >
                      {comp}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
