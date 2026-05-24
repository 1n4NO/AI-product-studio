import test from "node:test";
import assert from "node:assert/strict";
import { evaluateQuota, evaluateRateLimit } from "../src/cost-controls";

test("evaluateQuota allows usage within policy", () => {
  const result = evaluateQuota({
    workspaceId: "ws_1",
    periodStartIso: "2026-05-01T00:00:00.000Z",
    periodEndIso: "2026-06-01T00:00:00.000Z",
    tokensUsed: 1000,
    runsCreated: 10
  });

  assert.equal(result.allowed, true);
  assert.equal(result.reasons.length, 0);
});

test("evaluateQuota blocks when quota exceeded", () => {
  const result = evaluateQuota(
    {
      workspaceId: "ws_2",
      periodStartIso: "2026-05-01T00:00:00.000Z",
      periodEndIso: "2026-06-01T00:00:00.000Z",
      tokensUsed: 200,
      runsCreated: 10
    },
    { maxTokensPerPeriod: 100, maxRunsPerPeriod: 5 }
  );

  assert.equal(result.allowed, false);
  assert.equal(result.reasons.includes("token_quota_exceeded"), true);
  assert.equal(result.reasons.includes("run_quota_exceeded"), true);
});

test("evaluateRateLimit enforces retry when request volume reached", () => {
  const policy = { maxRequests: 5, windowSeconds: 60 };
  assert.deepEqual(evaluateRateLimit({ requestCount: 4 }, policy), { allowed: true, retryAfterSeconds: 0 });
  assert.deepEqual(evaluateRateLimit({ requestCount: 5 }, policy), { allowed: false, retryAfterSeconds: 60 });
});

