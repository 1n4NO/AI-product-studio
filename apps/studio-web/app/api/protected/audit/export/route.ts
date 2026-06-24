import { NextRequest, NextResponse } from "next/server";
import { createAuditLogStore } from "@/lib/agent-runtime-inline";

export async function GET(request: NextRequest) {
  const store = createAuditLogStore();
  const correlationId = request.nextUrl.searchParams.get("correlationId");

  if (correlationId) {
    const entries = await store.listByCorrelationId(correlationId);
    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      count: entries.length,
      correlationId,
      entries
    });
  }

  const payload = await store.exportEntries();
  return NextResponse.json(payload);
}
