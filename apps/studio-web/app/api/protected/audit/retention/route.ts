import { NextRequest, NextResponse } from "next/server";
import { createAuditLogStore } from "@product-studio/agent-runtime";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { retainDays?: number };
  const retainDays = Number(body.retainDays ?? 30);

  if (!Number.isFinite(retainDays) || retainDays < 1) {
    return NextResponse.json({ error: "retainDays must be >= 1" }, { status: 400 });
  }

  const store = createAuditLogStore();
  const result = await store.enforceRetention(retainDays);
  return NextResponse.json({
    retainDays,
    ...result
  });
}
