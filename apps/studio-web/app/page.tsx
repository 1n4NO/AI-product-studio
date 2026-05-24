"use client";

import { useMemo, useState } from "react";
import type { AuditReport, Brief, PageBlueprint } from "@product-studio/shared-types";
import { createUxAuditAdapter } from "@product-studio/ux-audit";

const initialBrief: Brief = {
  productName: "Product Studio",
  audience: "Startup founders launching new SaaS products",
  valueProposition: "Go from idea to polished landing page with built-in UX quality checks.",
  tone: "bold",
  constraints: ["Keep copy concise", "Prioritize accessibility", "Strong CTA above the fold"],
  ctaGoal: "Start free trial"
};

function buildMockBlueprint(brief: Brief): PageBlueprint {
  return {
    title: `${brief.productName} Landing Page Blueprint`,
    summary: `Message architecture focused on ${brief.audience}.`,
    sections: [
      {
        id: "hero",
        type: "hero",
        intent: `Communicate ${brief.valueProposition}`,
        requiredComponents: ["headline", "subheadline", "primary-cta"]
      },
      {
        id: "features",
        type: "features",
        intent: "Show credibility through concrete product capabilities",
        requiredComponents: ["feature-grid", "proof-point"]
      },
      {
        id: "cta",
        type: "cta",
        intent: `Drive conversion on: ${brief.ctaGoal}`,
        requiredComponents: ["cta-copy", "cta-button"]
      }
    ]
  };
}

function renderMockHtml(brief: Brief, blueprint: PageBlueprint): string {
  return `
    <main>
      <h1>${brief.productName}</h1>
      <section>
        <p>${brief.valueProposition}</p>
      </section>
      <section>
        <h2>${blueprint.sections[1]?.intent ?? "Features"}</h2>
        <img src="/feature.png" alt="Feature preview" />
      </section>
      <button>${brief.ctaGoal}</button>
    </main>
  `;
}

export default function Home() {
  const [brief, setBrief] = useState<Brief>(initialBrief);
  const [blueprint, setBlueprint] = useState<PageBlueprint | null>(null);
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(false);

  const constraintsText = useMemo(() => brief.constraints.join("\n"), [brief.constraints]);

  async function handleGenerate() {
    setLoading(true);
    const nextBlueprint = buildMockBlueprint(brief);
    setBlueprint(nextBlueprint);

    const html = renderMockHtml(brief, nextBlueprint);
    const adapter = createUxAuditAdapter();
    const report = await adapter.runAudit({
      html,
      urlOrSnapshotId: `${brief.productName.toLowerCase().replace(/\s+/g, "-")}-draft`
    });
    setAuditReport(report);
    setLoading(false);
  }

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: 24, fontFamily: "sans-serif" }}>
      <h1>Product Studio</h1>
      <p>Brief -&gt; Mock Blueprint -&gt; Audit Report</p>

      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h2>Brief Form</h2>
        <label>
          Product Name
          <input
            value={brief.productName}
            onChange={(e) => setBrief((prev) => ({ ...prev, productName: e.target.value }))}
            style={{ display: "block", width: "100%", marginTop: 4, marginBottom: 10 }}
          />
        </label>
        <label>
          Audience
          <input
            value={brief.audience}
            onChange={(e) => setBrief((prev) => ({ ...prev, audience: e.target.value }))}
            style={{ display: "block", width: "100%", marginTop: 4, marginBottom: 10 }}
          />
        </label>
        <label>
          Value Proposition
          <textarea
            value={brief.valueProposition}
            onChange={(e) => setBrief((prev) => ({ ...prev, valueProposition: e.target.value }))}
            style={{ display: "block", width: "100%", marginTop: 4, marginBottom: 10, minHeight: 70 }}
          />
        </label>
        <label>
          Constraints (one per line)
          <textarea
            value={constraintsText}
            onChange={(e) =>
              setBrief((prev) => ({
                ...prev,
                constraints: e.target.value
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean)
              }))
            }
            style={{ display: "block", width: "100%", marginTop: 4, marginBottom: 10, minHeight: 90 }}
          />
        </label>
        <label>
          CTA Goal
          <input
            value={brief.ctaGoal}
            onChange={(e) => setBrief((prev) => ({ ...prev, ctaGoal: e.target.value }))}
            style={{ display: "block", width: "100%", marginTop: 4, marginBottom: 10 }}
          />
        </label>

        <button onClick={handleGenerate} disabled={loading}>
          {loading ? "Generating..." : "Generate Blueprint + Run Audit"}
        </button>
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h2>Blueprint Output</h2>
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {blueprint ? JSON.stringify(blueprint, null, 2) : "No blueprint generated yet."}
        </pre>
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
        <h2>Audit Panel</h2>
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {auditReport ? JSON.stringify(auditReport, null, 2) : "No audit report yet."}
        </pre>
      </section>
    </main>
  );
}
