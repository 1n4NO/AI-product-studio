import test from "node:test";
import assert from "node:assert/strict";
import { evaluateSloWindow } from "../src/slo";

test("evaluateSloWindow returns healthy when metrics meet targets", () => {
  const result = evaluateSloWindow({
    totalRequests: 100,
    successfulRequests: 99,
    availableRequests: 100,
    p95LatencyMs: 2500
  });

  assert.equal(result.ok, true);
  assert.equal(result.breaches.length, 0);
});

test("evaluateSloWindow reports breaches with severity", () => {
  const result = evaluateSloWindow({
    totalRequests: 100,
    successfulRequests: 95,
    availableRequests: 96,
    p95LatencyMs: 4200
  });

  assert.equal(result.ok, false);
  assert.equal(result.breaches.some((b) => b.indicator === "latency"), true);
  assert.equal(result.breaches.some((b) => b.indicator === "success_rate"), true);
  assert.equal(result.breaches.some((b) => b.indicator === "availability"), true);
});

