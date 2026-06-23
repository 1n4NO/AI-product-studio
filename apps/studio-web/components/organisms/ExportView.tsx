"use client";

import { useState } from "react";
import type { StudioRun } from "@/lib/types";
import { evaluateAuditGate } from "@product-studio/ux-audit/gates";
import { cn } from "@/lib/cn";

interface ExportViewProps {
  run: StudioRun | null;
  baselineRun?: StudioRun | null;
}

const CHECKS = [
  { label: "Schema validity",          key: "schema" },
  { label: "Content quality baseline", key: "content" },
  { label: "UX audit threshold",       key: "SCORE_TOO_LOW" },
  { label: "Accessibility safeguards", key: "accessibility" },
  { label: "No score regression",      key: "REGRESSION" },
];

type ArtifactId = "brief" | "blueprint" | "theme" | "audit" | "bundle";

interface Artifact {
  id: ArtifactId;
  icon: string;
  label: string;
  desc: string;
  ext: string;
  alwaysEnabled?: boolean;
}

const ARTIFACTS: Artifact[] = [
  { id: "brief",     icon: "◻", label: "Brief JSON",     desc: "Canonical brief schema",          ext: "json" },
  { id: "blueprint", icon: "◈", label: "Page Blueprint", desc: "Section structure + intent",      ext: "json" },
  { id: "audit",     icon: "◎", label: "Audit Report",   desc: "Findings + recommendations",      ext: "json" },
  { id: "theme",     icon: "◆", label: "Theme CSS",      desc: "CSS custom properties",           ext: "css",  alwaysEnabled: true },
  { id: "bundle",    icon: "▣", label: "Full Bundle",    desc: "All artifacts as a .zip",         ext: "zip",  alwaysEnabled: true },
];

/* ─── Download helpers ──────────────────────── */

function downloadBlob(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function tokensToCss(tokens: Record<string, string> | undefined): string {
  if (!tokens) return ":root {}";
  const lines = Object.entries(tokens).map(([k, v]) => `  --color-${k}: ${v};`);
  return `:root {\n${lines.join("\n")}\n}`;
}

async function generateZip(files: Array<{ name: string; content: string }>): Promise<Blob> {
  // Minimal ZIP builder — no external dependency needed for small text files
  // Uses the CompressionStream API (available in all modern browsers + Node 18+)
  // For simplicity we produce an uncompressed ZIP (STORE method)
  const enc  = new TextEncoder();
  const parts: Uint8Array[] = [];
  const centralDir: { name: Uint8Array; offset: number; size: number; crc: number }[] = [];

  function crc32(data: Uint8Array): number {
    const table = crc32.table ??= (() => {
      const t = new Uint32Array(256);
      for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        t[n] = c;
      }
      return t;
    })();
    let c = 0xffffffff;
    for (const b of data) c = table[(c ^ b) & 0xff]! ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }
  crc32.table = undefined as unknown as Uint32Array;

  function u16le(n: number) { return new Uint8Array([n & 0xff, (n >> 8) & 0xff]); }
  function u32le(n: number) { return new Uint8Array([n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff]); }

  let offset = 0;
  for (const file of files) {
    const nameBytes = enc.encode(file.name);
    const dataBytes = enc.encode(file.content);
    const crc       = crc32(dataBytes);
    const localHdr  = new Uint8Array([
      0x50, 0x4b, 0x03, 0x04, // signature
      0x14, 0x00,             // version needed
      0x00, 0x00,             // flags
      0x00, 0x00,             // compression (STORE)
      0x00, 0x00, 0x00, 0x00, // mod time/date
      ...u32le(crc),
      ...u32le(dataBytes.length),
      ...u32le(dataBytes.length),
      ...u16le(nameBytes.length),
      0x00, 0x00,             // extra field length
      ...nameBytes,
    ]);
    centralDir.push({ name: nameBytes, offset, size: dataBytes.length, crc });
    parts.push(localHdr, dataBytes);
    offset += localHdr.length + dataBytes.length;
  }

  const cdStart = offset;
  for (const { name, offset: fOffset, size, crc } of centralDir) {
    const cdHdr = new Uint8Array([
      0x50, 0x4b, 0x01, 0x02,
      0x14, 0x00, 0x14, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      ...u32le(crc),
      ...u32le(size), ...u32le(size),
      ...u16le(name.length),
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      ...u32le(fOffset),
      ...name,
    ]);
    parts.push(cdHdr);
    offset += cdHdr.length;
  }

  const cdSize = offset - cdStart;
  const eocd = new Uint8Array([
    0x50, 0x4b, 0x05, 0x06,
    0x00, 0x00, 0x00, 0x00,
    ...u16le(centralDir.length), ...u16le(centralDir.length),
    ...u32le(cdSize), ...u32le(cdStart),
    0x00, 0x00,
  ]);
  parts.push(eocd);

  const total = parts.reduce((a, b) => a + b.length, 0);
  const out   = new Uint8Array(total);
  let pos = 0;
  for (const p of parts) { out.set(p, pos); pos += p.length; }
  return new Blob([out], { type: "application/zip" });
}

/* ─── Export handler ────────────────────────── */

function useExporter(run: StudioRun | null) {
  const [downloading, setDownloading] = useState<ArtifactId | null>(null);

  async function handleExport(id: ArtifactId) {
    if (!run) return;
    setDownloading(id);
    const slug = slugify(run.brief.productName);

    try {
      if (id === "brief") {
        downloadBlob(`${slug}-brief.json`, JSON.stringify(run.brief, null, 2), "application/json");
      } else if (id === "blueprint") {
        downloadBlob(`${slug}-blueprint.json`, JSON.stringify(run.blueprint, null, 2), "application/json");
      } else if (id === "audit") {
        downloadBlob(`${slug}-audit.json`, JSON.stringify(run.auditReport, null, 2), "application/json");
      } else if (id === "theme") {
        const css = tokensToCss({});  // no selected theme stored on run yet — export placeholder
        downloadBlob(`${slug}-theme.css`, css, "text/css");
      } else if (id === "bundle") {
        const files = [
          { name: `${slug}-brief.json`,     content: JSON.stringify(run.brief,       null, 2) },
          { name: `${slug}-blueprint.json`, content: JSON.stringify(run.blueprint,   null, 2) },
          { name: `${slug}-audit.json`,     content: JSON.stringify(run.auditReport, null, 2) },
          { name: `${slug}-theme.css`,      content: tokensToCss({}) },
        ];
        const zip = await generateZip(files);
        const url = URL.createObjectURL(zip);
        const a   = document.createElement("a");
        a.href = url; a.download = `${slug}-bundle.zip`; a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setDownloading(null);
    }
  }

  return { handleExport, downloading };
}

/* ─── Component ─────────────────────────────── */

export function ExportView({ run, baselineRun }: ExportViewProps) {
  const { handleExport, downloading } = useExporter(run);

  if (!run) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-5 border"
          style={{
            background: "linear-gradient(135deg, var(--color-ps-surface), var(--color-ps-accent-tint))",
            borderColor: "var(--color-ps-border)",
          }}
        >
          ▣
        </div>
        <p className="text-[15px] font-semibold mb-2" style={{ color: "var(--color-ps-ink)" }}>
          No run selected
        </p>
        <p className="text-[13px] max-w-xs" style={{ color: "var(--color-ps-ink-ghost)" }}>
          Select a run from the sidebar to evaluate export readiness.
        </p>
      </div>
    );
  }

  const gateResult     = evaluateAuditGate(run.auditReport, baselineRun?.auditReport ?? null);
  const passed         = gateResult.passed;
  const violationCodes = new Set(gateResult.violations.map((v) => v.code));

  return (
    <div className="max-w-2xl flex flex-col gap-4">
      {/* Gate hero */}
      <div
        className="rounded-xl border p-6 flex items-center gap-5"
        style={{
          borderColor: passed ? "rgba(48,160,96,0.3)" : "rgba(239,68,68,0.3)",
          background:  passed ? "rgba(48,160,96,0.05)" : "rgba(239,68,68,0.05)",
          boxShadow:   passed ? "0 0 30px rgba(48,160,96,0.08)" : undefined,
        }}
      >
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0 border"
          style={{
            borderColor: passed ? "rgba(48,160,96,0.3)" : "rgba(239,68,68,0.3)",
            background:  passed ? "rgba(48,160,96,0.1)" : "rgba(239,68,68,0.1)",
          }}
        >
          {passed ? "✓" : "✕"}
        </div>
        <div>
          <h2
            className="text-[18px] font-bold mb-1"
            style={{ color: passed ? "var(--color-ps-ok)" : "var(--color-ps-err)" }}
          >
            {passed ? "Export Gate Passed" : "Export Blocked"}
          </h2>
          <p className="text-[12px]" style={{ color: "var(--color-ps-ink-dim)" }}>
            {gateResult.summary}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Gate checklist */}
        <div
          className="rounded-xl border p-5"
          style={{ background: "var(--color-ps-surface)", borderColor: "var(--color-ps-border)" }}
        >
          <h3
            className="text-[10px] font-semibold uppercase tracking-widest mb-4"
            style={{ color: "var(--color-ps-ink-ghost)" }}
          >
            Gate Checks
          </h3>
          <div className="flex flex-col divide-y" style={{ borderColor: "var(--color-ps-border)" }}>
            {CHECKS.map(({ label, key }) => {
              const failed =
                violationCodes.has(key as Parameters<typeof violationCodes.has>[0]) ||
                (key === "accessibility" && run.auditReport.findings.some((f) => f.severity === "critical"));
              return (
                <div key={key} className="flex items-center gap-3 py-2.5">
                  <span
                    className="text-[13px] shrink-0 font-bold"
                    style={{ color: failed ? "var(--color-ps-err)" : "var(--color-ps-ok)" }}
                  >
                    {failed ? "✕" : "✓"}
                  </span>
                  <span className="flex-1 text-[12px]" style={{ color: "var(--color-ps-ink-dim)" }}>
                    {label}
                  </span>
                  <span className="text-[10px] font-mono" style={{ color: "var(--color-ps-ink-ghost)" }}>
                    {key === "SCORE_TOO_LOW" ? `${run.auditReport.score}/100` : failed ? "fail" : "pass"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Download artifacts */}
        <div
          className="rounded-xl border p-5"
          style={{ background: "var(--color-ps-surface)", borderColor: "var(--color-ps-border)" }}
        >
          <h3
            className="text-[10px] font-semibold uppercase tracking-widest mb-4"
            style={{ color: "var(--color-ps-ink-ghost)" }}
          >
            Artifacts
          </h3>
          <div className="flex flex-col gap-2">
            {ARTIFACTS.map(({ id, icon, label, desc, alwaysEnabled }) => {
              const enabled   = alwaysEnabled || passed;
              const isLoading = downloading === id;
              return (
                <button
                  key={id}
                  onClick={() => handleExport(id)}
                  disabled={!enabled || isLoading}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-left",
                    "disabled:opacity-40 disabled:cursor-not-allowed"
                  )}
                  style={{
                    background:   "var(--color-ps-raised)",
                    borderColor:  "var(--color-ps-border)",
                  }}
                  onMouseEnter={(e) => {
                    if (enabled && !isLoading) {
                      e.currentTarget.style.borderColor = "rgba(124,58,237,0.3)";
                      e.currentTarget.style.background  = "var(--color-ps-accent-tint)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-ps-border)";
                    e.currentTarget.style.background  = "var(--color-ps-raised)";
                  }}
                >
                  <span
                    className="text-[16px] w-5 text-center shrink-0"
                    style={{ color: "var(--color-ps-ink-ghost)" }}
                  >
                    {icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold" style={{ color: "var(--color-ps-ink)" }}>
                      {label}
                    </p>
                    <p className="text-[10px]" style={{ color: "var(--color-ps-ink-ghost)" }}>
                      {desc}
                    </p>
                  </div>
                  <span className="text-[12px]" style={{ color: "var(--color-ps-ink-ghost)" }}>
                    {isLoading ? "…" : "↓"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Violations detail */}
      {gateResult.violations.length > 0 && (
        <div
          className="rounded-xl border p-5"
          style={{
            borderColor: "rgba(239,68,68,0.2)",
            background:  "rgba(239,68,68,0.05)",
          }}
        >
          <h3
            className="text-[10px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: "var(--color-ps-err)" }}
          >
            Gate Violations
          </h3>
          <div className="flex flex-col gap-2">
            {gateResult.violations.map((v) => (
              <div key={v.code} className="flex gap-3">
                <span className="text-[11px] font-mono shrink-0" style={{ color: "var(--color-ps-err)" }}>
                  {v.code}
                </span>
                <span className="text-[11px]" style={{ color: "var(--color-ps-ink-dim)" }}>
                  {v.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
