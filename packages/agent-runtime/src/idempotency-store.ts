import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export interface IdempotencyStoreOptions {
  rootDir?: string;
}

export interface IdempotencyRequest {
  key: string;
  operation: string;
  fingerprint: string;
}

export interface IdempotencyCompletedResponse<T> {
  status: "completed";
  key: string;
  operation: string;
  fingerprint: string;
  response: T;
  updatedAt: string;
}

export interface IdempotencyConflict {
  status: "conflict";
  key: string;
  operation: string;
  message: string;
}

export interface IdempotencyInProgress {
  status: "in_progress";
  key: string;
  operation: string;
  message: string;
}

type IdempotencyLookup<T> = IdempotencyCompletedResponse<T> | IdempotencyConflict | IdempotencyInProgress | null;

interface StoredRecord<T = unknown> {
  key: string;
  operation: string;
  fingerprint: string;
  state: "in_progress" | "completed";
  createdAt: string;
  updatedAt: string;
  response?: T;
}

const DEFAULT_ROOT_DIR = path.resolve(process.cwd(), ".idempotency");

function nowIso(): string {
  return new Date().toISOString();
}

function makeSafeFileName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-_]/g, "-");
}

export class FileIdempotencyStore {
  private readonly rootDir: string;

  constructor(options: IdempotencyStoreOptions = {}) {
    this.rootDir = options.rootDir ?? DEFAULT_ROOT_DIR;
  }

  async lookup<T>(request: IdempotencyRequest): Promise<IdempotencyLookup<T>> {
    const existing = await this.readRecord<T>(request.key);
    if (!existing) {
      return null;
    }

    if (existing.operation !== request.operation || existing.fingerprint !== request.fingerprint) {
      return {
        status: "conflict",
        key: request.key,
        operation: request.operation,
        message: "Idempotency key already used with different operation or request fingerprint"
      };
    }

    if (existing.state === "in_progress") {
      return {
        status: "in_progress",
        key: request.key,
        operation: request.operation,
        message: "Operation already in progress for this key"
      };
    }

    return {
      status: "completed",
      key: existing.key,
      operation: existing.operation,
      fingerprint: existing.fingerprint,
      response: existing.response as T,
      updatedAt: existing.updatedAt
    };
  }

  async begin(request: IdempotencyRequest): Promise<void> {
    const existing = await this.readRecord(request.key);
    if (existing) {
      throw new Error("Idempotency record already exists");
    }

    const record: StoredRecord = {
      key: request.key,
      operation: request.operation,
      fingerprint: request.fingerprint,
      state: "in_progress",
      createdAt: nowIso(),
      updatedAt: nowIso()
    };

    await this.writeRecord(request.key, record);
  }

  async complete<T>(request: IdempotencyRequest, response: T): Promise<void> {
    const existing = await this.readRecord(request.key);
    if (!existing) {
      throw new Error("Cannot complete missing idempotency record");
    }

    if (existing.operation !== request.operation || existing.fingerprint !== request.fingerprint) {
      throw new Error("Idempotency conflict while completing record");
    }

    const updated: StoredRecord<T> = {
      ...existing,
      state: "completed",
      response,
      updatedAt: nowIso()
    };

    await this.writeRecord(request.key, updated);
  }

  private recordPath(key: string): string {
    return path.join(this.rootDir, `${makeSafeFileName(key)}.json`);
  }

  private async readRecord<T>(key: string): Promise<StoredRecord<T> | null> {
    try {
      const raw = await readFile(this.recordPath(key), "utf8");
      return JSON.parse(raw) as StoredRecord<T>;
    } catch {
      return null;
    }
  }

  private async writeRecord<T>(key: string, record: StoredRecord<T>): Promise<void> {
    await mkdir(this.rootDir, { recursive: true });
    await writeFile(this.recordPath(key), JSON.stringify(record, null, 2), "utf8");
  }
}

export interface ExecuteIdempotentOptions<T> {
  store: FileIdempotencyStore;
  request: IdempotencyRequest;
  execute: () => Promise<T>;
}

export type ExecuteIdempotentResult<T> =
  | { ok: true; replayed: false; value: T }
  | { ok: true; replayed: true; value: T }
  | { ok: false; error: IdempotencyConflict | IdempotencyInProgress };

export async function executeIdempotent<T>(options: ExecuteIdempotentOptions<T>): Promise<ExecuteIdempotentResult<T>> {
  const lookup = await options.store.lookup<T>(options.request);

  if (lookup?.status === "completed") {
    return { ok: true, replayed: true, value: lookup.response };
  }

  if (lookup?.status === "conflict" || lookup?.status === "in_progress") {
    return { ok: false, error: lookup };
  }

  await options.store.begin(options.request);
  const value = await options.execute();
  await options.store.complete(options.request, value);
  return { ok: true, replayed: false, value };
}

export function createIdempotencyStore(options: IdempotencyStoreOptions = {}): FileIdempotencyStore {
  return new FileIdempotencyStore(options);
}
