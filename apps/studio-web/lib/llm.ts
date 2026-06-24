/**
 * LLM client supporting Anthropic, OpenAI, Gemini, and Ollama.
 *
 * callLLM()           — existing cascade: env ANTHROPIC_API_KEY → Ollama → null
 * callLLMWithConfig() — use a specific runtime ProviderConfig from the wizard
 */

import type { ProviderConfig } from "./providers";

const OLLAMA_BASE  = "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.2";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMOptions {
  maxTokens?: number;
}

// ─── Anthropic ────────────────────────────────────────────────────────────────

async function callAnthropic(
  messages: LLMMessage[],
  opts: LLMOptions,
  apiKey: string,
  model = "claude-opus-4-5"
): Promise<string | null> {
  const system   = messages.find((m) => m.role === "system")?.content ?? "";
  const userMsgs = messages.filter((m) => m.role !== "system");
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key":         apiKey,
        "anthropic-version": "2023-06-01",
        "content-type":      "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: opts.maxTokens ?? 2048,
        system,
        messages: userMsgs,
      }),
    });
    if (!res.ok) {
      console.warn(`[llm/anthropic] HTTP ${res.status}`);
      return null;
    }
    const data = (await res.json()) as {
      content?: Array<{ type: string; text: string }>;
    };
    return data.content?.find((c) => c.type === "text")?.text ?? null;
  } catch (err) {
    console.warn("[llm/anthropic]", err);
    return null;
  }
}

// ─── OpenAI ───────────────────────────────────────────────────────────────────

async function callOpenAI(
  messages: LLMMessage[],
  opts: LLMOptions,
  apiKey: string,
  model = "gpt-4o"
): Promise<string | null> {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization:  `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: opts.maxTokens ?? 2048,
        messages,
      }),
    });
    if (!res.ok) {
      console.warn(`[llm/openai] HTTP ${res.status}`);
      return null;
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.warn("[llm/openai]", err);
    return null;
  }
}

// ─── Google Gemini ────────────────────────────────────────────────────────────

async function callGemini(
  messages: LLMMessage[],
  opts: LLMOptions,
  apiKey: string,
  model = "gemini-1.5-pro"
): Promise<string | null> {
  // Gemini uses role "model" instead of "assistant"; system prompt prepended to first user turn
  const systemText = messages.find((m) => m.role === "system")?.content ?? "";
  const rest       = messages.filter((m) => m.role !== "system");

  const contents = rest.map((m, i) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{
      text: i === 0 && systemText ? `${systemText}\n\n${m.content}` : m.content,
    }],
  }));

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: { maxOutputTokens: opts.maxTokens ?? 2048 },
        }),
      }
    );
    if (!res.ok) {
      console.warn(`[llm/gemini] HTTP ${res.status}`);
      return null;
    }
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch (err) {
    console.warn("[llm/gemini]", err);
    return null;
  }
}

// ─── Ollama ───────────────────────────────────────────────────────────────────

async function callOllama(
  messages: LLMMessage[],
  opts: LLMOptions,
  model = OLLAMA_MODEL
): Promise<string | null> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/v1/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: AbortSignal.timeout(60_000),
      body: JSON.stringify({ model, max_tokens: opts.maxTokens ?? 2048, messages }),
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

// ─── Public API ───────────────────────────────────────────────────────────────

/** Strip markdown fences from LLM output that wraps JSON. */
export function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

/**
 * Use a runtime ProviderConfig (from the wizard) to call the chosen provider.
 * Falls back to callLLM() when config is absent or provider is "auto".
 */
export async function callLLMWithConfig(
  messages: LLMMessage[],
  opts: LLMOptions,
  config?: ProviderConfig
): Promise<string | null> {
  if (!config || config.provider === "auto") return callLLM(messages, opts);

  switch (config.provider) {
    case "anthropic":
      if (config.apiKey) {
        const r = await callAnthropic(messages, opts, config.apiKey, config.model);
        if (r) return r;
        console.warn("[llm] Anthropic call failed");
      }
      return null;

    case "openai":
      if (config.apiKey) {
        const r = await callOpenAI(messages, opts, config.apiKey, config.model);
        if (r) return r;
        console.warn("[llm] OpenAI call failed");
      }
      return null;

    case "gemini":
      if (config.apiKey) {
        const r = await callGemini(messages, opts, config.apiKey, config.model);
        if (r) return r;
        console.warn("[llm] Gemini call failed");
      }
      return null;

    case "ollama":
      return callOllama(messages, opts, config.model);
  }
}

/**
 * Existing cascade: ANTHROPIC_API_KEY env → Ollama auto-detect → null.
 * Used when no runtime config is provided ("auto" / skip).
 */
export async function callLLM(
  messages: LLMMessage[],
  opts: LLMOptions = {}
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (apiKey) {
    const result = await callAnthropic(messages, opts, apiKey);
    if (result) return result;
    console.warn("[llm] Anthropic env key failed — falling back to Ollama");
  }

  const ollamaResult = await callOllama(messages, opts);
  if (ollamaResult) return ollamaResult;

  if (apiKey || process.env.NODE_ENV !== "development") {
    console.warn("[llm] All providers failed — caller must use fallback");
  }

  return null;
}
