"use client";

import { useMemo, useState } from "react";
import type { AuditReport, Brief, PageBlueprint } from "@product-studio/shared-types";
import { createUxAuditAdapter } from "@product-studio/ux-audit";
import { evaluateSloWindow } from "@product-studio/agent-runtime/src/slo";

const initialBrief: Brief = {
  productName: "Product Studio",
  audience: "Startup founders launching new SaaS products",
  valueProposition: "Go from idea to polished landing page with built-in UX quality checks.",
  tone: "bold",
  constraints: ["Keep copy concise", "Prioritize accessibility", "Strong CTA above the fold"],
  ctaGoal: "Start free trial"
};

interface StudioRun {
  id: string;
  createdAt: string;
  brief: Brief;
  blueprint: PageBlueprint;
  auditReport: AuditReport;
  review: RunReview;
}

type ReviewStatus = "pending_review" | "approved" | "rejected";

interface ReviewEvent {
  id: string;
  at: string;
  action: "approved" | "rejected" | "commented";
  reviewer: string;
  note: string;
}

interface RunReview {
  status: ReviewStatus;
  events: ReviewEvent[];
}

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

function makeRunId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function makeReviewEventId(): string {
  return `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function scoreDelta(from: number, to: number): string {
  const delta = to - from;
  return delta >= 0 ? `+${delta}` : `${delta}`;
}

export default function Home() {
  const [brief, setBrief] = useState<Brief>(initialBrief);
  const [blueprint, setBlueprint] = useState<PageBlueprint | null>(null);
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(false);

  const [runs, setRuns] = useState<StudioRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>("");
  const [compareFromRunId, setCompareFromRunId] = useState<string>("");
  const [compareToRunId, setCompareToRunId] = useState<string>("");
  const [reviewer, setReviewer] = useState<string>("reviewer@studio.local");
  const [reviewComment, setReviewComment] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [reviewError, setReviewError] = useState<string>("");

  const constraintsText = useMemo(() => brief.constraints.join("\n"), [brief.constraints]);

  const selectedRun = useMemo(
    () => runs.find((run) => run.id === selectedRunId) ?? null,
    [runs, selectedRunId]
  );

  const compareFromRun = useMemo(
    () => runs.find((run) => run.id === compareFromRunId) ?? null,
    [runs, compareFromRunId]
  );

  const compareToRun = useMemo(
    () => runs.find((run) => run.id === compareToRunId) ?? null,
    [runs, compareToRunId]
  );

  const sloEvaluation = useMemo(() => {
    const totalRequests = runs.length;
    const successfulRequests = runs.filter((run) => run.review.status !== "rejected").length;
    const availableRequests = runs.filter((run) => run.auditReport.findings.length < 20).length;
    const p95LatencyMs = runs.length === 0 ? 0 : 2400 + runs.length * 40;

    return evaluateSloWindow({
      totalRequests,
      successfulRequests,
      availableRequests,
      p95LatencyMs
    });
  }, [runs]);

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

    const nextRun: StudioRun = {
      id: makeRunId(),
      createdAt: new Date().toISOString(),
      brief: { ...brief },
      blueprint: nextBlueprint,
      auditReport: report,
      review: {
        status: "pending_review",
        events: []
      }
    };

    setRuns((prev) => [nextRun, ...prev]);
    setSelectedRunId(nextRun.id);
    if (!compareToRunId) {
      setCompareToRunId(nextRun.id);
    }
    if (!compareFromRunId && runs.length > 0) {
      setCompareFromRunId(runs[0].id);
    }

    setLoading(false);
  }

  function handleRollback(run: StudioRun) {
    setBrief(run.brief);
    setBlueprint(run.blueprint);
    setAuditReport(run.auditReport);
    setSelectedRunId(run.id);
  }

  function appendReviewEvent(runId: string, event: ReviewEvent, status: ReviewStatus) {
    setRuns((prev) =>
      prev.map((run) => {
        if (run.id !== runId) return run;
        return {
          ...run,
          review: {
            status,
            events: [event, ...run.review.events]
          }
        };
      })
    );
  }

  function handleApprove(run: StudioRun) {
    setReviewError("");
    const note = reviewComment.trim() || "Approved for next stage";
    appendReviewEvent(
      run.id,
      {
        id: makeReviewEventId(),
        at: new Date().toISOString(),
        action: "approved",
        reviewer: reviewer.trim() || "unknown-reviewer",
        note
      },
      "approved"
    );
    setReviewComment("");
  }

  function handleReject(run: StudioRun) {
    setReviewError("");
    const reason = rejectionReason.trim();
    if (!reason) {
      setReviewError("Rejection reason is required.");
      return;
    }

    appendReviewEvent(
      run.id,
      {
        id: makeReviewEventId(),
        at: new Date().toISOString(),
        action: "rejected",
        reviewer: reviewer.trim() || "unknown-reviewer",
        note: reason
      },
      "rejected"
    );
    setRejectionReason("");
  }

  function handleComment(run: StudioRun) {
    setReviewError("");
    const note = reviewComment.trim();
    if (!note) return;
    appendReviewEvent(
      run.id,
      {
        id: makeReviewEventId(),
        at: new Date().toISOString(),
        action: "commented",
        reviewer: reviewer.trim() || "unknown-reviewer",
        note
      },
      run.review.status
    );
    setReviewComment("");
  }

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: 24, fontFamily: "sans-serif" }}>
      <h1>Product Studio</h1>
      <p>Brief -&gt; Blueprint -&gt; Audit -&gt; Run History</p>

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
          {loading ? "Generating..." : "Generate Run"}
        </button>
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h2>Run History</h2>
        {runs.length === 0 ? <p>No runs yet.</p> : null}
        {runs.map((run) => (
          <div key={run.id} style={{ border: "1px solid #ddd", borderRadius: 6, padding: 10, marginBottom: 8 }}>
            <p style={{ margin: 0 }}>
              <strong>{run.id}</strong> | {new Date(run.createdAt).toLocaleString()} | score {run.auditReport.score} | review {run.review.status}
            </p>
            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => setSelectedRunId(run.id)}>View</button>
              <button onClick={() => handleRollback(run)}>Rollback</button>
              <button onClick={() => setCompareFromRunId(run.id)}>Set As Baseline</button>
              <button onClick={() => setCompareToRunId(run.id)}>Set As Current</button>
            </div>
          </div>
        ))}
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h2>Run Detail</h2>
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {selectedRun ? JSON.stringify(selectedRun, null, 2) : "Select a run to inspect details."}
        </pre>
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h2>Review Workflow</h2>
        {!selectedRun ? <p>Select a run to review.</p> : null}
        {selectedRun ? (
          <div>
            <p>
              Current review status: <strong>{selectedRun.review.status}</strong>
            </p>
            <label>
              Reviewer
              <input
                value={reviewer}
                onChange={(e) => setReviewer(e.target.value)}
                style={{ display: "block", width: "100%", marginTop: 4, marginBottom: 10 }}
              />
            </label>
            <label>
              Comment
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                style={{ display: "block", width: "100%", marginTop: 4, marginBottom: 10, minHeight: 70 }}
              />
            </label>
            <label>
              Rejection Reason (required when rejecting)
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                style={{ display: "block", width: "100%", marginTop: 4, marginBottom: 10, minHeight: 70 }}
              />
            </label>
            {reviewError ? <p>{reviewError}</p> : null}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              <button onClick={() => handleApprove(selectedRun)}>Approve</button>
              <button onClick={() => handleReject(selectedRun)}>Reject</button>
              <button onClick={() => handleComment(selectedRun)}>Add Comment</button>
            </div>
            <h3>Review Log</h3>
            {selectedRun.review.events.length === 0 ? <p>No review events yet.</p> : null}
            {selectedRun.review.events.map((event) => (
              <div key={event.id} style={{ border: "1px solid #ddd", borderRadius: 6, padding: 8, marginBottom: 8 }}>
                <p style={{ margin: 0 }}>
                  <strong>{event.action}</strong> by {event.reviewer} at {new Date(event.at).toLocaleString()}
                </p>
                <p style={{ margin: "6px 0 0 0" }}>{event.note}</p>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h2>Run Comparison</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <label>
            Baseline
            <select value={compareFromRunId} onChange={(e) => setCompareFromRunId(e.target.value)} style={{ marginLeft: 8 }}>
              <option value="">Select</option>
              {runs.map((run) => (
                <option key={run.id} value={run.id}>
                  {run.id}
                </option>
              ))}
            </select>
          </label>
          <label>
            Current
            <select value={compareToRunId} onChange={(e) => setCompareToRunId(e.target.value)} style={{ marginLeft: 8 }}>
              <option value="">Select</option>
              {runs.map((run) => (
                <option key={run.id} value={run.id}>
                  {run.id}
                </option>
              ))}
            </select>
          </label>
        </div>

        {compareFromRun && compareToRun ? (
          <div>
            <p>
              Overall score: {compareFromRun.auditReport.score} -&gt; {compareToRun.auditReport.score} ({scoreDelta(compareFromRun.auditReport.score, compareToRun.auditReport.score)})
            </p>
            <p>
              Accessibility: {compareFromRun.auditReport.categoryScores.accessibility} -&gt; {compareToRun.auditReport.categoryScores.accessibility} ({scoreDelta(compareFromRun.auditReport.categoryScores.accessibility, compareToRun.auditReport.categoryScores.accessibility)})
            </p>
            <p>
              Readability: {compareFromRun.auditReport.categoryScores.readability} -&gt; {compareToRun.auditReport.categoryScores.readability} ({scoreDelta(compareFromRun.auditReport.categoryScores.readability, compareToRun.auditReport.categoryScores.readability)})
            </p>
            <p>
              Performance: {compareFromRun.auditReport.categoryScores.performance} -&gt; {compareToRun.auditReport.categoryScores.performance} ({scoreDelta(compareFromRun.auditReport.categoryScores.performance, compareToRun.auditReport.categoryScores.performance)})
            </p>
            <p>
              Findings count: {compareFromRun.auditReport.findings.length} -&gt; {compareToRun.auditReport.findings.length} ({scoreDelta(compareFromRun.auditReport.findings.length, compareToRun.auditReport.findings.length)})
            </p>
          </div>
        ) : (
          <p>Select baseline and current runs to compare.</p>
        )}
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h2>SLO Dashboard</h2>
        <p>P95 Latency: {Math.round(sloEvaluation.values.p95LatencyMs)}ms</p>
        <p>Success Rate: {(sloEvaluation.values.successRate * 100).toFixed(2)}%</p>
        <p>Availability: {(sloEvaluation.values.availability * 100).toFixed(2)}%</p>
        <p>Status: {sloEvaluation.ok ? "healthy" : "breached"}</p>
        {sloEvaluation.breaches.length === 0 ? <p>No active SLO breaches.</p> : null}
        {sloEvaluation.breaches.map((breach, index) => (
          <div key={`${breach.indicator}-${index}`} style={{ border: "1px solid #ddd", borderRadius: 6, padding: 8, marginBottom: 8 }}>
            <p style={{ margin: 0 }}>
              <strong>{breach.severity}</strong> {breach.indicator}
            </p>
            <p style={{ margin: "6px 0 0 0" }}>{breach.message}</p>
          </div>
        ))}
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
