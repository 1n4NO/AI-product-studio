"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ProductStudio] Unhandled error:", error.message, info.componentStack);
  }

  private clearAndReload = () => {
    try { localStorage.clear(); } catch {}
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        className="flex items-center justify-center min-h-screen p-6"
        style={{ background: "var(--color-ps-canvas)" }}
      >
        <div
          className="w-full max-w-md rounded-2xl overflow-hidden shadow-xl"
          style={{
            background:  "var(--color-ps-surface)",
            border:      "1px solid var(--color-ps-border)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-start gap-3 px-6 py-5 border-b"
            style={{ borderColor: "var(--color-ps-border)" }}
          >
            <span
              className="text-xl mt-0.5 shrink-0"
              aria-hidden="true"
              style={{ color: "var(--color-ps-err)" }}
            >
              ⚠
            </span>
            <div>
              <h1 className="text-sm font-semibold" style={{ color: "var(--color-ps-ink)" }}>
                Something went wrong
              </h1>
              <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "var(--color-ps-ink-ghost)" }}>
                Product Studio encountered an unexpected error. Your data is safe — try reloading.
              </p>
            </div>
          </div>

          {/* Error detail */}
          <div className="px-6 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--color-ps-ink-ghost)" }}>
              Error detail
            </p>
            <pre
              className="text-[10px] font-mono p-3 rounded-lg overflow-auto max-h-32 whitespace-pre-wrap break-all"
              style={{
                background: "var(--color-ps-raised)",
                color:      "var(--color-ps-err)",
                border:     "1px solid var(--color-ps-border)",
              }}
            >
              {error.message || String(error)}
            </pre>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 rounded-lg py-2 text-sm font-semibold text-center transition-opacity hover:opacity-90"
              style={{
                background: "var(--color-ps-accent)",
                color:      "var(--color-ps-accent-soft)",
              }}
            >
              Reload page
            </button>
            <button
              onClick={this.clearAndReload}
              className="rounded-lg py-2 px-4 text-sm transition-colors hover:bg-ps-raised"
              style={{
                background: "transparent",
                color:      "var(--color-ps-ink-dim)",
                border:     "1px solid var(--color-ps-border)",
              }}
            >
              Clear data &amp; reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
