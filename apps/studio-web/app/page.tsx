"use client";

import { useCallback, useMemo, useState } from "react";
import type { Brief, PageBlueprint, AuditReport, ThemeTokens } from "@product-studio/shared-types";
import { createUxAuditAdapter } from "@product-studio/ux-audit";

import { StudioLayout } from "@/components/templates/StudioLayout";
import { Button } from "@/components/atoms/Button";
import { Tabs } from "@/components/molecules/Tabs";
import { BriefView } from "@/components/organisms/BriefView";
import { BlueprintView } from "@/components/organisms/BlueprintView";
import { AuditPanel } from "@/components/organisms/AuditPanel";
import { ExportView } from "@/components/organisms/ExportView";
import { ThemePanel } from "@/components/organisms/ThemePanel";
import { ReviewDrawer } from "@/components/organisms/ReviewDrawer";
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

/* ─── Fallback mock blueprint ────────────────── */

function buildMockBlueprint(brief: Brief): PageBlueprint {
  return {
    title: `${brief.productName} — Page Blueprint`,
    summary: `Message architecture focused on ${brief.audience}.`,
    sections: [
      { id: "hero",         type: "hero",         intent: `Lead with: "${brief.valueProposition}"`,       requiredComponents: ["headline", "subheadline", "primary-cta", "hero-visual"] },
      { id: "problem",      type: "problem",      intent: "Validate the audience's pain first",            requiredComponents: ["pain-points-grid", "empathy-statement", "transition-hook"] },
      { id: "solution",     type: "solution",     intent: `Position ${brief.productName} as the answer`,  requiredComponents: ["solution-headline", "benefit-pillars", "product-screenshot"] },
      { id: "features",     type: "features",     intent: "Build credibility with concrete capabilities",  requiredComponents: ["feature-grid", "feature-icons", "proof-metrics"] },
      { id: "social-proof", type: "social-proof", intent: "Reduce risk with real customer outcomes",      requiredComponents: ["testimonial-carousel", "company-logo-strip", "outcome-stats"] },
      { id: "cta",          type: "cta",          intent: `Drive: "${brief.ctaGoal}"`,                    requiredComponents: ["cta-headline", "primary-cta-button", "risk-reversal-copy"] },
    ],
  };
}

function renderMockHtml(brief: Brief, blueprint: PageBlueprint): string {
  return `<html lang="en">
    <head><title>${brief.productName}</title><meta name="description" content="${brief.valueProposition}" /></head>
    <main>
      <h1>${brief.productName}</h1>
      <p>${brief.valueProposition}</p>
      <section><h2>${blueprint.sections[2]?.intent ?? "Features"}</h2>
        <img src="/feature.png" alt="Feature preview" /><img src="/screenshot.png" />
      </section>
      <button>${brief.ctaGoal}</button>
    </main>
  </html>`;
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

/* ─── Blueprint + Theme tabs ─────────────────── */

const BLUEPRINT_TABS = [
  { id: "blueprint", label: "Blueprint" },
  { id: "theme",     label: "Theme" },
];

/* ─── Page ───────────────────────────────────── */

export default function StudioPage() {
  const [brief, setBrief]               = useState<Brief>(INITIAL_BRIEF);
  const [runs, setRuns]                 = useState<StudioRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>("");
  const [currentStage, setCurrentStage] = useState<Stage>("brief");
  const [activeSection, setActiveSection] = useState<SidebarSection | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [blueprintTab, setBlueprintTab] = useState<string>("blueprint");
  const [selectedTheme, setSelectedTheme] = useState<ThemeTokens | null>(null);
  const [reviewOpen, setReviewOpen]     = useState(false);

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
    const order: Stage[] = ["brief", "blueprint", "audit", "export"];
    return order.slice(0, order.indexOf(currentStage)) as Stage[];
  }, [currentStage]);

  /* Actions */
  async function handleGenerate() {
    setIsGenerating(true);
    setCurrentStage("blueprint");

    // Call real blueprint API, fall back to local mock
    let blueprint: PageBlueprint;
    try {
      const res = await fetch("/api/protected/generate/blueprint", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(brief),
      });
      if (!res.ok) throw new Error("API error");
      blueprint = (await res.json()) as PageBlueprint;
    } catch {
      console.warn("[Studio] Blueprint API failed — using client-side mock");
      blueprint = buildMockBlueprint(brief);
    }

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
    if (runs.find((r) => r.id === id)) setCurrentStage("audit");
  }

  function handleNewRun() {
    setSelectedRunId("");
    setCurrentStage("brief");
    setActiveSection(undefined);
  }

  function handleAutoFix(_finding: AuditFinding) {
    console.info("Auto-fix requested for:", _finding.id);
  }

  const handleApprove = useCallback((runId: string, note: string) => {
    setRuns((prev) =>
      prev.map((r) =>
        r.id !== runId
          ? r
          : {
              ...r,
              review: {
                status: "approved",
                events: [
                  ...r.review.events,
                  { id: makeId("ev"), at: new Date().toISOString(), action: "approved", reviewer: "You", note },
                ],
              },
            }
      )
    );
  }, []);

  const handleReject = useCallback((runId: string, note: string) => {
    setRuns((prev) =>
      prev.map((r) =>
        r.id !== runId
          ? r
          : {
              ...r,
              review: {
                status: "rejected",
                events: [
                  ...r.review.events,
                  { id: makeId("ev"), at: new Date().toISOString(), action: "rejected", reviewer: "You", note },
                ],
              },
            }
      )
    );
  }, []);

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
        <div className="flex gap-2">
          <Button variant="ghost" size="md" onClick={() => setReviewOpen(true)}>
            Review
          </Button>
          <Button variant="ghost" size="md" onClick={handleGenerate} disabled={isGenerating}>
            Re-Audit
          </Button>
        </div>
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
        return <BriefView brief={brief} onChange={setBrief} isGenerating={isGenerating} />;

      case "blueprint":
        return (
          <div className="flex flex-col gap-4 h-full">
            <Tabs items={BLUEPRINT_TABS} activeId={blueprintTab} onChange={setBlueprintTab} />
            <div
              id={`tabpanel-blueprint`}
              role="tabpanel"
              aria-labelledby="tab-blueprint"
              hidden={blueprintTab !== "blueprint"}
              className="flex-1"
            >
              <BlueprintView blueprint={selectedRun?.blueprint ?? null} isGenerating={isGenerating} />
            </div>
            <div
              id={`tabpanel-theme`}
              role="tabpanel"
              aria-labelledby="tab-theme"
              hidden={blueprintTab !== "theme"}
              className="flex-1"
            >
              <ThemePanel brief={brief} selectedTheme={selectedTheme} onSelectTheme={setSelectedTheme} />
            </div>
          </div>
        );

      case "audit":
        return (
          <AuditPanel auditReport={selectedRun?.auditReport ?? null} onAutoFix={handleAutoFix} isGenerating={isGenerating} />
        );

      case "export":
        return <ExportView run={selectedRun} />;
    }
  }

  return (
    <>
      <StudioLayout
        runs={runSummaries}
        selectedRunId={selectedRunId}
        onSelectRun={handleSelectRun}
        onNewRun={handleNewRun}
        activeSection={activeSection}
        onNavigate={(section) => setActiveSection(section)}
        projectName={selectedRun?.brief.productName ?? brief.productName}
        currentStage={currentStage}
        completedStages={completedStages}
        onStageClick={(stage) => {
          if (completedStages.includes(stage) || stage === currentStage) {
            setCurrentStage(stage);
          }
        }}
        primaryAction={primaryAction}
        secondaryAction={secondaryAction}
      >
        {renderCanvas()}
      </StudioLayout>

      <ReviewDrawer
        run={selectedRun}
        isOpen={reviewOpen}
        onClose={() => setReviewOpen(false)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </>
  );
}
