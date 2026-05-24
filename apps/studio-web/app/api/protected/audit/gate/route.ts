import { NextResponse } from "next/server";
import { isAuditReport, type AuditReport } from "@product-studio/shared-types";
import { evaluateAuditGate } from "@product-studio/ux-audit/gates";

interface AuditGateBody {
  current?: unknown;
  baseline?: unknown;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as AuditGateBody;

  if (!isAuditReport(body.current)) {
    return NextResponse.json({ error: "current must be a valid AuditReport" }, { status: 400 });
  }

  if (body.baseline !== undefined && body.baseline !== null && !isAuditReport(body.baseline)) {
    return NextResponse.json({ error: "baseline must be a valid AuditReport when provided" }, { status: 400 });
  }

  const current = body.current as AuditReport;
  const baseline = (body.baseline as AuditReport | null | undefined) ?? null;
  const result = evaluateAuditGate(current, baseline);

  return NextResponse.json(result);
}
