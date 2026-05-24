import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { AuditLogStore } from "../src/audit-log";

async function createStore(): Promise<{ store: AuditLogStore; dir: string }> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "audit-log-test-"));
  return { store: new AuditLogStore({ rootDir: dir }), dir };
}

test("audit log export includes entries and integrity", async () => {
  const { store } = await createStore();
  await store.append({
    correlationId: "corr_1",
    actor: "tester",
    action: "run_created",
    resourceType: "run",
    resourceId: "run_1",
    metadata: { stage: "start" }
  });

  const exported = await store.exportEntries();
  assert.equal(exported.count, 1);
  assert.equal(exported.integrity.ok, true);
  assert.equal(exported.entries[0].correlationId, "corr_1");
});

test("audit log retention prunes old entries", async () => {
  const { store, dir } = await createStore();
  const now = new Date();
  const old = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString();

  await store.append({
    correlationId: "corr_2",
    actor: "tester",
    action: "run_created",
    resourceType: "run",
    resourceId: "run_2",
    metadata: { stage: "start" }
  });

  // Simulate one old and one fresh entry by rewriting timestamps in memory path through retention API expectations.
  // We keep this simple by adding another recent entry and pruning aggressively.
  await store.append({
    correlationId: "corr_3",
    actor: "tester",
    action: "run_transition",
    resourceType: "run",
    resourceId: "run_2",
    metadata: { stage: "next" }
  });

  const logPath = path.join(dir, "events.ndjson");
  const raw = await readFile(logPath, "utf8");
  const lines = raw
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as Record<string, unknown>);
  lines[0].timestamp = old;
  await writeFile(logPath, `${lines.map((l) => JSON.stringify(l)).join("\n")}\n`, "utf8");

  const result = await store.enforceRetention(1);
  assert.equal(result.removed, 1);
  assert.equal(result.remaining, 1);
});
