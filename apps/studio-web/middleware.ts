import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { evaluateFixedWindowRateLimit } from "./lib/rate-limit";

const AUTH_COOKIE_NAME = "ps_session";
const RATE_LIMIT_MAX_REQUESTS = Number(process.env.PROTECTED_API_RATE_LIMIT_MAX ?? "60");
const RATE_LIMIT_WINDOW_SECONDS = Number(process.env.PROTECTED_API_RATE_LIMIT_WINDOW_SECONDS ?? "60");

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/protected")) {
    return NextResponse.next();
  }

  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateKey = `${clientIp}:${request.nextUrl.pathname}`;
  const rateResult = evaluateFixedWindowRateLimit(rateKey, RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_SECONDS);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: "Too Many Requests", retryAfterSeconds: rateResult.retryAfterSeconds },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateResult.retryAfterSeconds)
        }
      }
    );
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/protected/:path*"]
};
