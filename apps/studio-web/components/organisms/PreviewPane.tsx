"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useTheme } from "@/lib/useTheme";

interface PreviewPaneProps {
  html: string;
  className?: string;
}

type Viewport = "desktop" | "tablet" | "mobile";

const VIEWPORTS: { id: Viewport; label: string; icon: string; width: number | "fill" }[] = [
  { id: "desktop", label: "Desktop", icon: "⊡",  width: "fill" },
  { id: "tablet",  label: "Tablet",  icon: "▭",  width: 768    },
  { id: "mobile",  label: "Mobile",  icon: "▯",  width: 390    },
];

export function PreviewPane({ html, className }: PreviewPaneProps) {
  const [viewport, setViewport]  = useState<Viewport>("desktop");
  const containerRef             = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(0);
  const { mode } = useTheme();

  /* Track container width for scale computation */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerW(el.clientWidth));
    ro.observe(el);
    setContainerW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const vp = VIEWPORTS.find((v) => v.id === viewport)!;
  const iframeW = vp.width === "fill" ? containerW : vp.width;
  const scale   = vp.width === "fill" || containerW === 0 ? 1 : Math.min(1, containerW / vp.width);
  const iframeH = 680; // fixed logical height; scroll inside iframe handles the rest

  function openInTab() {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  return (
    <div className={cn("flex flex-col gap-0", className)}>
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b shrink-0 rounded-t-xl"
        style={{
          background:   "var(--color-ps-surface)",
          borderColor:  "var(--color-ps-border)",
        }}
      >
        {/* Viewport switcher */}
        <div
          className="flex items-center gap-0.5 p-0.5 rounded-lg"
          style={{ background: "var(--color-ps-raised)" }}
          role="group"
          aria-label="Viewport size"
        >
          {VIEWPORTS.map((v) => (
            <button
              key={v.id}
              onClick={() => setViewport(v.id)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all"
              style={{
                background: viewport === v.id ? "var(--color-ps-canvas)" : "transparent",
                color:      viewport === v.id ? "var(--color-ps-ink)"    : "var(--color-ps-ink-ghost)",
                boxShadow:  viewport === v.id ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
              }}
              aria-pressed={viewport === v.id}
            >
              <span aria-hidden="true">{v.icon}</span>
              {v.label}
              {v.width !== "fill" && (
                <span className="font-mono text-[9px]" style={{ color: "var(--color-ps-ink-ghost)" }}>
                  {v.width}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Scale badge */}
          {scale < 1 && (
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 rounded"
              style={{
                background: "var(--color-ps-raised)",
                color:      "var(--color-ps-ink-ghost)",
                border:     "1px solid var(--color-ps-border)",
              }}
            >
              {Math.round(scale * 100)}%
            </span>
          )}
          {/* Theme indicator */}
          <span
            className="text-[10px]"
            style={{ color: "var(--color-ps-ink-ghost)" }}
            title="Preview matches your current theme"
          >
            {mode === "dark" || mode === "system" ? "☽" : "☀"}
          </span>
          {/* Open in new tab */}
          <button
            onClick={openInTab}
            className="text-[11px] px-2 py-1 rounded-md transition-colors hover:bg-ps-raised"
            style={{ color: "var(--color-ps-ink-ghost)" }}
            title="Open preview in new tab"
            aria-label="Open preview in new tab"
          >
            ↗
          </button>
        </div>
      </div>

      {/* Preview frame */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-b-xl border border-t-0 flex-1"
        style={{
          borderColor:  "var(--color-ps-border)",
          background:   "var(--color-ps-raised)",
          minHeight:    Math.round(iframeH * scale) + 32,
        }}
      >
        {/* Centering wrapper */}
        <div
          className="flex justify-center"
          style={{ paddingTop: 16, paddingBottom: 16 }}
        >
          <div
            style={{
              width:           iframeW,
              height:          iframeH,
              transformOrigin: "top center",
              transform:       scale < 1 ? `scale(${scale})` : "none",
              marginBottom:    scale < 1 ? `${-(iframeH * (1 - scale))}px` : 0,
              borderRadius:    viewport === "mobile" ? 16 : 8,
              overflow:        "hidden",
              boxShadow:       "0 2px 24px rgba(0,0,0,0.25)",
              border:          "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <iframe
              srcDoc={html}
              sandbox="allow-scripts"
              title="Live page preview"
              width={iframeW}
              height={iframeH}
              style={{ display: "block", border: "none", width: "100%", height: "100%" }}
              loading="eager"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
