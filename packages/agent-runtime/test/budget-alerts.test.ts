import test from "node:test";
import assert from "node:assert/strict";
import { evaluateBudgetThresholds } from "../src/budget-alerts";

test("budget thresholds produce warning/high/critical levels", () => {
  assert.equal(evaluateBudgetThresholds({ used: 69, limit: 100 }).level, "none");
  assert.equal(evaluateBudgetThresholds({ used: 70, limit: 100 }).level, "warning");
  assert.equal(evaluateBudgetThresholds({ used: 85, limit: 100 }).level, "high");
  assert.equal(evaluateBudgetThresholds({ used: 100, limit: 100 }).level, "critical");
});

test("budget thresholds handle missing limit safely", () => {
  const result = evaluateBudgetThresholds({ used: 50, limit: 0 });
  assert.equal(result.level, "none");
});

