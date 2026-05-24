import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type AuditAction =
  | "run_created"
  | "run_transition"
  | "run_failed"
  | "review_approved"
  | "review_rejected"
  | "review_commented"
  | "export_blocked"
  | "export_allowed"
  | "security_alert";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  correlationId: string;
  actor: string;
  action: AuditAction;
  resourceType: "run" | "project" | "export" | "system";
  resourceId: string;
  metadata: Record<string, string>;
  previousHash: string;
  hash: string;
}

export interface AuditLogStoreOptions {
  rootDir?: string;
}

const DEFAULT_ROOT_DIR = path.resolve(process.cwd(), ".audit-log");
const LOG_FILE_NAME = "events.ndjson";
const INDEX_FILE_NAME = "index.json";

interface AuditIndex {
  lastHash: string;
  count: number;
}

export class AuditLogStore {
  private readonly rootDir: string;

  constructor(options: AuditLogStoreOptions = {}) {
    this.rootDir = options.rootDir ?? DEFAULT_ROOT_DIR;
  }

  async append(input: Omit<AuditLogEntry, "id" | "timestamp" | "previousHash" | "hash">): Promise<AuditLogEntry> {
    const index = await this.readIndex();
    const previousHash = index.lastHash;

    const entryBase = {
      id: makeId("audit"),
      timestamp: new Date().toISOString(),
      correlationId: input.correlationId,
      actor: input.actor,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      metadata: input.metadata,
      previousHash
    };

    const hash = sha256(JSON.stringify(entryBase));
    const entry: AuditLogEntry = { ...entryBase, hash };

    await this.ensureRoot();
    const line = `${JSON.stringify(entry)}\n`;
    await appendFileAtomic(path.join(this.rootDir, LOG_FILE_NAME), line);

    await this.writeIndex({
      lastHash: hash,
      count: index.count + 1
    });

    return entry;
  }

  async list(limit = 200): Promise<AuditLogEntry[]> {
    const content = await readFile(path.join(this.rootDir, LOG_FILE_NAME), "utf8").catch(() => "");
    if (!content.trim()) return [];

    const entries = content
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as AuditLogEntry);

    return entries.slice(Math.max(0, entries.length - limit));
  }

  async listByCorrelationId(correlationId: string): Promise<AuditLogEntry[]> {
    const entries = await this.list(10000);
    return entries.filter((entry) => entry.correlationId === correlationId);
  }

  async verifyIntegrity(): Promise<{ ok: boolean; brokenAtId?: string }> {
    const entries = await this.list(100000);
    let previousHash = "GENESIS";

    for (const entry of entries) {
      if (entry.previousHash !== previousHash) {
        return { ok: false, brokenAtId: entry.id };
      }

      const recalculated = sha256(
        JSON.stringify({
          id: entry.id,
          timestamp: entry.timestamp,
          correlationId: entry.correlationId,
          actor: entry.actor,
          action: entry.action,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId,
          metadata: entry.metadata,
          previousHash: entry.previousHash
        })
      );

      if (recalculated !== entry.hash) {
        return { ok: false, brokenAtId: entry.id };
      }

      previousHash = entry.hash;
    }

    return { ok: true };
  }

  async exportEntries(): Promise<{
    exportedAt: string;
    count: number;
    entries: AuditLogEntry[];
    integrity: { ok: boolean; brokenAtId?: string };
  }> {
    const entries = await this.list(100000);
    const integrity = await this.verifyIntegrity();
    return {
      exportedAt: new Date().toISOString(),
      count: entries.length,
      entries,
      integrity
    };
  }

  async enforceRetention(retainDays: number): Promise<{ removed: number; remaining: number }> {
    if (retainDays < 1) {
      throw new Error("retainDays must be >= 1");
    }

    const allEntries = await this.list(100000);
    if (allEntries.length === 0) {
      return { removed: 0, remaining: 0 };
    }

    const cutoff = Date.now() - retainDays * 24 * 60 * 60 * 1000;
    const retained = allEntries.filter((entry) => {
      const ts = new Date(entry.timestamp).getTime();
      return Number.isFinite(ts) && ts >= cutoff;
    });

    // Rebuild hash chain after retention pruning to keep integrity verifiable.
    let previousHash = "GENESIS";
    const rebuilt = retained.map((entry) => {
      const base = {
        id: entry.id,
        timestamp: entry.timestamp,
        correlationId: entry.correlationId,
        actor: entry.actor,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        metadata: entry.metadata,
        previousHash
      };
      const hash = sha256(JSON.stringify(base));
      previousHash = hash;
      return { ...base, hash } as AuditLogEntry;
    });

    await this.ensureRoot();
    const content = rebuilt.map((entry) => JSON.stringify(entry)).join("\n");
    await writeFile(path.join(this.rootDir, LOG_FILE_NAME), content ? `${content}\n` : "", "utf8");
    await this.writeIndex({
      lastHash: rebuilt.length > 0 ? rebuilt[rebuilt.length - 1].hash : "GENESIS",
      count: rebuilt.length
    });

    return { removed: allEntries.length - rebuilt.length, remaining: rebuilt.length };
  }

  private async ensureRoot(): Promise<void> {
    await mkdir(this.rootDir, { recursive: true });
  }

  private async readIndex(): Promise<AuditIndex> {
    await this.ensureRoot();
    const raw = await readFile(path.join(this.rootDir, INDEX_FILE_NAME), "utf8").catch(() => "");
    if (!raw) {
      const initial: AuditIndex = { lastHash: "GENESIS", count: 0 };
      await this.writeIndex(initial);
      return initial;
    }

    const parsed = JSON.parse(raw) as AuditIndex;
    return {
      lastHash: parsed.lastHash || "GENESIS",
      count: Number.isFinite(parsed.count) ? parsed.count : 0
    };
  }

  private async writeIndex(index: AuditIndex): Promise<void> {
    await this.ensureRoot();
    await writeFile(path.join(this.rootDir, INDEX_FILE_NAME), JSON.stringify(index, null, 2), "utf8");
  }
}

export function createAuditLogStore(options: AuditLogStoreOptions = {}): AuditLogStore {
  return new AuditLogStore(options);
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

async function appendFileAtomic(filePath: string, text: string): Promise<void> {
  const existing = await readFile(filePath, "utf8").catch(() => "");
  await writeFile(filePath, `${existing}${text}`, "utf8");
}
