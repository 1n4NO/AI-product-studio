"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Global open/close state for the command palette.
 * Attach the keyboard listener once at the top of the app.
 */
export function useCommandPaletteShortcut(onOpen: () => void) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpen();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpen]);
}

/** Simple substring fuzzy score (higher = better match). */
export function fuzzyMatch(needle: string, haystack: string): boolean {
  if (!needle) return true;
  const n = needle.toLowerCase();
  const h = haystack.toLowerCase();
  // Require all characters of needle appear in order in haystack
  let hi = 0;
  for (let ni = 0; ni < n.length; ni++) {
    hi = h.indexOf(n[ni], hi);
    if (hi === -1) return false;
    hi++;
  }
  return true;
}
