"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/organisms/Sidebar";
import { StageBar } from "@/components/organisms/StageBar";
import type { SidebarSection } from "@/components/organisms/Sidebar";
import type { Stage } from "@/components/organisms/StageBar";
import type { RunSummary } from "@/components/molecules/RunItem";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/cn";

interface StudioLayoutProps {
  /** Content rendered inside the scrollable main canvas */
  children: ReactNode;

  /* ── Sidebar props ── */
  runs: RunSummary[];
  selectedRunId: string;
  onSelectRun: (id: string) => void;
  onNewRun: () => void;
  activeSection?: SidebarSection;
  onNavigate?: (section: SidebarSection) => void;
  onOpenSettings?: () => void;

  /* ── Top bar props ── */
  projectName: string;
  currentStage: Stage;
  completedStages?: Stage[];
  onStageClick?: (stage: Stage) => void;

  /** Primary action button in top-right (e.g. "Generate →") */
  primaryAction?: ReactNode;
  /** Secondary action button in top-right (e.g. "Save Draft") */
  secondaryAction?: ReactNode;

  className?: string;
}

export function StudioLayout({
  children,
  runs,
  selectedRunId,
  onSelectRun,
  onNewRun,
  activeSection,
  onNavigate,
  onOpenSettings,
  projectName,
  currentStage,
  completedStages,
  onStageClick,
  primaryAction,
  secondaryAction,
  className,
}: StudioLayoutProps) {
  return (
    <div className={cn("flex h-screen overflow-hidden bg-ps-canvas", className)}>
      {/* ── Left sidebar ── */}
      <Sidebar
        runs={runs}
        selectedRunId={selectedRunId}
        onSelectRun={onSelectRun}
        onNewRun={onNewRun}
        activeSection={activeSection}
        onNavigate={onNavigate}
        onOpenSettings={onOpenSettings}
      />

      {/* ── Main column ── */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-5 border-b border-ps-border bg-ps-canvas shrink-0"
          style={{ height: 52 }}
        >
          {/* Left: project name + stage stepper */}
          <div className="flex items-center gap-4">
            <h1 className="text-[13px] font-semibold text-ps-ink tracking-tight whitespace-nowrap">
              {projectName}
            </h1>
            <StageBar
              currentStage={currentStage}
              completedStages={completedStages}
              onStageClick={onStageClick}
            />
          </div>

          {/* Right: action buttons */}
          {(secondaryAction || primaryAction) && (
            <div className="flex items-center gap-2">
              {secondaryAction}
              {primaryAction}
            </div>
          )}
        </header>

        {/* Scrollable canvas */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
