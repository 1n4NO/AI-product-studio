"use client";

import { useTheme, THEME_CYCLE, THEME_ICONS, THEME_LABELS } from "@/lib/useTheme";

/**
 * Compact icon-button that cycles dark → light → system.
 * Designed to sit in the Sidebar bottom nav.
 */
export function ThemeToggle() {
  const { mode, setTheme } = useTheme();

  function cycle() {
    const idx  = THEME_CYCLE.indexOf(mode);
    const next = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
    setTheme(next);
  }

  return (
    <button
      onClick={cycle}
      className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[12px] transition-colors w-full text-left text-ps-ink-ghost hover:bg-ps-raised hover:text-ps-ink-dim"
      title={`Theme: ${THEME_LABELS[mode]} — click to switch`}
      aria-label={`Current theme: ${THEME_LABELS[mode]}. Click to switch.`}
    >
      <span className="w-4 text-center text-[13px]" aria-hidden="true">
        {THEME_ICONS[mode]}
      </span>
      {THEME_LABELS[mode]}
    </button>
  );
}
