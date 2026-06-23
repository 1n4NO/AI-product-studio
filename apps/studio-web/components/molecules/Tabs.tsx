"use client";

import { cn } from "@/lib/cn";

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
}

interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ items, activeId, onChange, className }: TabsProps) {
  return (
    <div
      role="tablist"
      aria-label="View tabs"
      className={cn("flex gap-1 border-b", className)}
      style={{ borderColor: "var(--color-ps-border)" }}
    >
      {items.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors outline-none",
              "focus-visible:ring-2 rounded-t",
              isActive
                ? "text-ps-ink"
                : "text-ps-ink-dim hover:text-ps-ink"
            )}
            style={{
              color: isActive ? "var(--color-ps-ink)" : "var(--color-ps-ink-dim)",
            }}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span
                className="px-1.5 py-0.5 rounded text-xs font-semibold"
                style={{
                  background: isActive ? "var(--color-ps-accent-tint)" : "var(--color-ps-raised)",
                  color: isActive ? "var(--color-ps-accent-soft)" : "var(--color-ps-ink-ghost)",
                }}
              >
                {tab.badge}
              </span>
            )}
            {/* active indicator bar */}
            {isActive && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                style={{ background: "var(--color-ps-accent)" }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
