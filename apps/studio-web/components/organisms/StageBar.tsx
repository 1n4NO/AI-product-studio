"use client";

import { cn } from "@/lib/cn";

export type Stage = "brief" | "blueprint" | "audit" | "export";

const STAGES: { id: Stage; label: string; step: number }[] = [
  { id: "brief",     label: "Brief",     step: 1 },
  { id: "blueprint", label: "Blueprint", step: 2 },
  { id: "audit",     label: "Audit",     step: 3 },
  { id: "export",    label: "Export",    step: 4 },
];

type StageStatus = "pending" | "active" | "done";

interface StageBarProps {
  currentStage: Stage;
  /** Stages that have been completed. Defaults to all stages before currentStage. */
  completedStages?: Stage[];
  onStageClick?: (stage: Stage) => void;
  className?: string;
}

function getStatus(stage: Stage, current: Stage, completed: Stage[]): StageStatus {
  if (completed.includes(stage)) return "done";
  if (stage === current) return "active";
  return "pending";
}

export function StageBar({
  currentStage,
  completedStages,
  onStageClick,
  className,
}: StageBarProps) {
  const currentIndex = STAGES.findIndex((s) => s.id === currentStage);
  const resolved: Stage[] =
    completedStages ?? STAGES.slice(0, currentIndex).map((s) => s.id);

  return (
    <nav
      aria-label="Workflow stages"
      className={cn("flex items-center", className)}
    >
      {STAGES.map((stage, i) => {
        const status = getStatus(stage.id, currentStage, resolved);
        const isClickable = status === "done" && !!onStageClick;

        return (
          <div key={stage.id} className="flex items-center">
            {/* Connector */}
            {i > 0 && (
              <div
                className={cn(
                  "w-5 h-px mx-1",
                  status === "done" || stage.id === currentStage
                    ? "bg-ps-accent/40"
                    : "bg-ps-border"
                )}
                aria-hidden="true"
              />
            )}

            {/* Stage button */}
            <button
              onClick={isClickable ? () => onStageClick(stage.id) : undefined}
              disabled={!isClickable && status !== "active"}
              aria-current={status === "active" ? "step" : undefined}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors",
                status === "active" && "bg-ps-raised text-ps-accent-soft",
                status === "done"   && "text-ps-ink-dim",
                status === "pending" && "text-ps-ink-ghost cursor-default",
                isClickable && "hover:text-ps-ink cursor-pointer"
              )}
            >
              {/* Step indicator */}
              <span
                className={cn(
                  "flex items-center justify-center w-[18px] h-[18px] rounded-full text-[9px] font-bold shrink-0",
                  status === "active"  && "bg-ps-accent-dim text-ps-accent-soft",
                  status === "done"    && "bg-ps-ok/20 text-ps-ok",
                  status === "pending" && "bg-ps-border text-ps-ink-ghost"
                )}
                aria-hidden="true"
              >
                {status === "done" ? "✓" : stage.step}
              </span>

              {stage.label}
            </button>
          </div>
        );
      })}
    </nav>
  );
}
