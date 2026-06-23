"use client";

import { useEffect, useRef } from "react";
import type { StudioRun } from "@/lib/types";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { ScoreRing } from "@/components/atoms/ScoreRing";
import { cn } from "@/lib/cn";

interface ReviewDrawerProps {
  run: StudioRun | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (runId: string, note: string) => void;
  onReject:  (runId: string, note: string) => void;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-ps-ink-ghost)" }}>
        {label}
      </span>
      <span className="text-sm" style={{ color: "var(--color-ps-ink)" }}>
        {value}
      </span>
    </div>
  );
}

export function ReviewDrawer({ run, isOpen, onClose, onApprove, onReject }: ReviewDrawerProps) {
  const noteRef  = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus first interactive el on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => noteRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Trap focus & close on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  function handleAction(action: "approve" | "reject") {
    if (!run) return;
    const note = noteRef.current?.value.trim() ?? "";
    if (action === "approve") onApprove(run.id, note);
    else onReject(run.id, note);
    if (noteRef.current) noteRef.current.value = "";
    onClose();
  }

  const status = run?.review.status;

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-30 transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        style={{ background: "rgba(0,0,0,0.55)" }}
      />

      {/* Slide-over panel */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Review run"
        className={cn(
          "fixed right-0 top-0 bottom-0 z-40 flex flex-col w-[480px] max-w-[95vw]",
          "transition-transform duration-300 ease-in-out"
        )}
        style={{
          background: "var(--color-ps-surface)",
          borderLeft: "1px solid var(--color-ps-border)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          boxShadow: isOpen ? "-8px 0 40px rgba(0,0,0,0.4)" : "none",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ borderColor: "var(--color-ps-border)" }}
        >
          <div className="flex items-center gap-3">
            <span className="font-semibold text-base" style={{ color: "var(--color-ps-ink)" }}>
              Review Run
            </span>
            {run && <Badge variant={status === "approved" ? "approved" : status === "rejected" ? "rejected" : "pending"} />}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: "var(--color-ps-ink-dim)", background: "transparent" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-ps-raised)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            aria-label="Close review drawer"
          >
            ✕
          </button>
        </div>

        {run ? (
          <>
            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
              {/* Score summary */}
              <div
                className="flex items-center gap-4 p-4 rounded-xl"
                style={{ background: "var(--color-ps-raised)", border: "1px solid var(--color-ps-border)" }}
              >
                <ScoreRing score={run.auditReport.score} size={64} />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-ps-ink-ghost)" }}>
                    UX Audit Score
                  </span>
                  <span className="text-2xl font-bold" style={{ color: "var(--color-ps-ink)" }}>
                    {run.auditReport.score}
                    <span className="text-sm font-normal text-ps-ink-dim ml-0.5">/100</span>
                  </span>
                  <span className="text-xs" style={{ color: "var(--color-ps-ink-dim)" }}>
                    {run.auditReport.findings.length} finding{run.auditReport.findings.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Brief summary */}
              <div className="flex flex-col gap-4">
                <Field label="Product"           value={run.brief.productName} />
                <Field label="Value proposition" value={run.brief.valueProposition} />
                <Field label="Audience"          value={run.brief.audience} />
                <Field label="CTA goal"          value={run.brief.ctaGoal} />
                <Field label="Tone"              value={run.brief.tone} />
                {run.brief.constraints.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-ps-ink-ghost)" }}>
                      Constraints
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {run.brief.constraints.map((c) => (
                        <span
                          key={c}
                          className="px-2.5 py-1 rounded-full text-xs"
                          style={{
                            background: "var(--color-ps-raised)",
                            border: "1px solid var(--color-ps-border)",
                            color: "var(--color-ps-ink-dim)",
                          }}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Review history */}
              {run.review.events.length > 0 && (
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-ps-ink-ghost)" }}>
                    Review history
                  </span>
                  <div className="flex flex-col gap-2">
                    {run.review.events.map((ev) => (
                      <div
                        key={ev.id}
                        className="flex flex-col gap-0.5 px-3 py-2 rounded-lg"
                        style={{
                          background: "var(--color-ps-raised)",
                          border: "1px solid var(--color-ps-border)",
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium capitalize" style={{ color: "var(--color-ps-ink)" }}>
                            {ev.reviewer} · {ev.action}
                          </span>
                          <span className="text-xs" style={{ color: "var(--color-ps-ink-ghost)" }}>
                            {new Date(ev.at).toLocaleDateString()}
                          </span>
                        </div>
                        {ev.note && (
                          <p className="text-xs" style={{ color: "var(--color-ps-ink-dim)" }}>
                            {ev.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviewer note */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="review-note"
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "var(--color-ps-ink-ghost)" }}
                >
                  Note (optional)
                </label>
                <textarea
                  id="review-note"
                  ref={noteRef}
                  rows={4}
                  placeholder="Add a note for the team…"
                  className="w-full rounded-lg px-3 py-2 text-sm resize-none outline-none transition-colors"
                  style={{
                    background: "var(--color-ps-raised)",
                    border: "1px solid var(--color-ps-border)",
                    color: "var(--color-ps-ink)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-ps-accent)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-ps-border)")}
                />
              </div>
            </div>

            {/* Footer actions */}
            <div
              className="flex gap-3 px-6 py-4 border-t shrink-0"
              style={{ borderColor: "var(--color-ps-border)", background: "var(--color-ps-surface)" }}
            >
              <Button
                variant="danger"
                size="md"
                className="flex-1"
                onClick={() => handleAction("reject")}
                disabled={status !== "pending_review"}
              >
                Reject
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => handleAction("approve")}
                disabled={status !== "pending_review"}
                style={{
                  background: "linear-gradient(135deg, var(--color-ps-ok), #24906a)",
                  border: "none",
                  color: "#fff",
                }}
              >
                Approve ✓
              </Button>
            </div>
          </>
        ) : (
          <div
            className="flex-1 flex items-center justify-center text-sm"
            style={{ color: "var(--color-ps-ink-ghost)" }}
          >
            No run selected
          </div>
        )}
      </aside>
    </>
  );
}
