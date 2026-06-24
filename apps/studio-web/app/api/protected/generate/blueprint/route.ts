import { NextRequest, NextResponse } from "next/server";
import { isBrief, isPageBlueprint, type Brief, type PageBlueprint } from "@product-studio/shared-types";
import { callLLMWithConfig, stripFences } from "@/lib/llm";
import { extractProviderConfig } from "@/lib/providers";

const SYSTEM_PROMPT = `You are a senior UX strategist and information architect.
Given a product brief, produce a structured landing page blueprint as valid JSON.
The JSON must match this TypeScript interface exactly:

interface PageSection {
  id: string;           // kebab-case unique identifier
  type: "hero" | "problem" | "solution" | "features" | "social-proof" | "faq" | "cta";
  intent: string;       // 1–2 sentences describing messaging intent
  requiredComponents: string[];  // 3–6 specific UI components needed
}

interface PageBlueprint {
  title: string;     // page title
  summary: string;   // 1–2 sentences summarising the messaging architecture
  sections: PageSection[];  // ordered array of 5–7 sections
}

Output ONLY the JSON object. No explanation, no markdown fences, no commentary.`;

function buildMockBlueprint(brief: Brief): PageBlueprint {
  return {
    title: `${brief.productName} — Page Blueprint`,
    summary: `Message architecture focused on ${brief.audience}, driving towards "${brief.ctaGoal}".`,
    sections: [
      { id: "hero",         type: "hero",         intent: `Lead with: "${brief.valueProposition}"`,                          requiredComponents: ["headline", "subheadline", "primary-cta", "hero-visual"] },
      { id: "problem",      type: "problem",      intent: "Validate the audience's pain before the solution lands",           requiredComponents: ["pain-points-grid", "empathy-statement", "transition-hook"] },
      { id: "solution",     type: "solution",     intent: `Position ${brief.productName} as the precise answer`,             requiredComponents: ["solution-headline", "benefit-pillars", "product-screenshot"] },
      { id: "features",     type: "features",     intent: "Build credibility through concrete product capabilities",          requiredComponents: ["feature-grid", "feature-icons", "proof-metrics"] },
      { id: "social-proof", type: "social-proof", intent: "Reduce perceived risk with real customer outcomes",               requiredComponents: ["testimonial-carousel", "company-logo-strip", "outcome-stats"] },
      { id: "cta",          type: "cta",          intent: `Drive conversion: "${brief.ctaGoal}"`,                            requiredComponents: ["cta-headline", "primary-cta-button", "risk-reversal-copy"] },
    ],
  };
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Extract provider config before brief validation (extra fields are ignored by isBrief)
  const providerConfig = extractProviderConfig(body as Record<string, unknown>);

  if (!isBrief(body)) {
    return NextResponse.json({ error: "Invalid brief payload" }, { status: 400 });
  }

  const brief = body;

  const userPrompt = `Product brief:
- Product name: ${brief.productName}
- Target audience: ${brief.audience}
- Value proposition: ${brief.valueProposition}
- Tone: ${brief.tone}
- CTA goal: ${brief.ctaGoal}
- Constraints: ${brief.constraints.join(", ")}

Generate the page blueprint JSON now.`;

  try {
    const text = await callLLMWithConfig(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: userPrompt },
      ],
      { maxTokens: 1024 },
      providerConfig
    );

    if (text) {
      try {
        const parsed: unknown = JSON.parse(stripFences(text));
        if (isPageBlueprint(parsed)) return NextResponse.json(parsed);
        console.warn("[blueprint] LLM output failed schema check — using mock");
      } catch {
        console.warn("[blueprint] LLM output was not valid JSON — using mock");
      }
    }

    return NextResponse.json(buildMockBlueprint(brief));
  } catch (err) {
    console.error("[blueprint] Unexpected error:", err);
    return NextResponse.json(buildMockBlueprint(brief));
  }
}
