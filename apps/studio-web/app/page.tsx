"use client";

import { useMemo, useState } from "react";
import type { Brief, PageBlueprint, AuditReport } from "@product-studio/shared-types";
import { createUxAuditAdapter } from "@product-studio/ux-audit";

import { StudioLayout } from "@/components/templates/StudioLayout";
import { Button } from "@/components/atoms/Button";
import { BriefView } from "@/components/organisms/BriefView";
import { BlueprintView } from "@/components/organisms/BlueprintView";
import { AuditPanel } from "@/components/organisms/AuditPanel";
import { ExportView } from "@/components/organisms/ExportView";
import type { Stage } from "@/components/organisms/StageBar";
import type { SidebarSection } from "@/components/organisms/Sidebar";
import type { RunSummary } from "@/components/molecules/RunItem";
import type { StudioRun, AuditFinding } from "@/lib/types";

/* ─── Initial state ─────────────────────────── */

const INITIAL_BRIEF: Brief = {
  productName: "Product Studio",
  audience: "Startup founders launching new SaaS products",
  valueProposition: "Go from idea to polished landing page with built-in UX quality checks.",
  tone: "bold",
  constraints: ["Keep copy concise", "Prioritize accessibility", "Strong CTA above the fold"],
  ctaGoal: "Start free trial",
};

/* ─── Helpers ────────────────────────────────── */

function buildMockBlueprint(brief: Brief): PageBlueprint {
  return {
    title: `${brief.productName} — Page Blueprint`,
    summary: `Message architecture focused on ${brief.audience}.`,
    sections: [
      {
        id: "hero",
        type: "hero",
        intent: `Communicate the core value: "${brief.valueProposition}"`,
        requiredComponents: ["headline", "subheadline", "primary-cta"],
      },
      {
        id: "problem",
        type: "problem",
        intent: "Surface the pain point before the solution lands harder",
        requiredComponents: ["problem-statement", "empathy-copy"],
      },
      {
        id: "features",
        type: "features",
        intent: "Show credibility through concrete product capabilities",
        requiredComponents: ["feature-grid", "proof-point", "icon-set"],
      },
      {
        id: "social-proof",
        type: "social-proof",
        intent: "Build trust with real customer outcomes",
        requiredComponents: ["testimonial-block", "logo-strip"],
      },
      {
        id: "cta",
        type: "cta",
        intent: `Drive conversion: "${brief.ctaGoal}"`,
        requiredComponents: ["cta-headline", "cta-button", "risk-reversal"],
      },
    ],
  };
}

function renderMockHtml(brief: Brief, blueprint: PageBlueprint): string {
  return `
    <html lang="en">
      <head><title>${brief.productName}</title><meta name="description" content="${brief.valueProposition}" /></head>
      <main>
        <h1>${brief.productName}</h1>
        <p>${brief.valueProposition}</p>
        <section>
          <h2>${blueprint.sections[2]?.intent ?? "Features"}</h2>
          <img src="/feature.png" alt="Feature preview" />
          <img src="/screenshot.png" />
        </section>
        <button>${brief.ctaGoal}</button>
      </main>
    </html>
  `;
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

/* ─── Page ───────────────────────────────────── */

export default function StudioPage() {
  const [brief, setBrief] = useState<Brief>(INITIAL_BRIEF);
  const [runs, setRuns] = useState<StudioRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>("");
  const [currentStage, setCurrentStage] = useState<Stage>("brief");
  const [activeSection, setActiveSection] = useState<SidebarSection | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);

  /* Derived */
  const selectedRun = useMemo(
    () => runs.find((r) => r.id === selectedRunId) ?? null,
    [runs, selectedRunId]
  );

  const runSummaries: RunSummary[] = useMemo(
    () =>
      runs.map((r) => ({
        id: r.id,
        runNumber: r.runNumber,
        productName: r.brief.productName,
        score: r.auditReport.score,
        reviewStatus: r.review.status,
        createdAt: r.createdAt,
      })),
    [runs]
  );

  const completedStages = useMemo<Stage[]>(() => {
    const stageOrder: Stage[] = ["brief", "blueprint", "audit", "export"];
    const currentIndex = stageOrder.indexOf(currentStage);
    return stageOrder.slice(0, currentIndex) as Stage[];
  }, [currentStage]);

  /* Actions */
  async function handleGenerate() {
    setIsGenerating(true);
    setCurrentStage("blueprint");

    const blueprint = buildMockBlueprint(brief);
    const html = renderMockHtml(brief, blueprint);

    const adapter = createUxAuditAdapter();
    const auditReport: AuditReport = await adapter.runAudit({
      html,
      urlOrSnapshotId: `${brief.productName.toLowerCase().replace(/\s+/g, "-")}-run-${runs.length + 1}`,
    });

    const newRun: StudioRun = {
      id: makeId("run"),
      runNumber: runs.length + 1,
      createdAt: new Date().toISOString(),
      brief: { ...brief },
      blueprint,
      auditReport,
      review: { status: "pending_review", events: [] },
    };

    setRuns((prev) => [newRun, ...prev]);
    setSelectedRunId(newRun.id);
    setIsGenerating(false);
    setCurrentStage("audit");
  }

  function handleSelectRun(id: string) {
    setSelectedRunId(id);
    setActiveSection(undefined);
    // If we have audit data for this run, jump to audit view
    const run = runs.find((r) => r.id === id);
    if (run) setCurrentStage("audit");
  }

  function handleNewRun() {
    setSelectedRunId("");
    setCurrentStage("brief");
    setActiveSection(undefined);
  }

  function handleAutoFix(_finding: AuditFinding) {
    // Phase 4: wire real auto-fix
    console.info("Auto-fix requested for:", _finding.id);
  }

  /* Top-bar actions per stage */
  const primaryAction = (() => {
    switch (currentStage) {
      case "brief":
        return (
          <Button
            variant="primary"
            size="md"
            onClick={handleGenerate}
            disabled={isGenerating || !brief.productName.trim()}
            style={{
              background: "linear-gradient(135deg, var(--color-ps-accent-dim), var(--color-ps-accent))",
              boxShadow: "0 4px 16px rgba(124,58,237,0.25)",
              border: "none",
              color: "var(--color-ps-accent-soft)",
            }}
          >
            {isGenerating ? "Generating…" : "Generate →"}
          </Button>
        );
      case "blueprint":
        return selectedRun ? (
          <Button variant="primary" size="md" onClick={() => setCurrentStage("audit")}>
            View Audit →
          </Button>
        ) : null;
      case "audit":
        return selectedRun ? (
          <Button variant="primary" size="md" onClick={() => setCurrentStage("export")}>
            Proceed to Export →
          </Button>
        ) : null;
      case "export":
        return null;
    }
  })();

  const secondaryAction = (() => {
    if (currentStage === "audit" && selectedRun) {
      return (
        <Button variant="ghost" size="md" onClick={handleGenerate} disabled={isGenerating}>
          Re-Audit
        </Button>
      );
    }
    if (currentStage === "export") {
      return (
        <Button variant="ghost" size="md" onClick={() => setCurrentStage("audit")}>
          ← Back to Audit
        </Button>
      );
    }
    return undefined;
  })();

  /* Stage content */
  function renderCanvas() {
    switch (currentStage) {
      case "brief":
        return (
          <BriefView
            brief={brief}
            onChange={setBrief}
            isGenerating={isGenerating}
          />
        );
      case "blueprint":
        return (
          <BlueprintView
            blueprint={selectedRun?.blueprint ?? null}
            isGenerating={isGenerating}
          />
        );
      case "audit":
        return (
          <AuditPanel
            auditReport={selectedRun?.auditReport ?? null}
            onAutoFix={handleAutoFix}
            isGenerating={isGenerating}
          />
        );
      case "export":
        return (
          <ExportView
            run={selectedRun}
          />
        );
    }
  }

  return (
    <StudioLayout
      runs={runSummaries}
      selectedRunId={selectedRunId}
      onSelectRun={handleSelectRun}
      onNewRun={handleNewRun}
      activeSection={activeSection}
      onNavigate={(section) => {
        setActiveSection(section);
      }}
      projectName={selectedRun?.brief.productName ?? brief.productName}
      currentStage={currentStage}
      completedStages={completedStages}
      onStageClick={(stage) => {
        // Only allow clicking back to completed stages
        if (completedStages.includes(stage) || stage === currentStage) {
          setCurrentStage(stage);
        }
      }}
      primaryAction={primaryAction}
      secondaryAction={secondaryAction}
    >
      {renderCanvas()}
    </StudioLayout>
  );
}
