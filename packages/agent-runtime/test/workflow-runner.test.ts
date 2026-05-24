import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtemp } from "node:fs/promises";
import { WorkflowRunStore } from "../src/workflow-runner";

async function createStore(): Promise<WorkflowRunStore> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "workflow-runner-test-"));
  return new WorkflowRunStore({ rootDir: dir });
}

test("workflow supports valid transitions for non-approval runs", async () => {
  const store = await createStore();
  const run = await store.createRun("proj_1", false);

  await store.transition(run.runId, "blueprint_generated");
  await store.transition(run.runId, "draft_generated");
  await store.transition(run.runId, "audit_completed");
  const final = await store.transition(run.runId, "export_ready");

  assert.equal(final.state, "export_ready");
  assert.equal(final.events.length >= 4, true);
});

test("workflow enforces approval gate when required", async () => {
  const store = await createStore();
  const run = await store.createRun("proj_2", true);

  await store.transition(run.runId, "blueprint_generated");

  await assert.rejects(
    () => store.transition(run.runId, "draft_generated"),
    /Approval required before draft generation/
  );

  const requested = await store.requestApproval(run.runId);
  assert.equal(requested.state, "awaiting_approval");

  const approved = await store.grantApproval(run.runId, "reviewer_1");
  assert.equal(approved.state, "draft_generated");
  assert.equal(approved.approvalGranted, true);
});

test("workflow rejects invalid transitions", async () => {
  const store = await createStore();
  const run = await store.createRun("proj_3", false);

  await assert.rejects(
    () => store.transition(run.runId, "export_ready"),
    /Invalid transition/
  );
});

