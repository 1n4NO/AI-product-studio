import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type RunState =
  | "brief_received"
  | "blueprint_generated"
  | "awaiting_approval"
  | "draft_generated"
  | "audit_completed"
  | "fixes_applied"
  | "export_ready"
  | "failed";

export type RunStep = "generate_blueprint" | "generate_draft" | "run_audit" | "apply_fixes" | "prepare_export";

export interface RunEvent {
  id: string;
  runId: string;
  correlationId: string;
  timestamp: string;
  type: "transition" | "approval_requested" | "approval_granted" | "step_failed";
  fromState: RunState;
  toState: RunState;
  metadata?: Record<string, string>;
}

export interface WorkflowRun {
  runId: string;
  projectId: string;
  correlationId: string;
  state: RunState;
  requiresApproval: boolean;
  approvalGranted: boolean;
  createdAt: string;
  updatedAt: string;
  events: RunEvent[];
}

export interface WorkflowStoreOptions {
  rootDir?: string;
}

const DEFAULT_RUNS_DIR = path.resolve(process.cwd(), ".runs");

const TRANSITIONS: Record<RunState, RunState[]> = {
  brief_received: ["blueprint_generated"],
  blueprint_generated: ["awaiting_approval", "draft_generated"],
  awaiting_approval: ["draft_generated", "failed"],
  draft_generated: ["audit_completed"],
  audit_completed: ["fixes_applied", "export_ready"],
  fixes_applied: ["export_ready"],
  export_ready: [],
  failed: []
};

function nowIso(): string {
  return new Date().toISOString();
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function runPath(rootDir: string, runId: string): string {
  return path.join(rootDir, `${runId}.json`);
}

export class WorkflowRunStore {
  private readonly rootDir: string;

  constructor(options: WorkflowStoreOptions = {}) {
    this.rootDir = options.rootDir ?? DEFAULT_RUNS_DIR;
  }

  async createRun(projectId: string, requiresApproval: boolean): Promise<WorkflowRun> {
    const runId = makeId("run");
    const correlationId = makeId("corr");
    const run: WorkflowRun = {
      runId,
      projectId,
      correlationId,
      state: "brief_received",
      requiresApproval,
      approvalGranted: !requiresApproval,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      events: []
    };

    await this.persist(run);
    return run;
  }

  async getRun(runId: string): Promise<WorkflowRun | null> {
    try {
      const raw = await readFile(runPath(this.rootDir, runId), "utf8");
      return JSON.parse(raw) as WorkflowRun;
    } catch {
      return null;
    }
  }

  async transition(runId: string, nextState: RunState, metadata?: Record<string, string>): Promise<WorkflowRun> {
    const run = await this.requireRun(runId);

    if (!TRANSITIONS[run.state].includes(nextState)) {
      throw new Error(`Invalid transition: ${run.state} -> ${nextState}`);
    }

    if (run.state === "blueprint_generated" && run.requiresApproval && !run.approvalGranted && nextState === "draft_generated") {
      throw new Error("Approval required before draft generation");
    }

    const event: RunEvent = {
      id: makeId("evt"),
      runId: run.runId,
      correlationId: run.correlationId,
      timestamp: nowIso(),
      type: "transition",
      fromState: run.state,
      toState: nextState,
      metadata
    };

    run.state = nextState;
    run.updatedAt = nowIso();
    run.events.push(event);

    await this.persist(run);
    return run;
  }

  async requestApproval(runId: string): Promise<WorkflowRun> {
    const run = await this.requireRun(runId);

    if (!run.requiresApproval) {
      return run;
    }

    if (run.state !== "blueprint_generated") {
      throw new Error("Approval can only be requested after blueprint generation");
    }

    const event: RunEvent = {
      id: makeId("evt"),
      runId: run.runId,
      correlationId: run.correlationId,
      timestamp: nowIso(),
      type: "approval_requested",
      fromState: run.state,
      toState: "awaiting_approval"
    };

    run.state = "awaiting_approval";
    run.updatedAt = nowIso();
    run.events.push(event);

    await this.persist(run);
    return run;
  }

  async grantApproval(runId: string, approverId: string): Promise<WorkflowRun> {
    const run = await this.requireRun(runId);

    if (run.state !== "awaiting_approval") {
      throw new Error("Run is not awaiting approval");
    }

    run.approvalGranted = true;

    const event: RunEvent = {
      id: makeId("evt"),
      runId: run.runId,
      correlationId: run.correlationId,
      timestamp: nowIso(),
      type: "approval_granted",
      fromState: "awaiting_approval",
      toState: "draft_generated",
      metadata: { approverId }
    };

    run.events.push(event);
    run.state = "draft_generated";
    run.updatedAt = nowIso();

    await this.persist(run);
    return run;
  }

  async markStepFailed(runId: string, step: RunStep, reason: string): Promise<WorkflowRun> {
    const run = await this.requireRun(runId);

    const event: RunEvent = {
      id: makeId("evt"),
      runId: run.runId,
      correlationId: run.correlationId,
      timestamp: nowIso(),
      type: "step_failed",
      fromState: run.state,
      toState: "failed",
      metadata: { step, reason }
    };

    run.state = "failed";
    run.updatedAt = nowIso();
    run.events.push(event);

    await this.persist(run);
    return run;
  }

  async listRuns(projectId: string): Promise<WorkflowRun[]> {
    await mkdir(this.rootDir, { recursive: true });
    const files = await readFile(path.join(this.rootDir, "index.json"), "utf8").catch(() => "[]");
    const runIds = JSON.parse(files) as string[];

    const result: WorkflowRun[] = [];
    for (const runId of runIds) {
      const run = await this.getRun(runId);
      if (run && run.projectId === projectId) {
        result.push(run);
      }
    }

    return result;
  }

  private async requireRun(runId: string): Promise<WorkflowRun> {
    const run = await this.getRun(runId);
    if (!run) {
      throw new Error(`Run not found: ${runId}`);
    }
    return run;
  }

  private async persist(run: WorkflowRun): Promise<void> {
    await mkdir(this.rootDir, { recursive: true });
    await writeFile(runPath(this.rootDir, run.runId), JSON.stringify(run, null, 2), "utf8");
    await this.updateIndex(run.runId);
  }

  private async updateIndex(runId: string): Promise<void> {
    const indexPath = path.join(this.rootDir, "index.json");
    const raw = await readFile(indexPath, "utf8").catch(() => "[]");
    const ids = new Set(JSON.parse(raw) as string[]);
    ids.add(runId);
    await writeFile(indexPath, JSON.stringify(Array.from(ids), null, 2), "utf8");
  }
}

export function createWorkflowRunStore(options: WorkflowStoreOptions = {}): WorkflowRunStore {
  return new WorkflowRunStore(options);
}
