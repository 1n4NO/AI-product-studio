import { NextResponse } from "next/server";
import { createSession, isValidRole } from "@/lib/auth/session";
import type { UserRole } from "@/lib/auth/types";

interface LoginBody {
  id?: unknown;
  email?: unknown;
  role?: unknown;
}

export async function POST(req: Request) {
  const body = (await req.json()) as LoginBody;

  if (typeof body.id !== "string" || typeof body.email !== "string" || typeof body.role !== "string") {
    return NextResponse.json({ error: "id, email, and role are required" }, { status: 400 });
  }

  if (!isValidRole(body.role)) {
    return NextResponse.json({ error: "role must be admin, editor, or viewer" }, { status: 400 });
  }

  await createSession({
    id: body.id,
    email: body.email,
    role: body.role as UserRole
  });

  return NextResponse.json({ ok: true });
}
