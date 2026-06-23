"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Spinner } from "@/components/atoms/Spinner";
import { ComparePanel } from "@/components/organisms/ComparePanel";
import { SloPanel } from "@/components/organisms/SloPanel";
import { ExportsPanel } from "@/components/organisms/ExportsPanel";
import { OnboardingHero } from "@/components/organisms/OnboardingHero";
import { TemplateDrawer } from "@/components/organisms/TemplateDrawer";
import { PreviewPane } from "@/components/organisms/PreviewPane";
import { renderPageHtml } from "@/lib/renderHtml";
import { ShortcutsModal } from "@/components/molecules/ShortcutsModal";
import { useStageTransition } from "@/lib/useStageTransition";
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
import { CopyPanel } from "@/components/organisms/CopyPanel";
import { ReviewDrawer } from "@/components/organisms/ReviewDrawer";
import { SettingsDrawer } from "@/components/organisms/SettingsDrawer";
import type { AppSettings } from "@/components/organisms/SettingsDrawer";
import { DEFAULT_SETTINGS } from "@/components/organisms/SettingsDrawer";
import type { Stage } from "@/components/organisms/StageBar";
import type { SidebarSection } from "@/components/organisms/Sidebar";
import type { RunSummary } from "@/components/molecules/RunItem";
import type { StudioRun, AuditFinding } from "@/lib/types";
import { useToast } from "@/lib/toast";
import { storage, STORAGE_KEYS } from "@/lib/persistence";

/* ─── Constants ──────────────────────────────── */

const INITIAL_BRIEF: Brief = {
  productName: "Product Studio",
  audience: "Startup founders launching new SaaS products",
  valueProposition: "Go from idea to polished landing page with built-in UX quality checks.",
  tone: "bold",
  constraints: ["Keep copy concise", "Prioritize accessibility", "Strong CTA above the fold"],
  ctaGoal: "Start free trial",
};

const BLUEPRINT_TABS = [
  { id: "blueprint", label: "Blueprint" },
  { id: "theme",     label: "Theme"     },
  { id: "copy",      label: "Copy"      },
  { id: "preview",   label: "Preview"   },
];

/* ─── Helpers ────────────────────────────────── */

function buildMockBlueprint(brief: Brief): PageBlueprint {
  return {
    title: `${brief.productName} — Page Blueprint`,
    summary: `Message architecture focused on ${brief.audience}.`,
    sections: [
      { id: "hero",         type: "hero",         intent: `Lead with: "${brief.valueProposition}"`,      requiredComponents: ["headline", "subheadline", "primary-cta", "hero-visual"] },
      { id: "problem",      type: "problem",      intent: "Validate the audience's pain first",           requiredComponents: ["pain-points-grid", "empathy-statement", "transition-hook"] },
      { id: "solution",     type: "solution",     intent: `Position ${brief.productName} as the answer`, requiredComponents: ["solution-headline", "benefit-pillars", "product-screenshot"] },
      { id: "features",     type: "features",     intent: "Build credibility with concrete capabilities", requiredComponents: ["feature-grid", "feature-icons", "proof-metrics"] },
      { id: "social-proof", type: "social-proof", intent: "Reduce risk with real customer outcomes",     requiredComponents: ["testimonial-carousel", "company-logo-strip", "outcome-stats"] },
      { id: "cta",          type: "cta",          intent: `Drive: "${brief.ctaGoal}"`,                   requiredComponents: ["cta-headline", "primary-cta-button", "risk-reversal-copy"] },
    ],
  };
}

/* renderMockHtml is now renderPageHtml from @/lib/renderHtml */

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

/* ─── Page ───────────────────────────────────── */

export default function StudioPage() {
  const { toast } = useToast();

  // Restore persisted brief; fall back to default
  const [brief, setBriefRaw]              = useState<Brief>(() => storage.get(STORAGE_KEYS.brief, INITIAL_BRIEF));
  const [runs, setRunsRaw]                = useState<StudioRun[]>(() => storage.get(STORAGE_KEYS.runs, []));
  const [settings, setSettings]           = useState<AppSettings>(() => storage.get(STORAGE_KEYS.settings, DEFAULT_SETTINGS));
  const [selectedRunId, setSelectedRunId] = useState<string>("");
  const [currentStage, setCurrentStage]   = useState<Stage>("brief");
  const [activeSection, setActiveSection] = useState<SidebarSection | undefined>();
  const [isGenerating, setIsGenerating]   = useState(false);
  const [isAuditing, setIsAuditing]       = useState(false);
  const [blueprintTab, setBlueprintTab]   = useState<string>("blueprint");
  const [selectedTheme, setSelectedTheme] = useState<ThemeTokens | null>(null);
  const [reviewOpen, setReviewOpen]             = useState(false);
  const [settingsOpen, setSettingsOpen]         = useState(false);
  const [shortcutsOpen, setShortcutsOpen]             = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [templateDrawerOpen, setTemplateDrawerOpen]   = useState(false);

  // Blueprint lives here between Generate and Run Audit
  const pendingRef = useRef<{ brief: Brief; blueprint: PageBlueprint } | null>(null);

  // Stage transition animation
  const { displayedStage, transitionClass } = useStageTransition(currentStage);

  /* ── Persist brief on change ── */
  function setBrief(b: Brief) {
    setBriefRaw(b);
    storage.set(STORAGE_KEYS.brief, b);
  }

  /* ── Persist runs on change ── */
  function setRuns(updater: StudioRun[] | ((prev: StudioRun[]) => StudioRun[])) {
    setRunsRaw((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      // Only persist last 20 runs to keep localStorage lean
      const trimmed = next.slice(0, 20);
      storage.set(STORAGE_KEYS.runs, trimmed);
      return trimmed;
    });
  }

  /* ── Derived ── */
  const selectedRun = useMemo(
    () => runs.find((r) => r.id === selectedRunId) ?? null,
    [runs, selectedRunId]
  );

  const runSummaries: RunSummary[] = useMemo(
    () => runs.map((r, i) => ({
      id:            r.id,
      runNumber:     r.runNumber,
      productName:   r.brief.productName,
      score:         r.auditReport.score,
      previousScore: runs[i + 1]?.auditReport.score,
      reviewStatus:  r.review.status,
      createdAt:     r.createdAt,
    })),
    [runs]
  );

  const completedStages = useMemo<Stage[]>(() => {
    const order: Stage[] = ["brief", "blueprint", "audit", "export"];
    return order.slice(0, order.indexOf(currentStage)) as Stage[];
  }, [currentStage]);

  /* ── Step 1: Generate blueprint ── */
  async function handleGenerate() {
    setIsGenerating(true);
    pendingRef.current = null;
    setCurrentStage("blueprint");
    setBlueprintTab("blueprint");

    let blueprint: PageBlueprint;
    try {
      const res = await fetch("/api/protected/generate/blueprint", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(brief),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      blueprint = (await res.json()) as PageBlueprint;
      toast("Blueprint generated", "success");
    } catch {
      blueprint = buildMockBlueprint(brief);
      toast("Using offline blueprint", "warning");
    }

    pendingRef.current = { brief: { ...brief }, blueprint };
    setIsGenerating(false);
  }

  /* ── Step 2: Run Audit ── */
  async function handleRunAudit() {
    const pending = pendingRef.current;
    if (!pending) return;
    setIsAuditing(true);

    const html    = renderPageHtml(pending.brief, pending.blueprint);
    const adapter = createUxAuditAdapter();
    const auditReport: AuditReport = await adapter.runAudit({
      html,
      urlOrSnapshotId: `${pending.brief.productName.toLowerCase().replace(/\s+/g, "-")}-run-${runs.length + 1}`,
    });

    const newRun: StudioRun = {
      id: makeId("run"),
      runNumber: runs.length + 1,
      createdAt: new Date().toISOString(),
      brief: pending.brief,
      blueprint: pending.blueprint,
      auditReport,
      review: { status: "pending_review", events: [] },
    };

    setRuns((prev) => [newRun, ...prev]);
    setSelectedRunId(newRun.id);
    pendingRef.current = null;
    setIsAuditing(false);
    setCurrentStage("audit");
    toast(`Audit complete — score ${auditReport.score}/100`, auditReport.score >= 70 ? "success" : "warning");
  }

  /* ── Re-audit existing run ── */
  async function handleReAudit() {
    if (!selectedRun) return;
    setIsAuditing(true);
    const html    = renderPageHtml(selectedRun.brief, selectedRun.blueprint);
    const adapter = createUxAuditAdapter();
    const auditReport: AuditReport = await adapter.runAudit({
      html,
      urlOrSnapshotId: `${selectedRun.brief.productName.toLowerCase().replace(/\s+/g, "-")}-reaudit-${Date.now()}`,
    });
    const prev = selectedRun.auditReport.score;
    const next = auditReport.score;
    setRuns((prevRuns) => prevRuns.map((r) => r.id === selectedRun.id ? { ...r, auditReport } : r));
    setIsAuditing(false);
    const delta = next - prev;
    const msg = delta === 0
      ? `Re-audit complete — score unchanged (${next})`
      : `Re-audit: ${next}/100 (${delta > 0 ? "▲" : "▼"}${Math.abs(delta)})`;
    toast(msg, delta >= 0 ? "success" : "warning");
  }

  function handleSelectRun(id: string) {
    setSelectedRunId(id);
    setActiveSection(undefined);
    pendingRef.current = null;
    if (runs.find((r) => r.id === id)) setCurrentStage("audit");
  }

  function handleNewRun() {
    setSelectedRunId("");
    pendingRef.current = null;
    setCurrentStage("brief");
    setActiveSection(undefined);
  }

  function handleAutoFix(_finding: AuditFinding) {
    toast("Auto-fix queued (coming soon)", "info");
  }

  const handleApprove = useCallback((runId: string, note: string) => {
    setRuns((prev) => prev.map((r) => r.id !== runId ? r : {
      ...r,
      review: {
        status: "approved",
        events: [...r.review.events, { id: makeId("ev"), at: new Date().toISOString(), action: "approved", reviewer: "You", note }],
      },
    }));
    toast("Run approved ✓", "success");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReject = useCallback((runId: string, note: string) => {
    setRuns((prev) => prev.map((r) => r.id !== runId ? r : {
      ...r,
      review: {
        status: "rejected",
        events: [...r.review.events, { id: makeId("ev"), at: new Date().toISOString(), action: "rejected", reviewer: "You", note }],
      },
    }));
    toast("Run rejected", "warning");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      const tag  = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (meta && e.key === "Enter") {
        e.preventDefault();
        if (currentStage === "brief" && !isGenerating && brief.productName.trim()) handleGenerate();
        else if (currentStage === "blueprint" && !isAuditing && !isGenerating && pendingRef.current) handleRunAudit();
        else if (currentStage === "audit" && selectedRun) setCurrentStage("export");
      }
      if (meta && e.shiftKey && e.key === "r") {
        e.preventDefault();
        if (currentStage === "audit" && selectedRun && !isAuditing) handleReAudit();
      }
      if (meta && e.shiftKey && e.key === "v") {
        e.preventDefault();
        if (currentStage === "audit" && selectedRun) setReviewOpen((o) => !o);
      }
      if (meta && e.key === ",") {
        e.preventDefault();
        setSettingsOpen((o) => !o);
      }
      if (meta && e.key === "/") {
        e.preventDefault();
        setShortcutsOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStage, isGenerating, isAuditing, brief, selectedRun]);

  /* ── Top-bar actions ── */
  const gradientStyle = {
    background: "linear-gradient(135deg, var(--color-ps-accent-dim), var(--color-ps-accent))",
    boxShadow: "0 4px 16px rgba(124,58,237,0.25)",
    border: "none",
    color: "var(--color-ps-accent-soft)",
  };

  const primaryAction = (() => {
    switch (currentStage) {
      case "brief":
        return (
          <Button variant="primary" size="md" onClick={handleGenerate}
            disabled={isGenerating || !brief.productName.trim()} style={gradientStyle} title="⌘↩">
            {isGenerating
              ? <><Spinner size={14} color="var(--color-ps-accent-soft)" /> Generating…</>
              : "Generate →"}
          </Button>
        );
      case "blueprint":
        return (
          <Button variant="primary" size="md" onClick={handleRunAudit}
            disabled={isAuditing || isGenerating || !pendingRef.current} style={gradientStyle} title="⌘↩">
            {isAuditing
              ? <><Spinner size={14} color="var(--color-ps-accent-soft)" /> Auditing…</>
              : "Run Audit →"}
          </Button>
        );
      case "audit":
        return selectedRun ? (
          <Button variant="primary" size="md" onClick={() => setCurrentStage("export")} title="⌘↩">
            Proceed to Export →
          </Button>
        ) : null;
      case "export":
        return null;
    }
  })();

  const secondaryAction = (() => {
    if (currentStage === "brief") {
      return (
        <Button variant="ghost" size="md" onClick={() => setTemplateDrawerOpen(true)}>
          Templates
        </Button>
      );
    }
    if (currentStage === "blueprint") {
      return (
        <Button variant="ghost" size="md" onClick={handleGenerate} disabled={isGenerating}>
          ↺ Regenerate
        </Button>
      );
    }
    if (currentStage === "audit" && selectedRun) {
      return (
        <div className="flex gap-2">
          <Button variant="ghost" size="md" onClick={() => setReviewOpen(true)} title="⌘⇧V">Review</Button>
          <Button variant="ghost" size="md" onClick={handleReAudit} disabled={isAuditing} title="⌘⇧R">
            {isAuditing ? "Auditing…" : "Re-Audit"}
          </Button>
        </div>
      );
    }
    if (currentStage === "export") {
      return (
        <Button variant="ghost" size="md" onClick={() => setCurrentStage("audit")}>← Back to Audit</Button>
      );
    }
    return undefined;
  })();

  /* ── Canvas ── */
  const pendingBlueprint = pendingRef.current?.blueprint ?? null;
  const pendingBrief     = pendingRef.current?.brief ?? brief;

  // Onboarding: show hero above brief form on very first visit
  const showOnboarding = runs.length === 0 && !onboardingDismissed;

  function renderCanvas() {
    // Section nav overrides (compare / exports / slo)
    if (activeSection === "compare") return <ComparePanel runs={runs} />;
    if (activeSection === "slo")     return <SloPanel runs={runs} passThreshold={settings.auditScoreThreshold} />;
    if (activeSection === "exports") {
      return (
        <ExportsPanel
          runs={runs}
          onOpenRun={(id) => {
            setSelectedRunId(id);
            setActiveSection(undefined);
            setCurrentStage("export");
          }}
        />
      );
    }

    switch (displayedStage) {
      case "brief":
        return (
          <>
            {showOnboarding && (
              <OnboardingHero onDismiss={() => setOnboardingDismissed(true)} />
            )}
            <BriefView brief={brief} onChange={setBrief} isGenerating={isGenerating} />
          </>
        );

      case "blueprint":
        return (
          <div className="flex flex-col h-full gap-0">
            <Tabs items={BLUEPRINT_TABS} activeId={blueprintTab} onChange={setBlueprintTab} className="shrink-0" />
            <div role="tabpanel" id="tabpanel-blueprint" aria-labelledby="tab-blueprint"
              hidden={blueprintTab !== "blueprint"} className="flex-1 overflow-y-auto pt-5">
              <BlueprintView blueprint={pendingBlueprint} isGenerating={isGenerating} />
            </div>
            <div role="tabpanel" id="tabpanel-theme" aria-labelledby="tab-theme"
              hidden={blueprintTab !== "theme"} className="flex-1 overflow-y-auto pt-5">
              <ThemePanel brief={pendingBrief} selectedTheme={selectedTheme} onSelectTheme={setSelectedTheme} />
            </div>
            <div role="tabpanel" id="tabpanel-copy" aria-labelledby="tab-copy"
              hidden={blueprintTab !== "copy"} className="flex-1 overflow-y-auto pt-5">
              <CopyPanel brief={pendingBrief} blueprint={pendingBlueprint} />
            </div>
            <div role="tabpanel" id="tabpanel-preview" aria-labelledby="tab-preview"
              hidden={blueprintTab !== "preview"} className="flex-1 overflow-hidden pt-4">
              {pendingBlueprint ? (
                <PreviewPane
                  html={renderPageHtml(pendingBrief, pendingBlueprint)}
                  className="h-full"
                />
              ) : (
                <div className="flex items-center justify-center h-40 text-sm" style={{ color: "var(--color-ps-ink-ghost)" }}>
                  Generate a blueprint first to see the preview.
                </div>
              )}
            </div>
          </div>
        );

      case "audit":
        return (
          <AuditPanel
            auditReport={selectedRun?.auditReport ?? null}
            onAutoFix={handleAutoFix}
            isGenerating={isAuditing}
            scoreHistory={
              selectedRun
                ? [...runs]
                    .filter((r) => r.brief.productName === selectedRun.brief.productName)
                    .reverse()
                    .map((r) => r.auditReport.score)
                : undefined
            }
          />
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
        onNavigate={(section) => {
          setActiveSection((prev) => prev === section ? undefined : section);
        }}
        onOpenSettings={() => setSettingsOpen(true)}
        projectName={selectedRun?.brief.productName ?? brief.productName}
        currentStage={currentStage}
        completedStages={completedStages}
        onStageClick={(stage) => {
          if (completedStages.includes(stage) || stage === currentStage) {
            setCurrentStage(stage);
            setActiveSection(undefined); // exit compare/exports/slo views
          }
        }}
        primaryAction={primaryAction}
        secondaryAction={secondaryAction}
        canvasClassName={activeSection ? "" : transitionClass}
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

      <SettingsDrawer
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={(s) => {
          setSettings(s);
          setSettingsOpen(false);
          toast("Settings saved", "success");
        }}
        onExportProject={() => {
          const payload = {
            exportedAt: new Date().toISOString(),
            version:    1,
            brief,
            runs,
          };
          const json = JSON.stringify(payload, null, 2);
          const blob = new Blob([json], { type: "application/json" });
          const url  = URL.createObjectURL(blob);
          const a    = document.createElement("a");
          a.href = url;
          a.download = `product-studio-project-${Date.now()}.json`;
          a.click();
          URL.revokeObjectURL(url);
          toast("Project exported", "success");
        }}
        onImportProject={(json) => {
          try {
            const data = JSON.parse(json);
            if (!Array.isArray(data.runs)) throw new Error("Missing runs array");
            if (data.brief) setBrief(data.brief);
            setRuns(data.runs);
            setSettingsOpen(false);
            toast(`Imported ${data.runs.length} run${data.runs.length !== 1 ? "s" : ""}`, "success");
          } catch {
            toast("Import failed — invalid project file", "error");
          }
        }}
      />

      <ShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

      <TemplateDrawer
        isOpen={templateDrawerOpen}
        onClose={() => setTemplateDrawerOpen(false)}
        onSelect={(t) => {
          setBrief(t);
          setOnboardingDismissed(false); // reset so hero reappears if they go back
          toast("Template loaded — edit any field and hit Generate →", "info");
        }}
      />
    </>
  );
}
