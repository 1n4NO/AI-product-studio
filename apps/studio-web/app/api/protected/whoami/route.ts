import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guards";

export async function GET() {
  const result = await requireRole("viewer");
  if (!result.ok) return result.response;

  return NextResponse.json({
    id: result.session.user.id,
    email: result.session.user.email,
    role: result.session.user.role
  });
}
