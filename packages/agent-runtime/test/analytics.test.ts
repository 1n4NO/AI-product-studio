import test from "node:test";
import assert from "node:assert/strict";
import { computeFunnelMetrics } from "../src/analytics";

test("computeFunnelMetrics computes conversion rates and average time-to-draft", () => {
  const metrics = computeFunnelMetrics({
    runsStarted: 100,
    blueprintsGenerated: 90,
    draftsGenerated: 80,
    auditsPassed: 60,
    exportsCompleted: 50,
    totalDraftDurationMs: 800000
  });

  assert.equal(metrics.blueprintConversionRate, 0.9);
  assert.equal(metrics.draftConversionRate, 0.8);
  assert.equal(metrics.auditPassRate, 0.75);
  assert.equal(metrics.exportConversionRate, 0.5);
  assert.equal(metrics.averageTimeToDraftMs, 10000);
});

test("computeFunnelMetrics handles zero denominators safely", () => {
  const metrics = computeFunnelMetrics({
    runsStarted: 0,
    blueprintsGenerated: 0,
    draftsGenerated: 0,
    auditsPassed: 0,
    exportsCompleted: 0,
    totalDraftDurationMs: 0
  });

  assert.equal(metrics.blueprintConversionRate, 0);
  assert.equal(metrics.draftConversionRate, 0);
  assert.equal(metrics.auditPassRate, 0);
  assert.equal(metrics.exportConversionRate, 0);
  assert.equal(metrics.averageTimeToDraftMs, 0);
});

