"use client";

import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "dark" | "light" | "system";

const STORAGE_KEY = "ps:theme:v1";
const DEFAULT_MODE: ThemeMode = "dark";

/** Resolve "system" to the actual "dark" or "light" value. */
function resolveEffective(mode: ThemeMode): "dark" | "light" {
  if (mode !== "system") return mode;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Write the resolved theme onto <html data-theme="…">. */
function applyTheme(mode: ThemeMode): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = resolveEffective(mode);
}

/**
 * Self-contained theme hook.
 * Multiple callers are fine — they all read/write the same localStorage key
 * and the same data-theme attribute, so they stay in sync.
 */
export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(DEFAULT_MODE);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) ?? DEFAULT_MODE) as ThemeMode;
    setModeState(stored);
    applyTheme(stored);
  }, []);

  // Re-apply when OS preference changes while in "system" mode
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  const setTheme = useCallback((next: ThemeMode) => {
    setModeState(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }, []);

  return { mode, setTheme };
}

export const THEME_CYCLE: ThemeMode[] = ["dark", "light", "system"];

export const THEME_ICONS: Record<ThemeMode, string> = {
  dark:   "☽",
  light:  "☀",
  system: "⊙",
};

export const THEME_LABELS: Record<ThemeMode, string> = {
  dark:   "Dark",
  light:  "Light",
  system: "System",
};
