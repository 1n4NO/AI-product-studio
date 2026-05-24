import type { AuditFinding, AuditReport } from "@product-studio/shared-types";

export interface AuditRequest {
  html: string;
  urlOrSnapshotId: string;
}

export interface UxAuditAdapter {
  runAudit(input: AuditRequest): Promise<AuditReport>;
}

export class BasicUxAuditAdapter implements UxAuditAdapter {
  async runAudit(input: AuditRequest): Promise<AuditReport> {
    const findings: AuditFinding[] = [];

    if (!input.html.includes("<h1")) {
      findings.push({
        id: "missing-h1",
        category: "readability",
        severity: "high",
        title: "Missing H1 heading",
        description: "The document does not contain a top-level heading.",
        recommendation: "Add one clear <h1> to establish page hierarchy."
      });
    }

    if (!input.html.includes("alt=")) {
      findings.push({
        id: "missing-image-alt",
        category: "accessibility",
        severity: "medium",
        title: "Potential missing image alt text",
        description: "Images may be present without alternative text.",
        recommendation: "Ensure all meaningful images include descriptive alt text."
      });
    }

    const deduction = findings.length * 7;
    const base = 88;
    const score = Math.max(0, Math.min(100, base - deduction));

    return {
      urlOrSnapshotId: input.urlOrSnapshotId,
      score,
      categoryScores: {
        accessibility: findings.some((f) => f.category === "accessibility") ? score - 4 : score,
        readability: findings.some((f) => f.category === "readability") ? score - 3 : score,
        performance: score + 2 > 100 ? 100 : score + 2
      },
      findings,
      generatedAt: new Date().toISOString()
    };
  }
}

export function createUxAuditAdapter(): UxAuditAdapter {
  return new BasicUxAuditAdapter();
}
