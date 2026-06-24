"use client";

import { useEffect, useState } from "react";
import type { Provider, ProviderConfig, OllamaModel } from "@/lib/providers";
import { PROVIDER_META, classifyOllamaModel, SUGGESTED_INSTALLS } from "@/lib/providers";

// ─── Types ────────────────────────────────────────────────────────────────────

type WizardStep = "choose" | "configure";
type OllamaStatus = "loading" | "ready" | "no-capable" | "offline";

interface OllamaState {
  status: OllamaStatus;
  models: OllamaModel[];
  error?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1e9) return `${(bytes / 1e6).toFixed(0)} MB`;
  return `${(bytes / 1e9).toFixed(1)} GB`;
}

// ─── Step 1: Choose provider ──────────────────────────────────────────────────

const PROVIDER_ORDER: Exclude<Provider, "auto">[] = [
  "anthropic", "openai", "gemini", "ollama",
];

const PROVIDER_ICONS: Record<Exclude<Provider, "auto">, string> = {
  anthropic: "◆",
  openai:    "⬡",
  gemini:    "✦",
  ollama:    "⬢",
};

function ChooseStep({
  onSelect,
  onSkip,
}: {
  onSelect: (p: Provider) => void;
  onSkip: () => void;
}) {
  return (
    <div className="flex flex-col gap-0">
      {/* Header */}
      <div className="px-7 pt-7 pb-5" style={{ borderBottom: "1px solid var(--color-ps-border)" }}>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(165,180,252,0.7)" }}>
          Step 1 of 2
        </p>
        <h2 className="text-[18px] font-bold tracking-tight" style={{ color: "var(--color-ps-ink)" }}>
          Choose your AI provider
        </h2>
        <p className="mt-1.5 text-[13px]" style={{ color: "var(--color-ps-ink-dim)" }}>
          Your key is held in memory only — never stored or logged.
        </p>
      </div>

      {/* Provider grid */}
      <div className="p-4 grid grid-cols-2 gap-3">
        {PROVIDER_ORDER.map((p) => {
          const meta = PROVIDER_META[p];
          return (
            <button
              key={p}
              onClick={() => onSelect(p)}
              className="group relative flex flex-col gap-2.5 rounded-xl p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: "var(--color-ps-raised)",
                border: "1px solid var(--color-ps-border)",
              }}
            >
              {meta.badge && (
                <span
                  className="absolute top-3 right-3 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest"
                  style={{
                    background: meta.badge === "Recommended"
                      ? "rgba(99,102,241,0.2)"
                      : "rgba(52,211,153,0.15)",
                    color: meta.badge === "Recommended"
                      ? "rgba(165,180,252,0.9)"
                      : "rgba(52,211,153,0.9)",
                  }}
                >
                  {meta.badge}
                </span>
              )}
              <span
                className="text-[22px] leading-none"
                style={{ color: "var(--color-ps-accent)" }}
              >
                {PROVIDER_ICONS[p]}
              </span>
              <div>
                <p className="text-[13px] font-semibold" style={{ color: "var(--color-ps-ink)" }}>
                  {meta.label}
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed" style={{ color: "var(--color-ps-ink-dim)" }}>
                  {meta.tagline}
                </p>
              </div>
              <span
                className="text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: "rgba(165,180,252,0.9)" }}
              >
                Select →
              </span>
            </button>
          );
        })}
      </div>

      {/* Skip */}
      <div className="px-7 pb-6 text-center" style={{ borderTop: "1px solid var(--color-ps-border)" }}>
        <p className="mt-4 text-[12px]" style={{ color: "var(--color-ps-ink-ghost)" }}>
          No key?{" "}
          <button
            onClick={onSkip}
            className="underline underline-offset-2 transition-opacity hover:opacity-80"
            style={{ color: "var(--color-ps-ink-dim)" }}
          >
            Continue with deterministic templates
          </button>
          {" "}(no AI generation)
        </p>
      </div>
    </div>
  );
}

// ─── Step 2a: API key entry ───────────────────────────────────────────────────

function ApiKeyStep({
  provider,
  onBack,
  onComplete,
}: {
  provider: Exclude<Provider, "auto" | "ollama">;
  onBack: () => void;
  onComplete: (config: ProviderConfig) => void;
}) {
  const meta = PROVIDER_META[provider];
  const [key, setKey]         = useState("");
  const [show, setShow]       = useState(false);
  const [error, setError]     = useState("");

  function handleSubmit() {
    const trimmed = key.trim();
    if (!trimmed) {
      setError("Please enter your API key.");
      return;
    }
    if (trimmed.length < 16) {
      setError("Key looks too short — paste the full key.");
      return;
    }
    onComplete({ provider, apiKey: trimmed });
  }

  const steps: Record<Exclude<Provider, "auto" | "ollama">, string[]> = {
    anthropic: [
      "Go to console.anthropic.com → Account → API Keys",
      "Click Create Key — copy the full key starting with sk-ant-",
      "Paste it below",
    ],
    openai: [
      "Go to platform.openai.com → API Keys",
      "Click Create new secret key",
      "Paste the key below — it starts with sk-",
    ],
    gemini: [
      "Go to aistudio.google.com",
      "Click Get API Key → Create API key in new project",
      "Paste the key below — it starts with AIzaSy",
    ],
  };

  return (
    <div className="flex flex-col gap-0">
      {/* Header */}
      <div className="px-7 pt-7 pb-5" style={{ borderBottom: "1px solid var(--color-ps-border)" }}>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(165,180,252,0.7)" }}>
          Step 2 of 2 · {meta.label}
        </p>
        <h2 className="text-[18px] font-bold tracking-tight" style={{ color: "var(--color-ps-ink)" }}>
          Enter your API key
        </h2>
      </div>

      <div className="px-7 py-5 flex flex-col gap-5">
        {/* How-to */}
        <div
          className="rounded-xl p-4 flex flex-col gap-2"
          style={{
            background: "var(--color-ps-raised)",
            border: "1px solid var(--color-ps-border)",
          }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-ps-ink-ghost)" }}>
            How to get your key
          </p>
          <ol className="flex flex-col gap-1.5">
            {steps[provider].map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px]" style={{ color: "var(--color-ps-ink-dim)" }}>
                <span
                  className="mt-px h-4 w-4 shrink-0 rounded-full flex items-center justify-center text-[9px] font-bold"
                  style={{ background: "rgba(99,102,241,0.15)", color: "rgba(165,180,252,0.9)" }}
                >
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
          <a
            href={meta.docsUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1 text-[11px] font-medium transition-opacity hover:opacity-80"
            style={{ color: "rgba(165,180,252,0.9)" }}
          >
            {meta.docsLabel} ↗
          </a>
        </div>

        {/* Key input */}
        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-medium" style={{ color: "var(--color-ps-ink-dim)" }}>
            API Key
          </label>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={key}
              onChange={(e) => { setKey(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              placeholder={meta.keyPlaceholder ?? "Paste your API key…"}
              className="w-full rounded-lg px-3 py-2.5 pr-10 text-[13px] font-mono"
              style={{
                background: "var(--color-ps-surface)",
                border: `1px solid ${error ? "var(--color-ps-error, #f87171)" : "var(--color-ps-border)"}`,
                color: "var(--color-ps-ink)",
                outline: "none",
              }}
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] transition-opacity hover:opacity-80"
              style={{ color: "var(--color-ps-ink-ghost)" }}
              aria-label={show ? "Hide key" : "Show key"}
            >
              {show ? "Hide" : "Show"}
            </button>
          </div>
          {error && (
            <p className="text-[11px]" style={{ color: "var(--color-ps-error, #f87171)" }}>
              {error}
            </p>
          )}
        </div>

        {/* Privacy note */}
        <div
          className="flex items-start gap-2.5 rounded-lg px-3 py-2.5"
          style={{
            background: "rgba(52,211,153,0.06)",
            border: "1px solid rgba(52,211,153,0.18)",
          }}
        >
          <span className="mt-0.5 text-[13px]">🔒</span>
          <p className="text-[11px] leading-relaxed" style={{ color: "rgba(134,239,172,0.85)" }}>
            Held in memory only. Cleared when you close the tab. Never stored
            in localStorage, never sent to anyone except {meta.label} directly.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-7 py-4"
        style={{ borderTop: "1px solid var(--color-ps-border)" }}
      >
        <button
          onClick={onBack}
          className="text-[13px] transition-opacity hover:opacity-80"
          style={{ color: "var(--color-ps-ink-dim)" }}
        >
          ← Back
        </button>
        <button
          onClick={handleSubmit}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-semibold transition-opacity hover:opacity-90"
          style={{ background: "var(--color-ps-accent)", color: "#fff" }}
        >
          Enter Studio →
        </button>
      </div>
    </div>
  );
}

// ─── Step 2b: Ollama model selection ─────────────────────────────────────────

function OllamaStep({
  onBack,
  onComplete,
}: {
  onBack: () => void;
  onComplete: (config: ProviderConfig) => void;
}) {
  const [state, setState] = useState<OllamaState>({ status: "loading", models: [] });
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    async function fetchModels() {
      try {
        const res = await fetch("/api/ollama/tags");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as {
          models?: Array<{ name: string; size: number; details?: { parameter_size?: string; family?: string } }>;
          error?: string;
        };
        if (data.error) throw new Error(data.error);
        const models = (data.models ?? []).map(classifyOllamaModel);
        const capableModels = models.filter((m) => m.capable);
        const status: OllamaStatus = capableModels.length > 0 ? "ready" : "no-capable";
        setState({ status, models });
        // Auto-select first recommended, then first capable
        const auto = models.find((m) => m.recommended) ?? capableModels[0];
        if (auto) setSelected(auto.name);
      } catch {
        setState({ status: "offline", models: [], error: "Ollama not detected at localhost:11434" });
      }
    }
    fetchModels();
  }, []);

  function handleEnter() {
    onComplete({ provider: "ollama", model: selected ?? undefined });
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Header */}
      <div className="px-7 pt-7 pb-5" style={{ borderBottom: "1px solid var(--color-ps-border)" }}>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(165,180,252,0.7)" }}>
          Step 2 of 2 · Ollama Local
        </p>
        <h2 className="text-[18px] font-bold tracking-tight" style={{ color: "var(--color-ps-ink)" }}>
          {state.status === "loading" ? "Checking localhost:11434…" : "Select a model"}
        </h2>
      </div>

      <div className="px-7 py-5 flex flex-col gap-4">
        {/* Loading */}
        {state.status === "loading" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div
              className="h-6 w-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--color-ps-accent)", borderTopColor: "transparent" }}
            />
            <p className="text-[13px]" style={{ color: "var(--color-ps-ink-dim)" }}>
              Looking for Ollama…
            </p>
          </div>
        )}

        {/* Model list */}
        {state.status === "ready" && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px]" style={{ color: "var(--color-ps-ink-ghost)" }}>
              {state.models.length} model{state.models.length !== 1 ? "s" : ""} installed
            </p>
            <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
              {state.models.map((m) => (
                <button
                  key={m.name}
                  onClick={() => m.capable && setSelected(m.name)}
                  disabled={!m.capable}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-left transition-all ${
                    m.capable ? "hover:scale-[1.005]" : "opacity-40 cursor-not-allowed"
                  }`}
                  style={{
                    background: selected === m.name ? "rgba(99,102,241,0.15)" : "var(--color-ps-raised)",
                    border: `1px solid ${selected === m.name ? "rgba(99,102,241,0.4)" : "var(--color-ps-border)"}`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{
                        background: selected === m.name
                          ? "rgba(165,180,252,1)"
                          : m.capable
                          ? "rgba(52,211,153,0.7)"
                          : "rgba(107,114,128,0.5)",
                      }}
                    />
                    <div>
                      <p className="text-[13px] font-mono font-medium" style={{ color: "var(--color-ps-ink)" }}>
                        {m.name}
                      </p>
                      <p className="text-[10px]" style={{ color: "var(--color-ps-ink-ghost)" }}>
                        {m.parameterSize !== "?" ? m.parameterSize : ""}{" "}
                        {m.sizeBytes > 0 ? `· ${formatBytes(m.sizeBytes)}` : ""}
                        {!m.capable ? " · Not capable for text generation" : ""}
                      </p>
                    </div>
                  </div>
                  {m.recommended && m.capable && (
                    <span
                      className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest"
                      style={{
                        background: "rgba(99,102,241,0.2)",
                        color: "rgba(165,180,252,0.9)",
                      }}
                    >
                      Recommended
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No capable models */}
        {(state.status === "no-capable" || state.status === "ready") &&
          state.models.filter((m) => m.capable).length === 0 && (
          <InstallSuggestions reason="no-capable" />
        )}

        {/* Ollama offline */}
        {state.status === "offline" && <InstallSuggestions reason="offline" />}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-7 py-4"
        style={{ borderTop: "1px solid var(--color-ps-border)" }}
      >
        <button
          onClick={onBack}
          className="text-[13px] transition-opacity hover:opacity-80"
          style={{ color: "var(--color-ps-ink-dim)" }}
        >
          ← Back
        </button>
        <div className="flex items-center gap-3">
          {state.status === "offline" && (
            <button
              onClick={() => {
                setState({ status: "loading", models: [] });
                // re-trigger effect by temporarily resetting
                setTimeout(() => window.location.reload(), 0);
              }}
              className="text-[13px] transition-opacity hover:opacity-80"
              style={{ color: "var(--color-ps-ink-dim)" }}
            >
              Retry
            </button>
          )}
          <button
            onClick={handleEnter}
            disabled={state.status === "loading"}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: "var(--color-ps-accent)", color: "#fff" }}
          >
            {selected ? "Enter Studio →" : "Enter Studio (auto-detect) →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function InstallSuggestions({ reason }: { reason: "offline" | "no-capable" }) {
  return (
    <div className="flex flex-col gap-4">
      <div
        className="rounded-xl p-4"
        style={{
          background: "rgba(239,68,68,0.06)",
          border: "1px solid rgba(239,68,68,0.18)",
        }}
      >
        <p className="text-[12px] font-medium mb-1" style={{ color: "rgba(252,165,165,0.9)" }}>
          {reason === "offline"
            ? "Ollama not detected at localhost:11434"
            : "No capable text-generation models found"}
        </p>
        <p className="text-[11px]" style={{ color: "var(--color-ps-ink-dim)" }}>
          {reason === "offline"
            ? "Install Ollama and ensure it's running, then pull a model."
            : "Pull a model capable of JSON generation:"}
        </p>
      </div>

      {reason === "offline" && (
        <div
          className="rounded-xl p-4 flex flex-col gap-2"
          style={{ background: "var(--color-ps-raised)", border: "1px solid var(--color-ps-border)" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-ps-ink-ghost)" }}>
            Setup
          </p>
          {[
            { step: "1", label: "Install Ollama", cmd: null, url: "https://ollama.com/download" },
            { step: "2", label: "Start the server", cmd: "ollama serve", url: null },
            { step: "3", label: "Pull a model (see below)", cmd: null, url: null },
          ].map((s) => (
            <div key={s.step} className="flex items-start gap-2">
              <span
                className="mt-0.5 h-4 w-4 shrink-0 rounded-full flex items-center justify-center text-[9px] font-bold"
                style={{ background: "rgba(99,102,241,0.15)", color: "rgba(165,180,252,0.9)" }}
              >
                {s.step}
              </span>
              <div>
                <p className="text-[12px]" style={{ color: "var(--color-ps-ink-dim)" }}>{s.label}</p>
                {s.cmd && (
                  <code
                    className="mt-0.5 block text-[11px] font-mono px-2 py-0.5 rounded"
                    style={{ background: "var(--color-ps-surface)", color: "var(--color-ps-ink)" }}
                  >
                    {s.cmd}
                  </code>
                )}
                {s.url && (
                  <a
                    href={s.url} target="_blank" rel="noreferrer"
                    className="text-[11px] underline underline-offset-2"
                    style={{ color: "rgba(165,180,252,0.9)" }}
                  >
                    {s.url}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-ps-ink-ghost)" }}>
          Recommended models to install
        </p>
        {SUGGESTED_INSTALLS.map((m) => (
          <div
            key={m.name}
            className="flex items-center justify-between rounded-xl px-4 py-3"
            style={{ background: "var(--color-ps-raised)", border: "1px solid var(--color-ps-border)" }}
          >
            <div>
              <p className="text-[12px] font-semibold font-mono" style={{ color: "var(--color-ps-ink)" }}>
                {m.name}
              </p>
              <p className="text-[11px]" style={{ color: "var(--color-ps-ink-dim)" }}>
                {m.description} · {m.size}
              </p>
            </div>
            <code
              className="text-[10px] font-mono px-2 py-1 rounded"
              style={{ background: "var(--color-ps-surface)", color: "var(--color-ps-ink-dim)" }}
            >
              ollama pull {m.name}
            </code>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Wizard root ──────────────────────────────────────────────────────────────

interface ProviderWizardProps {
  onComplete: (config: ProviderConfig) => void;
}

export function ProviderWizard({ onComplete }: ProviderWizardProps) {
  const [step, setStep]         = useState<WizardStep>("choose");
  const [provider, setProvider] = useState<Provider | null>(null);

  function handleProviderSelect(p: Provider) {
    setProvider(p);
    setStep("configure");
  }

  function handleBack() {
    setProvider(null);
    setStep("choose");
  }

  function handleSkip() {
    onComplete({ provider: "auto" });
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Choose AI provider"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)" }}
      />

      {/* Card */}
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: "var(--color-ps-canvas)",
          border: "1px solid var(--color-ps-border)",
          maxHeight: "90svh",
          overflowY: "auto",
        }}
      >
        {/* Step dots */}
        <div
          className="flex items-center justify-center gap-1.5 pt-4 pb-0"
        >
          {[0, 1].map((i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: (step === "choose" ? i === 0 : i === 1) ? 20 : 6,
                background: (step === "choose" ? i === 0 : i === 1)
                  ? "var(--color-ps-accent)"
                  : "var(--color-ps-border)",
              }}
            />
          ))}
        </div>

        {step === "choose" ? (
          <ChooseStep onSelect={handleProviderSelect} onSkip={handleSkip} />
        ) : provider === "ollama" ? (
          <OllamaStep onBack={handleBack} onComplete={onComplete} />
        ) : provider && provider !== "auto" ? (
          <ApiKeyStep
            provider={provider as Exclude<Provider, "auto" | "ollama">}
            onBack={handleBack}
            onComplete={onComplete}
          />
        ) : null}
      </div>
    </div>
  );
}
