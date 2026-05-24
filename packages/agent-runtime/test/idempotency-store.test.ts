import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { createIdempotencyStore, executeIdempotent } from "../src/idempotency-store";

async function makeStore(ttlHours = 24) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "idempotency-store-test-"));
  return { store: createIdempotencyStore({ rootDir: dir, ttlHours }), dir };
}

test("idempotency replays completed response for same key + fingerprint", async () => {
  const { store } = await makeStore();
  const request = { key: "k1", operation: "create_run", fingerprint: "fp1" };

  const first = await executeIdempotent({
    store,
    request,
    execute: async () => ({ runId: "run_1" })
  });
  const second = await executeIdempotent({
    store,
    request,
    execute: async () => ({ runId: "run_2" })
  });

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  if (second.ok) {
    assert.equal(second.replayed, true);
    assert.deepEqual(second.value, { runId: "run_1" });
  }
});

test("idempotency reports conflict for same key with different fingerprint", async () => {
  const { store } = await makeStore();
  const request1 = { key: "k2", operation: "create_run", fingerprint: "fp1" };
  const request2 = { key: "k2", operation: "create_run", fingerprint: "fp2" };

  await executeIdempotent({ store, request: request1, execute: async () => "ok" });
  const result = await executeIdempotent({ store, request: request2, execute: async () => "new" });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.status, "conflict");
  }
});

test("idempotency expires records and allows fresh execution after ttl", async () => {
  const { store, dir } = await makeStore(24);
  const request = { key: "k3", operation: "create_run", fingerprint: "fp1" };

  await executeIdempotent({ store, request, execute: async () => "first" });
  const recordPath = path.join(dir, "k3.json");
  const raw = await readFile(recordPath, "utf8");
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  parsed.expiresAt = new Date(Date.now() - 1000).toISOString();
  await writeFile(recordPath, JSON.stringify(parsed, null, 2), "utf8");

  const result = await executeIdempotent({
    store,
    request,
    execute: async () => "second"
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.replayed, false);
    assert.equal(result.value, "second");
  }
});
