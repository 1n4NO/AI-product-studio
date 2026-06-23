"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { storage, STORAGE_KEYS } from "@/lib/persistence";

function downloadBlob(filename: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a   = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export interface AppSettings {
  anthropicApiKey: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
  auditScoreThreshold: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  anthropicApiKey:     "",
  ollamaBaseUrl:       "http://localhost:11434",
  ollamaModel:         "llama3.2",
  auditScoreThreshold: 70,
};

interface SettingsDrawerProps {
  isOpen:            boolean;
  onClose:           () => void;
  onSave:            (settings: AppSettings) => void;
  /** Called with raw JSON string when user selects an import file */
  onImportProject?:  (json: string) => void;
  /** Called when user wants to export all project data */
  onExportProject?:  () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h3
        className="text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: "var(--color-ps-ink-ghost)" }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

export function SettingsDrawer({ isOpen, onClose, onSave, onImportProject, onExportProject }: SettingsDrawerProps) {
  const [settings, setSettings]   = useState<AppSettings>(DEFAULT_SETTINGS);
  const [showKey, setShowKey]     = useState(false);
  const [saved, setSaved]         = useState(false);
  const [importError, setImportError] = useState("");
  const fileInputRef              = useRef<HTMLInputElement>(null);

  // Load persisted settings on open
  useEffect(() => {
    if (isOpen) {
      const persisted = storage.get<AppSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
      setSettings(persisted);
    }
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isOpen && e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  function update<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    storage.set(STORAGE_KEYS.settings, settings);
    onSave(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  const panelRef = useRef<HTMLElement>(null);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className="fixed inset-0 z-30 transition-opacity duration-300"
        style={{
          background:     "rgba(0,0,0,0.5)",
          opacity:        isOpen ? 1 : 0,
          pointerEvents:  isOpen ? "auto" : "none",
        }}
      />

      {/* Panel */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal
        aria-label="Settings"
        className="fixed right-0 top-0 bottom-0 z-40 flex flex-col w-[420px] max-w-[95vw] transition-transform duration-300 ease-in-out"
        style={{
          background:    "var(--color-ps-surface)",
          borderLeft:    "1px solid var(--color-ps-border)",
          boxShadow:     isOpen ? "-8px 0 40px rgba(0,0,0,0.4)" : "none",
          transform:     isOpen ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ borderColor: "var(--color-ps-border)" }}
        >
          <span className="font-semibold text-base" style={{ color: "var(--color-ps-ink)" }}>
            Settings
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-sm"
            style={{ color: "var(--color-ps-ink-dim)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-ps-raised)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-8">

          {/* AI providers */}
          <Section title="AI Providers">
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-ps-ink-dim)" }}>
              Set your Anthropic key for cloud generation. If unset, requests fall back to local Ollama.
              Keys are stored in your browser only.
            </p>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="anthropic-key">Anthropic API Key</Label>
              <div className="relative flex items-center">
                <Input
                  id="anthropic-key"
                  type={showKey ? "text" : "password"}
                  placeholder="sk-ant-…"
                  value={settings.anthropicApiKey}
                  onChange={(e) => update("anthropicApiKey", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowKey((s) => !s)}
                  className="absolute right-3 text-xs"
                  style={{ color: "var(--color-ps-ink-ghost)" }}
                  aria-label={showKey ? "Hide key" : "Show key"}
                >
                  {showKey ? "hide" : "show"}
                </button>
              </div>
              <p className="text-[10px]" style={{ color: "var(--color-ps-ink-ghost)" }}>
                Stored locally — never sent to any server except Anthropic.
              </p>
            </div>
          </Section>

          {/* Ollama */}
          <Section title="Ollama (Local)">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ollama-url">Base URL</Label>
              <Input
                id="ollama-url"
                value={settings.ollamaBaseUrl}
                onChange={(e) => update("ollamaBaseUrl", e.target.value)}
                placeholder="http://localhost:11434"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ollama-model">Model</Label>
              <Input
                id="ollama-model"
                value={settings.ollamaModel}
                onChange={(e) => update("ollamaModel", e.target.value)}
                placeholder="llama3.2"
              />
              <p className="text-[10px]" style={{ color: "var(--color-ps-ink-ghost)" }}>
                Run <code className="font-mono">ollama pull llama3.2</code> to download this model.
              </p>
            </div>
          </Section>

          {/* Audit thresholds */}
          <Section title="Audit Gate">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="score-threshold">
                Minimum score threshold
                <span className="ml-2 font-mono font-bold" style={{ color: "var(--color-ps-accent-soft)" }}>
                  {settings.auditScoreThreshold}
                </span>
              </Label>
              <input
                id="score-threshold"
                type="range"
                min={0}
                max={100}
                step={5}
                value={settings.auditScoreThreshold}
                onChange={(e) => update("auditScoreThreshold", Number(e.target.value))}
                className="w-full accent-ps-accent"
                style={{ accentColor: "var(--color-ps-accent)" }}
              />
              <div className="flex justify-between text-[10px]" style={{ color: "var(--color-ps-ink-ghost)" }}>
                <span>0 — never block</span>
                <span>100 — always require perfect</span>
              </div>
            </div>
          </Section>

          {/* Project */}
          <Section title="Project">
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-ps-ink-dim)" }}>
              Export all runs as a single JSON file to back up or share your project. Import restores runs from a previously exported file.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="subtle"
                size="sm"
                onClick={onExportProject}
              >
                ↓ Export project JSON
              </Button>
              <Button
                variant="subtle"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                ↑ Import project JSON
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                aria-label="Import project JSON file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const text = ev.target?.result as string;
                    try {
                      // Validate it's parseable JSON
                      JSON.parse(text);
                      setImportError("");
                      onImportProject?.(text);
                    } catch {
                      setImportError("Invalid JSON file — please export from Product Studio first.");
                    }
                  };
                  reader.readAsText(file);
                  // Reset so the same file can be re-selected
                  e.target.value = "";
                }}
              />
            </div>
            {importError && (
              <p className="text-[11px]" style={{ color: "var(--color-ps-err)" }}>
                {importError}
              </p>
            )}
          </Section>

          {/* Danger zone */}
          <Section title="Data">
            <div
              className="rounded-xl border p-4 flex flex-col gap-3"
              style={{ borderColor: "rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.03)" }}
            >
              <p className="text-xs" style={{ color: "var(--color-ps-ink-dim)" }}>
                Clear all saved runs and brief data from your browser. This cannot be undone.
              </p>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (confirm("Clear all saved data? This cannot be undone.")) {
                    storage.remove(STORAGE_KEYS.brief);
                    storage.remove(STORAGE_KEYS.runs);
                    window.location.reload();
                  }
                }}
              >
                Clear all data
              </Button>
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div
          className="flex gap-3 px-6 py-4 border-t shrink-0"
          style={{ borderColor: "var(--color-ps-border)", background: "var(--color-ps-surface)" }}
        >
          <Button variant="ghost" size="md" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            className="flex-1"
            onClick={handleSave}
            style={saved ? { background: "var(--color-ps-ok)", border: "none", color: "#fff" } : undefined}
          >
            {saved ? "✓ Saved" : "Save Settings"}
          </Button>
        </div>
      </aside>
    </>
  );
}
