import type { ThemeTokens, Tone } from "@product-studio/shared-types";

export { packageName } from "./meta";

/* ─── Palette presets keyed by tone ─────────────────────────────────── */

interface PalettePreset {
  name: string;
  colors: ThemeTokens["colors"];
  radii: ThemeTokens["radii"];
}

const PRESETS: Record<Tone, PalettePreset[]> = {
  bold: [
    {
      name: "Dark Bold",
      colors: { primary: "#7c3aed", secondary: "#4f46e5", background: "#09090b", surface: "#18181b", text: "#fafafa", textMuted: "#a1a1aa", accent: "#a78bfa", border: "#27272a" },
      radii: { xs: "2px", sm: "4px", md: "8px", lg: "12px", xl: "16px" },
    },
    {
      name: "Electric Night",
      colors: { primary: "#6366f1", secondary: "#8b5cf6", background: "#0f0f23", surface: "#1e1e3f", text: "#e8e8ff", textMuted: "#8888cc", accent: "#a5b4fc", border: "#2e2e5a" },
      radii: { xs: "2px", sm: "4px", md: "6px", lg: "10px", xl: "14px" },
    },
    {
      name: "High Contrast",
      colors: { primary: "#ffffff", secondary: "#e4e4e7", background: "#000000", surface: "#111111", text: "#ffffff", textMuted: "#a1a1aa", accent: "#7c3aed", border: "#333333" },
      radii: { xs: "0px", sm: "2px", md: "4px", lg: "6px", xl: "8px" },
    },
  ],
  professional: [
    {
      name: "Enterprise Light",
      colors: { primary: "#1d4ed8", secondary: "#1e40af", background: "#ffffff", surface: "#f8fafc", text: "#0f172a", textMuted: "#64748b", accent: "#3b82f6", border: "#e2e8f0" },
      radii: { xs: "2px", sm: "4px", md: "6px", lg: "8px", xl: "12px" },
    },
    {
      name: "Executive Dark",
      colors: { primary: "#2563eb", secondary: "#1d4ed8", background: "#0c1220", surface: "#111827", text: "#f1f5f9", textMuted: "#94a3b8", accent: "#60a5fa", border: "#1e293b" },
      radii: { xs: "2px", sm: "4px", md: "6px", lg: "8px", xl: "12px" },
    },
    {
      name: "Slate Clean",
      colors: { primary: "#475569", secondary: "#334155", background: "#f8fafc", surface: "#ffffff", text: "#1e293b", textMuted: "#94a3b8", accent: "#64748b", border: "#cbd5e1" },
      radii: { xs: "2px", sm: "4px", md: "8px", lg: "12px", xl: "16px" },
    },
  ],
  friendly: [
    {
      name: "Warm Coral",
      colors: { primary: "#f97316", secondary: "#ea580c", background: "#fffbf5", surface: "#ffffff", text: "#1c1917", textMuted: "#78716c", accent: "#fb923c", border: "#fed7aa" },
      radii: { xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "24px" },
    },
    {
      name: "Ocean Breeze",
      colors: { primary: "#0891b2", secondary: "#0e7490", background: "#f0f9ff", surface: "#ffffff", text: "#0c4a6e", textMuted: "#64748b", accent: "#22d3ee", border: "#bae6fd" },
      radii: { xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "24px" },
    },
    {
      name: "Sage Garden",
      colors: { primary: "#16a34a", secondary: "#15803d", background: "#f0fdf4", surface: "#ffffff", text: "#14532d", textMuted: "#6b7280", accent: "#4ade80", border: "#bbf7d0" },
      radii: { xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "24px" },
    },
  ],
  playful: [
    {
      name: "Candy Pop",
      colors: { primary: "#ec4899", secondary: "#db2777", background: "#fdf2f8", surface: "#ffffff", text: "#500724", textMuted: "#9d174d", accent: "#f472b6", border: "#fbcfe8" },
      radii: { xs: "8px", sm: "12px", md: "16px", lg: "24px", xl: "9999px" },
    },
    {
      name: "Retro Wave",
      colors: { primary: "#7c3aed", secondary: "#f59e0b", background: "#1a0533", surface: "#2d0a52", text: "#f5d0fe", textMuted: "#c084fc", accent: "#fbbf24", border: "#4c0f87" },
      radii: { xs: "4px", sm: "8px", md: "12px", lg: "20px", xl: "9999px" },
    },
    {
      name: "Electric Lime",
      colors: { primary: "#84cc16", secondary: "#65a30d", background: "#f7fee7", surface: "#ffffff", text: "#1a2e05", textMuted: "#4d7c0f", accent: "#a3e635", border: "#d9f99d" },
      radii: { xs: "8px", sm: "12px", md: "16px", lg: "24px", xl: "9999px" },
    },
  ],
  minimal: [
    {
      name: "Pure White",
      colors: { primary: "#18181b", secondary: "#3f3f46", background: "#ffffff", surface: "#fafafa", text: "#18181b", textMuted: "#71717a", accent: "#52525b", border: "#e4e4e7" },
      radii: { xs: "1px", sm: "2px", md: "4px", lg: "6px", xl: "8px" },
    },
    {
      name: "Ink & Paper",
      colors: { primary: "#000000", secondary: "#1c1c1c", background: "#f5f0e8", surface: "#ede8de", text: "#1c1c1c", textMuted: "#6b6b6b", accent: "#000000", border: "#d4cfc5" },
      radii: { xs: "0px", sm: "1px", md: "2px", lg: "4px", xl: "6px" },
    },
    {
      name: "Void Dark",
      colors: { primary: "#e4e4e7", secondary: "#a1a1aa", background: "#030303", surface: "#0a0a0a", text: "#fafafa", textMuted: "#71717a", accent: "#e4e4e7", border: "#1c1c1c" },
      radii: { xs: "0px", sm: "2px", md: "4px", lg: "6px", xl: "8px" },
    },
  ],
};

const BASE_TYPOGRAPHY: ThemeTokens["typography"] = { xs: "11px", sm: "13px", md: "15px", lg: "18px", xl: "24px" };
const BASE_SPACING:    ThemeTokens["spacing"]    = { xs: "4px",  sm: "8px",  md: "16px", lg: "24px", xl: "40px" };
const BASE_MOTION:     ThemeTokens["motion"]     = { fast: "100ms ease", normal: "200ms ease", slow: "350ms ease-in-out" };

function buildShadows(bg: string): ThemeTokens["shadows"] {
  const isDark = bg <= "#888888";
  const alpha  = isDark ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.08)";
  return { sm: `0 1px 2px ${alpha}`, md: `0 4px 12px ${alpha}`, lg: `0 8px 32px ${alpha}` };
}

/**
 * Generate 3 theme token variants for a given tone.
 * Pure function — no network calls, no side effects.
 */
export function generateThemeVariants(tone: Tone): ThemeTokens[] {
  const presets = PRESETS[tone] ?? PRESETS.minimal;
  return presets.map((preset) => ({
    name:       preset.name,
    colors:     preset.colors,
    typography: BASE_TYPOGRAPHY,
    spacing:    BASE_SPACING,
    radii:      preset.radii,
    shadows:    buildShadows(preset.colors.background),
    motion:     BASE_MOTION,
  }));
}

/**
 * Serialise a ThemeTokens set to a CSS custom-properties block.
 */
export function tokensToCssVars(tokens: ThemeTokens, scope = ":root"): string {
  const lines: string[] = [`${scope} {`];
  for (const [k, v] of Object.entries(tokens.colors))     lines.push(`  --color-${k}: ${v};`);
  for (const [k, v] of Object.entries(tokens.typography)) lines.push(`  --font-size-${k}: ${v};`);
  for (const [k, v] of Object.entries(tokens.spacing))    lines.push(`  --space-${k}: ${v};`);
  for (const [k, v] of Object.entries(tokens.radii))      lines.push(`  --radius-${k}: ${v};`);
  for (const [k, v] of Object.entries(tokens.shadows))    lines.push(`  --shadow-${k}: ${v};`);
  lines.push(`  --motion-fast:   ${tokens.motion.fast};`);
  lines.push(`  --motion-normal: ${tokens.motion.normal};`);
  lines.push(`  --motion-slow:   ${tokens.motion.slow};`);
  lines.push(`}`);
  return lines.join("\n");
}
