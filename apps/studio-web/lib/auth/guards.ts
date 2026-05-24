import { NextResponse } from "next/server";
import { getSession } from "./session";
import type { SessionPayload, UserRole } from "./types";

const ROLE_WEIGHT: Record<UserRole, number> = {
  viewer: 1,
  editor: 2,
  admin: 3
};

export async function requireSession(): Promise<{ ok: true; session: SessionPayload } | { ok: false; response: NextResponse }> {
  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    };
  }

  return { ok: true, session };
}

export async function requireRole(minRole: UserRole): Promise<{ ok: true; session: SessionPayload } | { ok: false; response: NextResponse }> {
  const result = await requireSession();
  if (!result.ok) return result;

  const actual = result.session.user.role;
  if (ROLE_WEIGHT[actual] < ROLE_WEIGHT[minRole]) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 })
    };
  }

  return result;
}
