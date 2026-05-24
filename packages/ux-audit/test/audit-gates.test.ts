import test from "node:test";
import assert from "node:assert/strict";
import type { AuditReport } from "@product-studio/shared-types";
import { DEFAULT_AUDIT_GATE_CONFIG, evaluateAuditGate } from "../src/audit-gates";

function makeReport(overrides: Partial<AuditReport> = {}): AuditReport {
  return {
    urlOrSnapshotId: "fixture",
    score: 90,
    categoryScores: {
      accessibility: 90,
      readability: 85,
      performance: 80
    },
    findings: [],
    generatedAt: "2026-05-24T00:00:00.000Z",
    ...overrides
  };
}

test("audit gate passes when report meets thresholds and has no violations", () => {
  const result = evaluateAuditGate(makeReport(), null);
  assert.equal(result.passed, true);
  assert.equal(result.violations.length, 0);
});

test("audit gate fails when score falls below configured thresholds", () => {
  const result = evaluateAuditGate(
    makeReport({
      score: 70,
      categoryScores: {
        accessibility: 80,
        readability: 70,
        performance: 60
      }
    }),
    null
  );

  assert.equal(result.passed, false);
  assert.equal(result.violations.some((v) => v.code === "overall_below_threshold"), true);
  assert.equal(result.violations.some((v) => v.code === "performance_below_threshold"), true);
});

test("audit gate fails on critical accessibility finding", () => {
  const result = evaluateAuditGate(
    makeReport({
      findings: [
        {
          id: "a11y-critical",
          category: "accessibility",
          severity: "critical",
          title: "Critical issue",
          description: "Critical issue",
          recommendation: "Fix it"
        }
      ]
    }),
    null
  );

  assert.equal(result.passed, false);
  assert.equal(result.violations.some((v) => v.code === "critical_accessibility_finding"), true);
});

test("audit gate detects regression beyond allowed delta", () => {
  const baseline = makeReport();
  const current = makeReport({
    score: baseline.score - (DEFAULT_AUDIT_GATE_CONFIG.regression.maxOverallDrop + 3)
  });

  const result = evaluateAuditGate(current, baseline);
  assert.equal(result.passed, false);
  assert.equal(result.violations.some((v) => v.code === "overall_regression"), true);
});
