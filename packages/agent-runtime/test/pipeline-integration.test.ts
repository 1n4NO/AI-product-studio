import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Brief, PageBlueprint } from "@product-studio/shared-types";
import { createUxAuditAdapter } from "../../../packages/ux-audit/src/index";

function buildBlueprint(brief: Brief): PageBlueprint {
  return {
    title: `${brief.productName} Blueprint`,
    summary: `Structured page for ${brief.audience}`,
    sections: [
      { id: "hero", type: "hero", intent: brief.valueProposition, requiredComponents: ["headline", "cta"] },
      { id: "features", type: "features", intent: "Core capabilities", requiredComponents: ["feature-grid"] },
      { id: "cta", type: "cta", intent: brief.ctaGoal, requiredComponents: ["button"] }
    ]
  };
}

function renderHtml(brief: Brief, blueprint: PageBlueprint): string {
  return `
  <html lang="en">
    <head>
      <title>${brief.productName}</title>
      <meta name="description" content="${brief.valueProposition}" />
      <link rel="stylesheet" href="/styles.css" />
    </head>
    <body>
      <main>
        <h1>${brief.productName}</h1>
        <p>${brief.valueProposition}</p>
        <h2>${blueprint.sections[1]?.intent ?? "Features"}</h2>
        <img src="/feature.png" alt="Feature preview" width="640" height="360" loading="lazy" />
        <button>${brief.ctaGoal}</button>
      </main>
    </body>
  </html>
  `;
}

test("integration: brief -> blueprint -> audit matches golden expectations", async () => {
  const root = path.resolve(process.cwd(), "../..");
  const briefPath = path.join(root, "tests/integration/fixtures/brief.json");
  const goldenPath = path.join(root, "tests/integration/golden/audit-expectation.json");

  const brief = JSON.parse(await readFile(briefPath, "utf8")) as Brief;
  const golden = JSON.parse(await readFile(goldenPath, "utf8")) as {
    score: number;
    categoryScores: { accessibility: number; readability: number; performance: number };
  };

  const blueprint = buildBlueprint(brief);
  const html = renderHtml(brief, blueprint);

  const adapter = createUxAuditAdapter();
  const report = await adapter.runAudit({
    html,
    urlOrSnapshotId: "integration-fixture"
  });

  assert.equal(report.score, golden.score);
  assert.deepEqual(report.categoryScores, golden.categoryScores);
});

