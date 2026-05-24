import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export interface SnapshotServiceOptions {
  rootDir?: string;
  timeoutMs?: number;
}

export interface HtmlSnapshot {
  id: string;
  source: string;
  createdAt: string;
  contentHash: string;
  html: string;
  byteLength: number;
}

const DEFAULT_ROOT_DIR = path.resolve(process.cwd(), ".snapshots");
const DEFAULT_TIMEOUT_MS = 15000;

export class SnapshotService {
  private readonly rootDir: string;
  private readonly timeoutMs: number;

  constructor(options: SnapshotServiceOptions = {}) {
    this.rootDir = options.rootDir ?? DEFAULT_ROOT_DIR;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async createFromHtml(source: string, html: string): Promise<HtmlSnapshot> {
    const normalized = normalizeHtml(html);
    const contentHash = sha256(normalized);
    const id = `snapshot_${Date.now()}_${contentHash.slice(0, 12)}`;

    const snapshot: HtmlSnapshot = {
      id,
      source,
      createdAt: new Date().toISOString(),
      contentHash,
      html: normalized,
      byteLength: Buffer.byteLength(normalized, "utf8")
    };

    await this.persist(snapshot);
    return snapshot;
  }

  async createFromUrl(url: string): Promise<HtmlSnapshot> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Snapshot fetch failed: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();
      return this.createFromHtml(url, html);
    } finally {
      clearTimeout(timeout);
    }
  }

  private async persist(snapshot: HtmlSnapshot): Promise<void> {
    await mkdir(this.rootDir, { recursive: true });
    await writeFile(path.join(this.rootDir, `${snapshot.id}.json`), JSON.stringify(snapshot, null, 2), "utf8");
  }
}

export function createSnapshotService(options: SnapshotServiceOptions = {}): SnapshotService {
  return new SnapshotService(options);
}

function normalizeHtml(html: string): string {
  return html
    .replace(/\r\n/g, "\n")
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .trim();
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
