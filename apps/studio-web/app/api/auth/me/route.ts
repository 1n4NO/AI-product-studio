import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guards";

export async function GET() {
  const result = await requireSession();
  if (!result.ok) return result.response;

  return NextResponse.json({ user: result.session.user });
}
