/**
 * Provider types, model catalogue, and Ollama model classifier.
 * "auto" = use the existing server-side cascade (env var → Ollama → mock).
 */

export type Provider = "anthropic" | "openai" | "gemini" | "ollama" | "auto";

export interface ProviderConfig {
  provider: Provider;
  apiKey?: string;   // undefined for Ollama / auto
  model?: string;    // selected Ollama model, or API model override
}

// ─── Provider metadata ────────────────────────────────────────────────────────

export const PROVIDER_META: Record<
  Exclude<Provider, "auto">,
  {
    label: string;
    tagline: string;
    badge?: string;
    keyPrefix?: string;
    keyPlaceholder?: string;
    docsLabel: string;
    docsUrl: string;
    defaultModel: string;
  }
> = {
  anthropic: {
    label: "Anthropic Claude",
    tagline: "Highest quality reasoning and structured JSON output",
    badge: "Recommended",
    keyPrefix: "sk-ant-",
    keyPlaceholder: "sk-ant-api03-…",
    docsLabel: "Get key at console.anthropic.com",
    docsUrl: "https://console.anthropic.com/account/keys",
    defaultModel: "claude-opus-4-5",
  },
  openai: {
    label: "OpenAI",
    tagline: "GPT-4o — industry-standard, fast and reliable",
    keyPrefix: "sk-",
    keyPlaceholder: "sk-proj-…",
    docsLabel: "Get key at platform.openai.com",
    docsUrl: "https://platform.openai.com/api-keys",
    defaultModel: "gpt-4o",
  },
  gemini: {
    label: "Google Gemini",
    tagline: "Gemini 1.5 Pro — multimodal, large context window",
    keyPlaceholder: "AIzaSy…",
    docsLabel: "Get key at aistudio.google.com",
    docsUrl: "https://aistudio.google.com/apikey",
    defaultModel: "gemini-1.5-pro",
  },
  ollama: {
    label: "Ollama (Local)",
    tagline: "Run open models locally — fully private, no key required",
    badge: "Private",
    docsLabel: "Install at ollama.com",
    docsUrl: "https://ollama.com/download",
    defaultModel: "llama3.2",
  },
};

// ─── Ollama model types ───────────────────────────────────────────────────────

export interface OllamaModel {
  name: string;
  parameterSize: string;
  family: string;
  sizeBytes: number;
  capable: boolean;     // can generate structured JSON blueprints
  recommended: boolean; // specifically good for this use case
}

/** Raw shape returned by GET http://localhost:11434/api/tags */
interface OllamaRawModel {
  name: string;
  size: number;
  details?: {
    parameter_size?: string;
    family?: string;
    families?: string[];
  };
}

// Models that produce reliable structured JSON
const RECOMMENDED_BASE_NAMES = [
  "llama3.2", "llama3.1", "llama3",
  "mistral", "mixtral",
  "gemma2", "gemma3",
  "phi3", "phi4",
  "qwen2.5", "qwen2",
  "deepseek-r1", "deepseek-v2",
  "command-r",
];

// Models that are NOT capable of text generation for blueprints
const INCAPABLE_PATTERNS = [
  "embed", "embedding",
  "vision", "llava", "moondream", "bakllava", "minicpm-v",
  "whisper", "clip", "nomic",
];

export function classifyOllamaModel(raw: OllamaRawModel): OllamaModel {
  const nameLower = raw.name.toLowerCase();
  const paramSize = raw.details?.parameter_size ?? "";
  const family = raw.details?.family ?? nameLower.split(":")[0] ?? "unknown";

  // Parse parameter count in billions
  const m = paramSize.match(/^(\d+\.?\d*)\s*([BbMm])/);
  let paramB = 0;
  if (m) {
    const val = parseFloat(m[1]);
    paramB = m[2].toLowerCase() === "b" ? val : val / 1000;
  }

  const hasIncapable = INCAPABLE_PATTERNS.some((p) => nameLower.includes(p));
  const capable = !hasIncapable && (paramB === 0 || paramB >= 1);

  const baseName = nameLower.split(":")[0] ?? "";
  const recommended =
    capable && RECOMMENDED_BASE_NAMES.some((r) => baseName.includes(r));

  return {
    name: raw.name,
    parameterSize: paramSize || "?",
    family,
    sizeBytes: raw.size,
    capable,
    recommended,
  };
}

// Models to suggest installing when none are available
export const SUGGESTED_INSTALLS: Array<{
  name: string;
  size: string;
  description: string;
}> = [
  { name: "llama3.2",   size: "2 GB",  description: "Fast · Great at JSON · Recommended starter" },
  { name: "llama3.1",   size: "4.7 GB", description: "Higher quality · Good for complex briefs" },
  { name: "mistral",    size: "4.1 GB", description: "Excellent at structured output · Very reliable" },
  { name: "gemma2",     size: "5.5 GB", description: "Google open model · Strong reasoning" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extract provider config from an API request body. */
export function extractProviderConfig(
  body: Record<string, unknown>
): ProviderConfig | undefined {
  const p = body._provider as string | undefined;
  if (!p || !["anthropic", "openai", "gemini", "ollama", "auto"].includes(p)) return undefined;
  return {
    provider: p as Provider,
    apiKey: body._apiKey as string | undefined,
    model: body._model as string | undefined,
  };
}
