"use client";

/**
 * Tiny localStorage wrapper with JSON serialisation.
 * Falls back silently when localStorage is unavailable (SSR, private mode).
 */

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export const storage = { get: safeGet, set: safeSet, remove: safeRemove };

/* ─── App-specific keys ──────────────────────── */

export const STORAGE_KEYS = {
  brief:    "ps:brief:v1",
  runs:     "ps:runs:v1",
  settings: "ps:settings:v1",
} as const;
