"use client";

import { Button } from "@/components/atoms/Button";
import { RunItem } from "@/components/molecules/RunItem";
import type { RunSummary } from "@/components/molecules/RunItem";
import { cn } from "@/lib/cn";

export type SidebarSection = "compare" | "exports" | "slo";

interface SidebarProps {
  runs: RunSummary[];
  selectedRunId: string;
  onSelectRun: (id: string) => void;
  onNewRun: () => void;
  activeSection?: SidebarSection;
  onNavigate?: (section: SidebarSection) => void;
  className?: string;
}

const NAV_ITEMS: { id: SidebarSection; icon: string; label: string }[] = [
  { id: "compare", icon: "⚖", label: "Compare Runs" },
  { id: "exports", icon: "↑",  label: "Exports"      },
  { id: "slo",     icon: "◈",  label: "SLO Monitor"  },
];

export function Sidebar({
  runs,
  selectedRunId,
  onSelectRun,
  onNewRun,
  activeSection,
  onNavigate,
  className,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex flex-col w-56 shrink-0",
        "bg-ps-surface border-r border-ps-border",
        className
      )}
      aria-label="Studio navigation"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-ps-border">
        <div
          className="w-6 h-6 rounded-md shrink-0"
          style={{ background: "linear-gradient(135deg, var(--color-ps-accent), var(--color-ps-info))" }}
          aria-hidden="true"
        />
        <div>
          <p className="text-[13px] font-semibold text-ps-ink tracking-tight leading-none">
            Product Studio
          </p>
          <p className="text-[10px] text-ps-ink-ghost mt-0.5">AI Design Pipeline</p>
        </div>
      </div>

      {/* New run button */}
      <div className="p-2">
        <Button
          variant="subtle"
          size="sm"
          onClick={onNewRun}
          className="w-full justify-center gap-1.5 border-dashed border-ps-accent/30 text-ps-accent-soft hover:bg-ps-accent-dim/20"
        >
          <span aria-hidden="true">＋</span> New Run
        </Button>
      </div>

      {/* Run history */}
      <div className="px-2 pb-1">
        <p className="px-1 pb-1 text-[10px] font-semibold text-ps-ink-ghost uppercase tracking-widest">
          Recent Runs
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 flex flex-col gap-0.5">
        {runs.length === 0 ? (
          <p className="px-2 py-4 text-center text-[11px] text-ps-ink-ghost">
            No runs yet. Hit New Run to start.
          </p>
        ) : (
          runs.map((run) => (
            <RunItem
              key={run.id}
              run={run}
              isActive={run.id === selectedRunId}
              onClick={() => onSelectRun(run.id)}
            />
          ))
        )}
      </div>

      {/* Bottom nav */}
      <nav className="border-t border-ps-border p-2 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate?.(item.id)}
            aria-current={activeSection === item.id ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-md text-[12px] transition-colors w-full text-left",
              activeSection === item.id
                ? "bg-ps-raised text-ps-accent-soft"
                : "text-ps-ink-ghost hover:bg-ps-raised hover:text-ps-ink-dim"
            )}
          >
            <span className="w-4 text-center text-[13px]" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
