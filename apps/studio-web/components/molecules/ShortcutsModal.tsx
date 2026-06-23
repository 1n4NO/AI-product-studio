"use client";

import { useEffect } from "react";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SECTIONS = [
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["⌘", "K"],        desc: "Open command palette"         },
      { keys: ["⌘", "↩"],        desc: "Advance to next stage"        },
      { keys: ["⌘", ","],        desc: "Open settings"                },
      { keys: ["⌘", "/"],        desc: "Show keyboard shortcuts"      },
      { keys: ["Esc"],           desc: "Close modals & drawers"       },
    ],
  },
  {
    title: "Audit",
    shortcuts: [
      { keys: ["⌘", "⇧", "R"],  desc: "Re-audit current run"        },
      { keys: ["⌘", "⇧", "V"],  desc: "Open review drawer"          },
    ],
  },
] as const;

function Kbd({ label }: { label: string }) {
  return (
    <kbd
      className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold"
      style={{
        background: "var(--color-ps-raised)",
        border:     "1px solid var(--color-ps-border)",
        color:      "var(--color-ps-ink)",
      }}
    >
      {label}
    </kbd>
  );
}

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  /* Close on Escape */
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    }
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background:   "var(--color-ps-canvas)",
          border:       "1px solid var(--color-ps-border)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "var(--color-ps-border)" }}
        >
          <div>
            <h2
              id="shortcuts-title"
              className="text-sm font-semibold"
              style={{ color: "var(--color-ps-ink)" }}
            >
              Keyboard Shortcuts
            </h2>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--color-ps-ink-ghost)" }}>
              macOS: ⌘ = Cmd · ⇧ = Shift
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-[12px] transition-colors hover:bg-ps-raised"
            style={{ color: "var(--color-ps-ink-ghost)" }}
            aria-label="Close shortcuts"
          >
            ✕
          </button>
        </div>

        {/* Shortcut list */}
        <div className="px-5 py-4 flex flex-col gap-5">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <p
                className="text-[10px] font-semibold uppercase tracking-widest mb-2.5"
                style={{ color: "var(--color-ps-ink-ghost)" }}
              >
                {section.title}
              </p>
              <div className="flex flex-col gap-2">
                {section.shortcuts.map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                    <span className="text-[12px]" style={{ color: "var(--color-ps-ink-dim)" }}>
                      {s.desc}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {s.keys.map((k, ki) => <Kbd key={ki} label={k} />)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 border-t text-center"
          style={{ borderColor: "var(--color-ps-border)" }}
        >
          <p className="text-[10px]" style={{ color: "var(--color-ps-ink-ghost)" }}>
            Press <Kbd label="Esc" /> to close
          </p>
        </div>
      </div>
    </div>
  );
}
