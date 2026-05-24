import { createHash } from "node:crypto";
import { lookup } from "node:dns/promises";
import { mkdir, writeFile } from "node:fs/promises";
import { isIP } from "node:net";
import path from "node:path";

export interface SnapshotServiceOptions {
  rootDir?: string;
  timeoutMs?: number;
  allowedHosts?: string[];
  blockPrivateNetworks?: boolean;
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
  private readonly allowedHosts: Set<string>;
  private readonly blockPrivateNetworks: boolean;

  constructor(options: SnapshotServiceOptions = {}) {
    this.rootDir = options.rootDir ?? DEFAULT_ROOT_DIR;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.allowedHosts = new Set((options.allowedHosts ?? []).map((host) => host.toLowerCase()));
    this.blockPrivateNetworks = options.blockPrivateNetworks ?? true;
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
    const parsed = new URL(url);
    await this.validateUrl(parsed);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(parsed.toString(), {
        signal: controller.signal,
        redirect: "error"
      });

      if (!response.ok) {
        throw new Error(`Snapshot fetch failed: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();
      return this.createFromHtml(parsed.toString(), html);
    } finally {
      clearTimeout(timeout);
    }
  }

  private async validateUrl(parsed: URL): Promise<void> {
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("Only http and https URLs are allowed");
    }

    if (parsed.username || parsed.password) {
      throw new Error("URLs with embedded credentials are not allowed");
    }

    const hostname = parsed.hostname.toLowerCase();

    if (this.allowedHosts.size > 0 && !this.allowedHosts.has(hostname)) {
      throw new Error("Hostname is not in allowlist");
    }

    if (!this.blockPrivateNetworks) {
      return;
    }

    if (isBlockedHostname(hostname)) {
      throw new Error("Blocked hostname");
    }

    const dnsResult = await lookup(hostname, { all: true });
    for (const record of dnsResult) {
      if (isPrivateOrLocalAddress(record.address)) {
        throw new Error("Resolved address is private or local network");
      }
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

function isBlockedHostname(hostname: string): boolean {
  if (hostname === "localhost") return true;
  if (hostname.endsWith(".local")) return true;
  if (hostname.endsWith(".internal")) return true;
  return false;
}

function isPrivateOrLocalAddress(address: string): boolean {
  const ipVersion = isIP(address);
  if (ipVersion === 4) {
    return isPrivateIPv4(address);
  }

  if (ipVersion === 6) {
    return isPrivateIPv6(address);
  }

  return false;
}

function isPrivateIPv4(address: string): boolean {
  const parts = address.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return true;

  const [a, b] = parts;

  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 0) return true;

  return false;
}

function isPrivateIPv6(address: string): boolean {
  const lower = address.toLowerCase();
  if (lower === "::1") return true;
  if (lower.startsWith("fe80:")) return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
  if (lower === "::") return true;
  return false;
}
