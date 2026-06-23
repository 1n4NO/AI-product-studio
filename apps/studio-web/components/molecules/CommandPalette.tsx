"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fuzzyMatch } from "@/lib/useCommandPalette";
import { cn } from "@/lib/cn";

/* ── Types ─────────────────────────────────────────────────────────────── */

export type CommandSection = "actions" | "navigate" | "templates" | "runs";

export interface CommandItem {
  id:           string;
  section:      CommandSection;
  icon:         string;
  label:        string;
  description?: string;
  shortcut?:    string[];
  disabled?:    boolean;
  action:       () => void;
}

interface CommandPaletteProps {
  isOpen:  boolean;
  onClose: () => void;
  items:   CommandItem[];
}

/* ── Section metadata ───────────────────────────────────────────────────── */

const SECTION_ORDER: CommandSection[] = ["actions", "navigate", "templates", "runs"];

const SECTION_LABELS: Record<CommandSection, string> = {
  actions:   "Actions",
  navigate:  "Navigation",
  templates: "Brief Templates",
  runs:      "Recent Runs",
};

/* ── Helpers ────────────────────────────────────────────────────────────── */

function Kbd({ label }: { label: string }) {
  return (
    <kbd
      className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold"
      style={{
        background: "var(--color-ps-raised)",
        border:     "1px solid var(--color-ps-border)",
        color:      "var(--color-ps-ink-ghost)",
      }}
    >
      {label}
    </kbd>
  );
}

/* ── Main component ─────────────────────────────────────────────────────── */

export function CommandPalette({ isOpen, onClose, items }: CommandPaletteProps) {
  const [query, setQuery]             = useState("");
  const [selectedIndex, setSelected]  = useState(0);
  const inputRef                      = useRef<HTMLInputElement>(null);
  const listRef                       = useRef<HTMLDivElement>(null);

  /* Reset on open/close */
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelected(0);
      // Autofocus on next tick so the modal is rendered first
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  /* Filter items by query */
  const filtered = useMemo(() => {
    return items.filter(
      (item) =>
        !item.disabled &&
        fuzzyMatch(query, `${item.label} ${item.description ?? ""}`)
    );
  }, [items, query]);

  /* Group by section (preserve order) */
  const grouped = useMemo(() => {
    const map = new Map<CommandSection, CommandItem[]>();
    for (const sec of SECTION_ORDER) {
      const g = filtered.filter((i) => i.section === sec);
      if (g.length) map.set(sec, g);
    }
    return map;
  }, [filtered]);

  /* Clamp selection when results change */
  useEffect(() => {
    setSelected((prev) => Math.max(0, Math.min(prev, filtered.length - 1)));
  }, [filtered.length]);

  /* Scroll selected item into view */
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-cmd-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  /* Keyboard navigation */
  useEffect(() => {
    if (!isOpen) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((i) => (i + 1) % Math.max(1, filtered.length));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((i) => (i - 1 + Math.max(1, filtered.length)) % Math.max(1, filtered.length));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const item = filtered[selectedIndex];
        if (item) {
          item.action();
          onClose();
        }
      }
    }

    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [isOpen, onClose, filtered, selectedIndex]);

  if (!isOpen) return null;

  let globalIndex = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="w-full max-w-[560px] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{
          background:  "var(--color-ps-canvas)",
          border:      "1px solid var(--color-ps-border)",
          maxHeight:   "70vh",
        }}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b shrink-0"
          style={{ borderColor: "var(--color-ps-border)" }}
        >
          <span
            className="text-base shrink-0"
            style={{ color: "var(--color-ps-ink-ghost)" }}
            aria-hidden="true"
          >
            ⌕
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
            placeholder="Search actions, runs, templates…"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--color-ps-ink)" }}
            autoComplete="off"
            spellCheck={false}
            aria-autocomplete="list"
            aria-controls="cmd-list"
            aria-activedescendant={`cmd-item-${selectedIndex}`}
          />
          <kbd
            className="px-1.5 py-1 rounded text-[10px] font-mono font-semibold shrink-0"
            style={{
              background: "var(--color-ps-raised)",
              border:     "1px solid var(--color-ps-border)",
              color:      "var(--color-ps-ink-ghost)",
            }}
          >
            ⌘K
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          id="cmd-list"
          role="listbox"
          className="overflow-y-auto flex-1"
        >
          {filtered.length === 0 ? (
            <div
              className="py-10 text-center text-sm"
              style={{ color: "var(--color-ps-ink-ghost)" }}
            >
              No results for{" "}
              <span className="font-semibold" style={{ color: "var(--color-ps-ink-dim)" }}>
                &quot;{query}&quot;
              </span>
            </div>
          ) : (
            Array.from(grouped.entries()).map(([section, sectionItems]) => (
              <div key={section}>
                {/* Section header */}
                <div
                  className="px-4 pt-3 pb-1"
                >
                  <p
                    className="text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: "var(--color-ps-ink-ghost)" }}
                  >
                    {SECTION_LABELS[section]}
                  </p>
                </div>

                {/* Items */}
                {sectionItems.map((item) => {
                  const idx     = globalIndex++;
                  const isActive = idx === selectedIndex;

                  return (
                    <div
                      key={item.id}
                      id={`cmd-item-${idx}`}
                      role="option"
                      aria-selected={isActive}
                      data-cmd-index={idx}
                      onClick={() => { item.action(); onClose(); }}
                      onMouseEnter={() => setSelected(idx)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
                      )}
                      style={{
                        background: isActive ? "var(--color-ps-raised)" : "transparent",
                        borderLeft: isActive ? "2px solid var(--color-ps-accent)" : "2px solid transparent",
                      }}
                    >
                      {/* Icon */}
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[13px] shrink-0"
                        style={{
                          background: isActive
                            ? "color-mix(in srgb, var(--color-ps-accent) 15%, transparent)"
                            : "var(--color-ps-raised)",
                          color: isActive ? "var(--color-ps-accent-soft)" : "var(--color-ps-ink-ghost)",
                        }}
                        aria-hidden="true"
                      >
                        {item.icon}
                      </span>

                      {/* Label + description */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[13px] font-medium truncate"
                          style={{ color: isActive ? "var(--color-ps-ink)" : "var(--color-ps-ink-dim)" }}
                        >
                          {item.label}
                        </p>
                        {item.description && (
                          <p
                            className="text-[10px] truncate mt-0.5"
                            style={{ color: "var(--color-ps-ink-ghost)" }}
                          >
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Shortcut */}
                      {item.shortcut && (
                        <div className="flex items-center gap-0.5 shrink-0">
                          {item.shortcut.map((k, i) => <Kbd key={i} label={k} />)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div
          className="flex items-center gap-3 px-4 py-2 border-t shrink-0"
          style={{
            borderColor: "var(--color-ps-border)",
            background:  "var(--color-ps-surface)",
          }}
        >
          {[
            { keys: ["↑", "↓"], label: "navigate" },
            { keys: ["↩"],      label: "select"   },
            { keys: ["Esc"],    label: "close"     },
          ].map(({ keys, label }) => (
            <div key={label} className="flex items-center gap-1">
              {keys.map((k) => <Kbd key={k} label={k} />)}
              <span className="text-[10px] ml-0.5" style={{ color: "var(--color-ps-ink-ghost)" }}>
                {label}
              </span>
            </div>
          ))}
          <div className="flex-1" />
          <span className="text-[10px]" style={{ color: "var(--color-ps-ink-ghost)" }}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
