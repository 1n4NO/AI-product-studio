"use client";

import { useEffect, useState } from "react";

interface AutosaveIndicatorProps {
  /** Unix timestamp (ms) of the last successful save, or 0 if never saved */
  savedAt: number;
}

function relativeTime(ts: number): string {
  if (!ts) return "";
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 10)  return "just now";
  if (diff < 60)  return `${diff}s ago`;
  const mins = Math.floor(diff / 60);
  if (mins < 60)  return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

/**
 * Compact "✓ Saved · just now" indicator for the top bar.
 * Re-renders every 15s to keep the relative time fresh.
 */
export function AutosaveIndicator({ savedAt }: AutosaveIndicatorProps) {
  const [, setTick] = useState(0);

  /* Re-render every 15s to keep relative time current */
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  if (!savedAt) return null;

  const label = relativeTime(savedAt);

  return (
    <div
      className="flex items-center gap-1.5 text-[11px] select-none"
      style={{ color: "var(--color-ps-ink-ghost)" }}
      title={`Last saved: ${new Date(savedAt).toLocaleTimeString()}`}
    >
      <span
        className="text-[10px]"
        style={{ color: "var(--color-ps-ok)" }}
        aria-hidden="true"
      >
        ✓
      </span>
      <span>Saved{label ? ` · ${label}` : ""}</span>
    </div>
  );
}
