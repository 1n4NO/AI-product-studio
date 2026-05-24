import test from "node:test";
import assert from "node:assert/strict";
import { executeWithSchema, type SchemaValidator } from "../src/schema-pipeline";

const isStringPayload: SchemaValidator<{ value: string }> = (value: unknown): value is { value: string } =>
  typeof value === "object" && value !== null && "value" in value && typeof (value as { value: unknown }).value === "string";

test("executeWithSchema succeeds after retry", async () => {
  let calls = 0;
  const result = await executeWithSchema({
    taskName: "retry-task",
    run: async () => {
      calls += 1;
      if (calls === 1) return { value: 123 };
      return { value: "ok" };
    },
    validate: isStringPayload,
    retryPolicy: { maxAttempts: 3 }
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.attempts, 2);
    assert.equal(result.value.value, "ok");
  }
});

test("executeWithSchema returns failure after max attempts", async () => {
  const result = await executeWithSchema({
    taskName: "fail-task",
    run: async () => ({ value: 123 }),
    validate: isStringPayload,
    retryPolicy: { maxAttempts: 2 }
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.failures.length, 2);
  }
});

