/**
 * Lightweight LLM client with provider cascade:
 *   1. Anthropic (if ANTHROPIC_API_KEY is set)
 *   2. Ollama local (if reachable on localhost:11434)
 *   3. Caller-supplied mock/fallback
 */

const OLLAMA_BASE = "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.2";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMOptions {
  maxTokens?: number;
}

/** Try Anthropic. Returns the text content or null on failure. */
async function callAnthropic(
  messages: LLMMessage[],
  opts: LLMOptions,
  apiKey: string
): Promise<string | null> {
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  const userMessages = messages.filter((m) => m.role !== "system");

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: opts.maxTokens ?? 2048,
        system,
        messages: userMessages,
      }),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      content?: Array<{ type: string; text: string }>;
    };
    return data.content?.find((c) => c.type === "text")?.text ?? null;
  } catch {
    return null;
  }
}

/** Try Ollama local. Returns the text content or null on failure. */
async function callOllama(messages: LLMMessage[], opts: LLMOptions): Promise<string | null> {
  try {
    // Use OpenAI-compatible endpoint so we get a single JSON response
    const res = await fetch(`${OLLAMA_BASE}/v1/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      // Short timeout — if Ollama isn't running we don't want to hang
      signal: AbortSignal.timeout(60_000),
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        max_tokens: opts.maxTokens ?? 2048,
        messages,
      }),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

/** Strip markdown fences from LLM output that wraps JSON. */
export function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

/**
 * Call the best available LLM provider in order.
 * Returns the raw text output, or null if all providers fail.
 */
export async function callLLM(
  messages: LLMMessage[],
  opts: LLMOptions = {}
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (apiKey) {
    const result = await callAnthropic(messages, opts, apiKey);
    if (result) return result;
    console.warn("[llm] Anthropic call failed — falling back to Ollama");
  }

  const ollamaResult = await callOllama(messages, opts);
  if (ollamaResult) return ollamaResult;

  if (apiKey || process.env.NODE_ENV !== "development") {
    console.warn("[llm] All LLM providers failed — caller must use fallback");
  }

  return null;
}
