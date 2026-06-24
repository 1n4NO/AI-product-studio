import { NextResponse } from "next/server";

/**
 * Proxy GET /api/ollama/tags → http://localhost:11434/api/tags
 *
 * Avoids browser CORS issues when the wizard fetches Ollama's model list.
 * Server-to-server calls are always same-machine (both on the user's local box).
 */
export async function GET() {
  try {
    const res = await fetch("http://localhost:11434/api/tags", {
      signal: AbortSignal.timeout(5_000),
      headers: { "content-type": "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Ollama returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    // Ollama not running, not installed, or timed out
    return NextResponse.json(
      { error: "Ollama not reachable at localhost:11434" },
      { status: 503 }
    );
  }
}
