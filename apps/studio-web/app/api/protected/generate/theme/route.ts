import { NextRequest, NextResponse } from "next/server";
import type { Tone, ThemeTokens } from "@product-studio/shared-types";
import { isThemeTokens } from "@product-studio/shared-types";
import { callLLMWithConfig, stripFences } from "@/lib/llm";
import { extractProviderConfig } from "@/lib/providers";

interface ThemeRequest {
  tone: Tone;
  productName?: string;
  brief?: string;
}

const TONES: Tone[] = ["professional", "friendly", "bold", "playful", "minimal"];

function isTone(v: unknown): v is Tone {
  return TONES.includes(v as Tone);
}

function isThemeRequest(v: unknown): v is ThemeRequest {
  return typeof v === "object" && v !== null && isTone((v as Record<string, unknown>).tone);
}

/* ─── Hardcoded fallback presets (no external imports needed) ─────────── */

const BASE = {
  typography: { xs: "11px", sm: "13px", md: "15px", lg: "18px", xl: "24px" },
  spacing:    { xs: "4px",  sm: "8px",  md: "16px", lg: "24px", xl: "40px" },
  motion:     { fast: "100ms ease", normal: "200ms ease", slow: "350ms ease-in-out" },
};

const FALLBACK_PRESETS: Record<Tone, ThemeTokens[]> = {
  bold: [
    { name: "Dark Bold",      ...BASE, radii: { xs:"2px", sm:"4px", md:"8px",  lg:"12px", xl:"16px" }, shadows: { sm:"0 1px 2px rgba(0,0,0,.4)", md:"0 4px 12px rgba(0,0,0,.4)", lg:"0 8px 32px rgba(0,0,0,.4)" }, colors: { primary:"#7c3aed", secondary:"#4f46e5", background:"#09090b", surface:"#18181b", text:"#fafafa", textMuted:"#a1a1aa", accent:"#a78bfa", border:"#27272a" } },
    { name: "Electric Night", ...BASE, radii: { xs:"2px", sm:"4px", md:"6px",  lg:"10px", xl:"14px" }, shadows: { sm:"0 1px 2px rgba(0,0,0,.4)", md:"0 4px 12px rgba(0,0,0,.4)", lg:"0 8px 32px rgba(0,0,0,.4)" }, colors: { primary:"#6366f1", secondary:"#8b5cf6", background:"#0f0f23", surface:"#1e1e3f", text:"#e8e8ff", textMuted:"#8888cc", accent:"#a5b4fc", border:"#2e2e5a" } },
    { name: "High Contrast",  ...BASE, radii: { xs:"0px", sm:"2px", md:"4px",  lg:"6px",  xl:"8px"  }, shadows: { sm:"0 1px 2px rgba(0,0,0,.4)", md:"0 4px 12px rgba(0,0,0,.4)", lg:"0 8px 32px rgba(0,0,0,.4)" }, colors: { primary:"#ffffff", secondary:"#e4e4e7", background:"#000000", surface:"#111111", text:"#ffffff", textMuted:"#a1a1aa", accent:"#7c3aed", border:"#333333" } },
  ],
  professional: [
    { name: "Enterprise Light", ...BASE, radii: { xs:"2px", sm:"4px", md:"6px", lg:"8px",  xl:"12px" }, shadows: { sm:"0 1px 2px rgba(0,0,0,.08)", md:"0 4px 12px rgba(0,0,0,.08)", lg:"0 8px 32px rgba(0,0,0,.08)" }, colors: { primary:"#1d4ed8", secondary:"#1e40af", background:"#ffffff", surface:"#f8fafc", text:"#0f172a", textMuted:"#64748b", accent:"#3b82f6", border:"#e2e8f0" } },
    { name: "Executive Dark",   ...BASE, radii: { xs:"2px", sm:"4px", md:"6px", lg:"8px",  xl:"12px" }, shadows: { sm:"0 1px 2px rgba(0,0,0,.4)",  md:"0 4px 12px rgba(0,0,0,.4)",  lg:"0 8px 32px rgba(0,0,0,.4)"  }, colors: { primary:"#2563eb", secondary:"#1d4ed8", background:"#0c1220", surface:"#111827", text:"#f1f5f9", textMuted:"#94a3b8", accent:"#60a5fa", border:"#1e293b" } },
    { name: "Slate Clean",      ...BASE, radii: { xs:"2px", sm:"4px", md:"8px", lg:"12px", xl:"16px" }, shadows: { sm:"0 1px 2px rgba(0,0,0,.08)", md:"0 4px 12px rgba(0,0,0,.08)", lg:"0 8px 32px rgba(0,0,0,.08)" }, colors: { primary:"#475569", secondary:"#334155", background:"#f8fafc", surface:"#ffffff", text:"#1e293b", textMuted:"#94a3b8", accent:"#64748b", border:"#cbd5e1" } },
  ],
  friendly: [
    { name: "Warm Coral",   ...BASE, radii: { xs:"4px", sm:"8px", md:"12px", lg:"16px", xl:"24px" }, shadows: { sm:"0 1px 2px rgba(0,0,0,.08)", md:"0 4px 12px rgba(0,0,0,.08)", lg:"0 8px 32px rgba(0,0,0,.08)" }, colors: { primary:"#f97316", secondary:"#ea580c", background:"#fffbf5", surface:"#ffffff", text:"#1c1917", textMuted:"#78716c", accent:"#fb923c", border:"#fed7aa" } },
    { name: "Ocean Breeze", ...BASE, radii: { xs:"4px", sm:"8px", md:"12px", lg:"16px", xl:"24px" }, shadows: { sm:"0 1px 2px rgba(0,0,0,.08)", md:"0 4px 12px rgba(0,0,0,.08)", lg:"0 8px 32px rgba(0,0,0,.08)" }, colors: { primary:"#0891b2", secondary:"#0e7490", background:"#f0f9ff", surface:"#ffffff", text:"#0c4a6e", textMuted:"#64748b", accent:"#22d3ee", border:"#bae6fd" } },
    { name: "Sage Garden",  ...BASE, radii: { xs:"4px", sm:"8px", md:"12px", lg:"16px", xl:"24px" }, shadows: { sm:"0 1px 2px rgba(0,0,0,.08)", md:"0 4px 12px rgba(0,0,0,.08)", lg:"0 8px 32px rgba(0,0,0,.08)" }, colors: { primary:"#16a34a", secondary:"#15803d", background:"#f0fdf4", surface:"#ffffff", text:"#14532d", textMuted:"#6b7280", accent:"#4ade80", border:"#bbf7d0" } },
  ],
  playful: [
    { name: "Candy Pop",    ...BASE, radii: { xs:"8px",  sm:"12px", md:"16px", lg:"24px", xl:"9999px" }, shadows: { sm:"0 1px 2px rgba(0,0,0,.08)", md:"0 4px 12px rgba(0,0,0,.08)", lg:"0 8px 32px rgba(0,0,0,.08)" }, colors: { primary:"#ec4899", secondary:"#db2777", background:"#fdf2f8", surface:"#ffffff", text:"#500724", textMuted:"#9d174d", accent:"#f472b6", border:"#fbcfe8" } },
    { name: "Retro Wave",   ...BASE, radii: { xs:"4px",  sm:"8px",  md:"12px", lg:"20px", xl:"9999px" }, shadows: { sm:"0 1px 2px rgba(0,0,0,.4)",  md:"0 4px 12px rgba(0,0,0,.4)",  lg:"0 8px 32px rgba(0,0,0,.4)"  }, colors: { primary:"#7c3aed", secondary:"#f59e0b", background:"#1a0533", surface:"#2d0a52", text:"#f5d0fe", textMuted:"#c084fc", accent:"#fbbf24", border:"#4c0f87" } },
    { name: "Electric Lime", ...BASE, radii: { xs:"8px", sm:"12px", md:"16px", lg:"24px", xl:"9999px" }, shadows: { sm:"0 1px 2px rgba(0,0,0,.08)", md:"0 4px 12px rgba(0,0,0,.08)", lg:"0 8px 32px rgba(0,0,0,.08)" }, colors: { primary:"#84cc16", secondary:"#65a30d", background:"#f7fee7", surface:"#ffffff", text:"#1a2e05", textMuted:"#4d7c0f", accent:"#a3e635", border:"#d9f99d" } },
  ],
  minimal: [
    { name: "Pure White",  ...BASE, radii: { xs:"1px", sm:"2px", md:"4px", lg:"6px", xl:"8px" }, shadows: { sm:"0 1px 2px rgba(0,0,0,.08)", md:"0 4px 12px rgba(0,0,0,.08)", lg:"0 8px 32px rgba(0,0,0,.08)" }, colors: { primary:"#18181b", secondary:"#3f3f46", background:"#ffffff", surface:"#fafafa", text:"#18181b", textMuted:"#71717a", accent:"#52525b", border:"#e4e4e7" } },
    { name: "Ink & Paper", ...BASE, radii: { xs:"0px", sm:"1px", md:"2px", lg:"4px", xl:"6px" }, shadows: { sm:"0 1px 2px rgba(0,0,0,.08)", md:"0 4px 12px rgba(0,0,0,.08)", lg:"0 8px 32px rgba(0,0,0,.08)" }, colors: { primary:"#000000", secondary:"#1c1c1c", background:"#f5f0e8", surface:"#ede8de", text:"#1c1c1c", textMuted:"#6b6b6b", accent:"#000000", border:"#d4cfc5" } },
    { name: "Void Dark",   ...BASE, radii: { xs:"0px", sm:"2px", md:"4px", lg:"6px", xl:"8px" }, shadows: { sm:"0 1px 2px rgba(0,0,0,.4)",  md:"0 4px 12px rgba(0,0,0,.4)",  lg:"0 8px 32px rgba(0,0,0,.4)"  }, colors: { primary:"#e4e4e7", secondary:"#a1a1aa", background:"#030303", surface:"#0a0a0a", text:"#fafafa", textMuted:"#71717a", accent:"#e4e4e7", border:"#1c1c1c" } },
  ],
};

function getFallbackPresets(tone: Tone): ThemeTokens[] {
  return FALLBACK_PRESETS[tone] ?? FALLBACK_PRESETS.minimal;
}

const SYSTEM_PROMPT = `You are a world-class visual designer specialising in design systems.
Generate exactly 3 distinct theme variants for the given product tone as a JSON array.
Each element must match this shape exactly:
{
  "name": string,
  "colors": { "primary": "#rrggbb", "secondary": "#rrggbb", "background": "#rrggbb", "surface": "#rrggbb", "text": "#rrggbb", "textMuted": "#rrggbb", "accent": "#rrggbb", "border": "#rrggbb" },
  "typography": { "xs": "11px", "sm": "13px", "md": "15px", "lg": "18px", "xl": "24px" },
  "spacing":    { "xs": "4px",  "sm": "8px",  "md": "16px", "lg": "24px", "xl": "40px" },
  "radii":      { "xs": "Npx",  "sm": "Npx",  "md": "Npx",  "lg": "Npx",  "xl": "Npx"  },
  "shadows":    { "sm": "...", "md": "...", "lg": "..." },
  "motion":     { "fast": "100ms ease", "normal": "200ms ease", "slow": "350ms ease-in-out" }
}
All color values must be valid CSS hex. Output ONLY the JSON array — no explanation, no markdown fences.`;

export async function POST(request: NextRequest) {
  // Top-level guard — this route must ALWAYS return 200
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (!isThemeRequest(body)) {
      return NextResponse.json({ error: "Invalid request — tone required" }, { status: 400 });
    }

    const { tone, productName, brief } = body;
    const fallback = getFallbackPresets(tone);
    const providerConfig = extractProviderConfig(body as unknown as Record<string, unknown>);

    // Try to get a better result from an LLM
    let llmPresets: ThemeTokens[] | null = null;
    try {
      const userPrompt = `Product: ${productName ?? "unnamed"}
Brief: ${brief ?? "none"}
Tone: ${tone}

Generate 3 theme variants JSON array now.`;

      const text = await callLLMWithConfig(
        [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user",   content: userPrompt },
        ],
        { maxTokens: 2048 },
        providerConfig
      );

      if (text) {
        const parsed: unknown = JSON.parse(stripFences(text));
        if (Array.isArray(parsed) && parsed.length >= 3 && parsed.every(isThemeTokens)) {
          llmPresets = parsed.slice(0, 3) as ThemeTokens[];
        } else {
          console.warn("[theme] LLM output failed schema check");
        }
      }
    } catch (llmErr) {
      console.warn("[theme] LLM call failed, using built-in presets:", llmErr);
    }

    // Try importing theme-engine presets as an upgrade over hardcoded fallback
    let enginePresets: ThemeTokens[] | null = null;
    try {
      const { generateThemeVariants } = await import("@product-studio/theme-engine");
      enginePresets = generateThemeVariants(tone);
    } catch (importErr) {
      console.warn("[theme] theme-engine import failed, using inline presets:", importErr);
    }

    return NextResponse.json(llmPresets ?? enginePresets ?? fallback);
  } catch (fatal) {
    console.error("[theme] Fatal route error:", fatal);
    // Last-resort: return hardcoded bold presets so the UI never breaks
    return NextResponse.json(FALLBACK_PRESETS.bold);
  }
}
