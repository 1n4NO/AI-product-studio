import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export type ArtifactKind =
  | "brief"
  | "blueprint"
  | "draft"
  | "theme"
  | "audit-report"
  | "fix-plan"
  | "export-bundle";

export interface ArtifactRecord {
  id: string;
  projectId: string;
  runId: string;
  kind: ArtifactKind;
  filePath: string;
  sizeBytes: number;
  createdAt: string;
  contentType: string;
}

export interface SaveArtifactInput {
  projectId: string;
  runId: string;
  kind: ArtifactKind;
  contentType: string;
  payload: string;
}

export interface ArtifactStoreOptions {
  rootDir?: string;
}

interface ArtifactIndex {
  version: 1;
  artifacts: ArtifactRecord[];
}

const DEFAULT_ROOT_DIR = path.resolve(process.cwd(), ".artifacts");

function nowIso(): string {
  return new Date().toISOString();
}

function safeSegment(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-_]/g, "-");
}

function artifactId(input: SaveArtifactInput): string {
  const ts = Date.now();
  return `${safeSegment(input.projectId)}-${safeSegment(input.runId)}-${input.kind}-${ts}`;
}

export class FileArtifactStore {
  private readonly rootDir: string;

  constructor(options: ArtifactStoreOptions = {}) {
    this.rootDir = options.rootDir ?? DEFAULT_ROOT_DIR;
  }

  async saveArtifact(input: SaveArtifactInput): Promise<ArtifactRecord> {
    const id = artifactId(input);
    const ext = input.contentType.includes("json") ? "json" : "txt";
    const relDir = path.join(safeSegment(input.projectId), safeSegment(input.runId));
    const absDir = path.join(this.rootDir, relDir);
    const fileName = `${input.kind}-${id}.${ext}`;
    const absFilePath = path.join(absDir, fileName);

    await mkdir(absDir, { recursive: true });
    await writeFile(absFilePath, input.payload, "utf8");

    const fileStat = await stat(absFilePath);
    const record: ArtifactRecord = {
      id,
      projectId: input.projectId,
      runId: input.runId,
      kind: input.kind,
      filePath: absFilePath,
      sizeBytes: fileStat.size,
      createdAt: nowIso(),
      contentType: input.contentType
    };

    const index = await this.readIndex();
    index.artifacts.push(record);
    await this.writeIndex(index);

    return record;
  }

  async listArtifacts(projectId: string, runId?: string): Promise<ArtifactRecord[]> {
    const index = await this.readIndex();
    return index.artifacts.filter((item) => {
      if (item.projectId !== projectId) return false;
      if (runId && item.runId !== runId) return false;
      return true;
    });
  }

  async getArtifactContent(id: string): Promise<string | null> {
    const index = await this.readIndex();
    const match = index.artifacts.find((item) => item.id === id);
    if (!match) {
      return null;
    }

    return readFile(match.filePath, "utf8");
  }

  async cleanupArtifacts(retentionDays: number): Promise<{ removed: number }> {
    if (retentionDays <= 0) {
      throw new Error("retentionDays must be greater than 0");
    }

    const index = await this.readIndex();
    const cutoffMs = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

    const toRemove = index.artifacts.filter((item) => Date.parse(item.createdAt) < cutoffMs);
    const keep = index.artifacts.filter((item) => Date.parse(item.createdAt) >= cutoffMs);

    for (const item of toRemove) {
      await rm(item.filePath, { force: true });
    }

    await this.writeIndex({ version: 1, artifacts: keep });
    return { removed: toRemove.length };
  }

  async stats(): Promise<{ artifactCount: number; bytesUsed: number }> {
    const index = await this.readIndex();
    return {
      artifactCount: index.artifacts.length,
      bytesUsed: index.artifacts.reduce((sum, item) => sum + item.sizeBytes, 0)
    };
  }

  private indexPath(): string {
    return path.join(this.rootDir, "index.json");
  }

  private async readIndex(): Promise<ArtifactIndex> {
    const indexPath = this.indexPath();

    await mkdir(this.rootDir, { recursive: true });
    try {
      const raw = await readFile(indexPath, "utf8");
      const parsed = JSON.parse(raw) as ArtifactIndex;
      if (!Array.isArray(parsed.artifacts)) {
        throw new Error("Invalid artifact index format");
      }
      return parsed;
    } catch {
      const empty: ArtifactIndex = { version: 1, artifacts: [] };
      await this.writeIndex(empty);
      return empty;
    }
  }

  private async writeIndex(index: ArtifactIndex): Promise<void> {
    await mkdir(this.rootDir, { recursive: true });
    await writeFile(this.indexPath(), JSON.stringify(index, null, 2), "utf8");
  }

  async listProjectRuns(projectId: string): Promise<string[]> {
    const dir = path.join(this.rootDir, safeSegment(projectId));
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    } catch {
      return [];
    }
  }
}

export function createArtifactStore(options: ArtifactStoreOptions = {}): FileArtifactStore {
  return new FileArtifactStore(options);
}
