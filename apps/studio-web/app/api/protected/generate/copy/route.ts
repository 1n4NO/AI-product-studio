import { NextRequest, NextResponse } from "next/server";
import { isBrief, isPageBlueprint } from "@product-studio/shared-types";
import type { Brief, PageBlueprint } from "@product-studio/shared-types";
import { callLLMWithConfig, stripFences } from "@/lib/llm";
import { extractProviderConfig } from "@/lib/providers";

export interface SectionCopy {
  sectionId: string;
  headline: string;
  subheadline: string;
  body: string;
  cta: string | null;
}

export interface PageCopy {
  productName: string;
  sections: SectionCopy[];
}

interface CopyRequest {
  brief: Brief;
  blueprint: PageBlueprint;
}

function isCopyRequest(v: unknown): v is CopyRequest {
  return (
    typeof v === "object" &&
    v !== null &&
    isBrief((v as Record<string, unknown>).brief) &&
    isPageBlueprint((v as Record<string, unknown>).blueprint)
  );
}

function isPageCopy(v: unknown): v is PageCopy {
  if (typeof v !== "object" || v === null) return false;
  const obj = v as Record<string, unknown>;
  return (
    typeof obj.productName === "string" &&
    Array.isArray(obj.sections) &&
    obj.sections.every(
      (s: unknown) =>
        typeof s === "object" &&
        s !== null &&
        typeof (s as Record<string, unknown>).sectionId === "string" &&
        typeof (s as Record<string, unknown>).headline === "string"
    )
  );
}

/* ─── Mock copy generator ──────────────────────────────────────────── */

const TONE_VOICE: Record<string, string> = {
  bold:         "punchy, confident, direct — short sentences, strong verbs",
  professional: "clear, authoritative, precise — no fluff",
  friendly:     "warm, conversational, encouraging — like a helpful colleague",
  playful:      "energetic, fun, witty — light puns welcome",
  minimal:      "spare, quiet, intentional — every word earns its place",
};

function buildMockCopy(brief: Brief, blueprint: PageBlueprint): PageCopy {
  const sections: SectionCopy[] = blueprint.sections.map((s) => {
    switch (s.type) {
      case "hero":
        return {
          sectionId: s.id,
          headline: `${brief.productName}: ${brief.valueProposition.split(".")[0]}`,
          subheadline: `Built for ${brief.audience} who need results without the friction.`,
          body: `Stop cobbling together tools. ${brief.productName} gives you everything you need to go from idea to launch — with built-in quality you can trust.`,
          cta: brief.ctaGoal,
        };
      case "problem":
        return {
          sectionId: s.id,
          headline: "You're wasting time on the wrong things.",
          subheadline: `${brief.audience} spend hours on work that shouldn't take minutes.`,
          body: "Manual processes, inconsistent outputs, and endless back-and-forth kill momentum before you ever ship. There has to be a better way.",
          cta: null,
        };
      case "solution":
        return {
          sectionId: s.id,
          headline: `Meet ${brief.productName}.`,
          subheadline: "The fastest path from brief to launch-ready.",
          body: `${brief.productName} turns your product brief into a structured blueprint, runs a UX audit automatically, and gives you export-ready assets — all in one flow.`,
          cta: null,
        };
      case "features":
        return {
          sectionId: s.id,
          headline: "Everything you need. Nothing you don't.",
          subheadline: "Designed for speed without cutting corners on quality.",
          body: "AI-generated blueprints adapt to your tone. Built-in UX audits catch issues before users do. Design tokens export instantly to your stack.",
          cta: null,
        };
      case "social-proof":
        return {
          sectionId: s.id,
          headline: "Trusted by teams shipping faster.",
          subheadline: "Real outcomes from real product teams.",
          body: `"${brief.productName} cut our landing page process from two weeks to two hours. The audit alone caught three accessibility issues we'd have missed." — Design Lead, Series B startup`,
          cta: null,
        };
      case "faq":
        return {
          sectionId: s.id,
          headline: "Questions, answered.",
          subheadline: "Everything you need to get started.",
          body: "Still not sure? We're here to help — reach out anytime.",
          cta: null,
        };
      case "cta":
        return {
          sectionId: s.id,
          headline: `Ready to ship better, faster?`,
          subheadline: `Join ${brief.audience} already using ${brief.productName}.`,
          body: "No credit card required. Cancel anytime. Your first run is on us.",
          cta: brief.ctaGoal,
        };
      default:
        return {
          sectionId: s.id,
          headline: s.intent.split(":")[0] ?? "Section",
          subheadline: "",
          body: s.intent,
          cta: null,
        };
    }
  });

  return { productName: brief.productName, sections };
}

const SYSTEM_PROMPT = `You are a world-class conversion copywriter.
Given a product brief and page blueprint, generate landing page copy for each section.
Return a JSON object matching this exact shape:

{
  "productName": string,
  "sections": [
    {
      "sectionId": string,      // must match the section id from blueprint
      "headline": string,       // max 10 words, punchy
      "subheadline": string,    // max 20 words, expands headline
      "body": string,           // 2-4 sentences of body copy
      "cta": string | null      // CTA label if this section has one, else null
    }
  ]
}

Match the tone specified in the brief. Output ONLY valid JSON — no markdown, no explanation.`;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isCopyRequest(body)) {
    return NextResponse.json({ error: "Invalid request — brief and blueprint required" }, { status: 400 });
  }

  const { brief, blueprint } = body;
  const providerConfig = extractProviderConfig(body as unknown as Record<string, unknown>);
  const mockCopy = buildMockCopy(brief, blueprint);

  try {
    const userPrompt = `Brief:
- Product: ${brief.productName}
- Audience: ${brief.audience}
- Value proposition: ${brief.valueProposition}
- Tone: ${brief.tone} (${TONE_VOICE[brief.tone] ?? brief.tone})
- CTA goal: ${brief.ctaGoal}
- Constraints: ${brief.constraints.join(", ")}

Blueprint sections:
${blueprint.sections.map((s) => `- ${s.id} (${s.type}): ${s.intent}`).join("\n")}

Generate the copy JSON now.`;

    const text = await callLLMWithConfig(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: userPrompt },
      ],
      { maxTokens: 2048 },
      providerConfig
    );

    if (text) {
      try {
        const parsed: unknown = JSON.parse(stripFences(text));
        if (isPageCopy(parsed)) return NextResponse.json(parsed);
        console.warn("[copy] LLM output failed schema check — using mock");
      } catch {
        console.warn("[copy] LLM output was not valid JSON — using mock");
      }
    }

    return NextResponse.json(mockCopy);
  } catch (err) {
    console.error("[copy] Unexpected error:", err);
    return NextResponse.json(mockCopy);
  }
}
