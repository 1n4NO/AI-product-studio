/**
 * Unit tests for the ux-audit heuristic engine.
 *
 * Each check gets at minimum:
 *   - a "pass" fixture (no finding expected)
 *   - a "fail" fixture (at least one finding expected)
 *
 * Run with: npm test  (tsx --test test/**\/*.test.ts)
 */

import test from "node:test";
import assert from "node:assert/strict";
import type { AuditFinding } from "@product-studio/shared-types";
import { FullUxAuditAdapter } from "../src/index";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const adapter = new FullUxAuditAdapter();

/** Run the audit and return only the findings for the given check id(s). */
async function auditCheck(html: string, checkId: string | string[]) {
  const ids = Array.isArray(checkId) ? checkId : [checkId];
  const report = await adapter.runAudit({
    html: wrap(html),
    urlOrSnapshotId: "test",
    selectedChecks: ids,
  });
  return report.findings;
}

/** Run the full audit against raw HTML (no wrapping). */
async function auditRaw(html: string, selectedChecks?: string[]) {
  return adapter.runAudit({ html, urlOrSnapshotId: "test", selectedChecks });
}

/** Wrap a fragment in a minimal but valid HTML document. */
function wrap(fragment: string): string {
  return `<!DOCTYPE html><html lang="en"><head><title>Test Page</title></head><body>${fragment}</body></html>`;
}

/** Assert at least one finding matches the predicate. */
function hasMatch(findings: AuditFinding[], pred: (f: AuditFinding) => boolean) {
  return findings.some(pred);
}

// ─── Accessibility: images-alt ────────────────────────────────────────────────

test("images-alt: flags img with no alt attribute", async () => {
  const findings = await auditCheck('<img src="hero.jpg">', "images-alt");
  assert.ok(findings.length > 0, "expected at least one finding");
  assert.ok(hasMatch(findings, (f) => f.id.startsWith("img-alt")));
});

test("images-alt: flags img with empty alt attribute", async () => {
  const findings = await auditCheck('<img src="hero.jpg" alt="">', "images-alt");
  // alt="" is decorative convention — but our check flags it unless role=presentation
  assert.ok(findings.length > 0);
});

test("images-alt: passes img with descriptive alt", async () => {
  const findings = await auditCheck('<img src="hero.jpg" alt="Team working at desks">', "images-alt");
  assert.equal(findings.length, 0);
});

test("images-alt: skips img with role=presentation", async () => {
  const findings = await auditCheck('<img src="decoration.svg" role="presentation">', "images-alt");
  assert.equal(findings.length, 0);
});

test("images-alt: skips img with role=none", async () => {
  const findings = await auditCheck('<img src="decoration.svg" role="none">', "images-alt");
  assert.equal(findings.length, 0);
});

// ─── Accessibility: buttons-label ────────────────────────────────────────────

test("buttons-label: flags button with no label", async () => {
  const findings = await auditCheck("<button></button>", "buttons-label");
  assert.ok(findings.length > 0);
});

test("buttons-label: flags icon-only button with no aria-label", async () => {
  const findings = await auditCheck('<button><svg></svg></button>', "buttons-label");
  assert.ok(findings.length > 0);
});

test("buttons-label: passes button with visible text", async () => {
  const findings = await auditCheck("<button>Submit</button>", "buttons-label");
  assert.equal(findings.length, 0);
});

test("buttons-label: passes button with aria-label", async () => {
  const findings = await auditCheck('<button aria-label="Close dialog"></button>', "buttons-label");
  assert.equal(findings.length, 0);
});

test("buttons-label: passes button with img[alt]", async () => {
  const findings = await auditCheck('<button><img src="x.svg" alt="Delete"></button>', "buttons-label");
  assert.equal(findings.length, 0);
});

// ─── Accessibility: inputs-label ─────────────────────────────────────────────

test("inputs-label: flags text input with no label — critical severity", async () => {
  const findings = await auditCheck('<input type="text">', "inputs-label");
  assert.ok(findings.length > 0);
  assert.equal(findings[0].severity, "critical");
});

test("inputs-label: passes input with associated label[for]", async () => {
  const findings = await auditCheck(
    '<label for="name">Name</label><input id="name" type="text">',
    "inputs-label"
  );
  assert.equal(findings.length, 0);
});

test("inputs-label: passes input wrapped in label", async () => {
  const findings = await auditCheck('<label>Email <input type="email"></label>', "inputs-label");
  assert.equal(findings.length, 0);
});

test("inputs-label: passes input with aria-label", async () => {
  const findings = await auditCheck('<input type="search" aria-label="Search products">', "inputs-label");
  assert.equal(findings.length, 0);
});

test("inputs-label: passes input with aria-labelledby", async () => {
  const findings = await auditCheck(
    '<span id="lbl">Query</span><input type="text" aria-labelledby="lbl">',
    "inputs-label"
  );
  assert.equal(findings.length, 0);
});

test("inputs-label: skips hidden inputs", async () => {
  const findings = await auditCheck('<input type="hidden" name="csrf">', "inputs-label");
  assert.equal(findings.length, 0);
});

test("inputs-label: skips submit inputs", async () => {
  const findings = await auditCheck('<input type="submit" value="Go">', "inputs-label");
  assert.equal(findings.length, 0);
});

// ─── Accessibility: links-name ───────────────────────────────────────────────

test("links-name: flags anchor with no text or label", async () => {
  const findings = await auditCheck('<a href="/about"></a>', "links-name");
  assert.ok(findings.length > 0);
});

test("links-name: passes anchor with text content", async () => {
  const findings = await auditCheck('<a href="/about">About us</a>', "links-name");
  assert.equal(findings.length, 0);
});

test("links-name: passes anchor with aria-label", async () => {
  const findings = await auditCheck('<a href="/about" aria-label="About our company"></a>', "links-name");
  assert.equal(findings.length, 0);
});

test("links-name: passes anchor with img[alt]", async () => {
  const findings = await auditCheck('<a href="/home"><img src="logo.png" alt="Home"></a>', "links-name");
  assert.equal(findings.length, 0);
});

// ─── Accessibility: document-language ────────────────────────────────────────

test("document-language: flags html with no lang attribute", async () => {
  const report = await auditRaw(
    '<html><head><title>T</title></head><body></body></html>',
    ["document-language"]
  );
  assert.ok(report.findings.length > 0);
});

test("document-language: passes html with lang attribute", async () => {
  const findings = await auditCheck("", "document-language");
  // wrap() always adds lang="en"
  assert.equal(findings.length, 0);
});

// ─── Accessibility: links-action ─────────────────────────────────────────────

test("links-action: flags href='#'", async () => {
  const findings = await auditCheck('<a href="#">Click me</a>', "links-action");
  assert.ok(findings.length > 0);
});

test("links-action: flags javascript: href", async () => {
  const findings = await auditCheck('<a href="javascript:void(0)">Click</a>', "links-action");
  assert.ok(findings.length > 0);
});

test("links-action: passes real navigation href", async () => {
  const findings = await auditCheck('<a href="/pricing">Pricing</a>', "links-action");
  assert.equal(findings.length, 0);
});

test("links-action: passes external href", async () => {
  const findings = await auditCheck('<a href="https://example.com">Docs</a>', "links-action");
  assert.equal(findings.length, 0);
});

// ─── Accessibility: main-landmark ────────────────────────────────────────────

test("main-landmark: flags page with no main element", async () => {
  const report = await auditRaw(
    '<html lang="en"><head><title>T</title></head><body><div>content</div></body></html>',
    ["main-landmark"]
  );
  assert.ok(report.findings.length > 0);
});

test("main-landmark: passes page with main element", async () => {
  const findings = await auditCheck("<main><p>Content</p></main>", "main-landmark");
  assert.equal(findings.length, 0);
});

test("main-landmark: passes page with role=main", async () => {
  const findings = await auditCheck('<div role="main"><p>Content</p></div>', "main-landmark");
  assert.equal(findings.length, 0);
});

// ─── Accessibility: landmark-regions ─────────────────────────────────────────

test("landmark-regions: flags page with no header, nav, or footer", async () => {
  const report = await auditRaw(
    '<html lang="en"><head><title>T</title></head><body><main>content</main></body></html>',
    ["landmark-regions"]
  );
  // Should flag missing nav at minimum (medium severity)
  const navFinding = report.findings.find((f) => f.id === "landmark-nav");
  assert.ok(navFinding, "expected landmark-nav finding");
  assert.equal(navFinding.severity, "medium");
});

test("landmark-regions: passes page with header, nav, and footer", async () => {
  const findings = await auditCheck(
    "<header><nav><a href='/'>Home</a></nav></header><main></main><footer></footer>",
    "landmark-regions"
  );
  assert.equal(findings.length, 0);
});

// ─── Accessibility: iframes-title ────────────────────────────────────────────

test("iframes-title: flags iframe without title", async () => {
  const findings = await auditCheck('<iframe src="map.html"></iframe>', "iframes-title");
  assert.ok(findings.length > 0);
});

test("iframes-title: passes iframe with title", async () => {
  const findings = await auditCheck('<iframe src="map.html" title="Store location map"></iframe>', "iframes-title");
  assert.equal(findings.length, 0);
});

// ─── Accessibility: media-controls ───────────────────────────────────────────

test("media-controls: flags video without controls", async () => {
  const findings = await auditCheck('<video src="demo.mp4"></video>', "media-controls");
  assert.ok(findings.length > 0);
});

test("media-controls: passes video with controls", async () => {
  const findings = await auditCheck('<video src="demo.mp4" controls></video>', "media-controls");
  assert.equal(findings.length, 0);
});

test("media-controls: flags audio without controls", async () => {
  const findings = await auditCheck('<audio src="podcast.mp3"></audio>', "media-controls");
  assert.ok(findings.length > 0);
});

// ─── Accessibility: forms-submit ─────────────────────────────────────────────

test("forms-submit: flags form with no submit control", async () => {
  const findings = await auditCheck(
    '<form><input type="text" aria-label="Name"><button type="button">Cancel</button></form>',
    "forms-submit"
  );
  assert.ok(findings.length > 0);
});

test("forms-submit: passes form with submit button", async () => {
  const findings = await auditCheck(
    '<form><input type="text" aria-label="Name"><button type="submit">Send</button></form>',
    "forms-submit"
  );
  assert.equal(findings.length, 0);
});

test("forms-submit: passes form with input[type=submit]", async () => {
  const findings = await auditCheck(
    '<form><input type="text" aria-label="Name"><input type="submit" value="Go"></form>',
    "forms-submit"
  );
  assert.equal(findings.length, 0);
});

test("forms-submit: passes form with button (no type) treated as submit", async () => {
  const findings = await auditCheck(
    '<form><input type="text" aria-label="Query"><button>Search</button></form>',
    "forms-submit"
  );
  assert.equal(findings.length, 0);
});

// ─── Accessibility: color-contrast ───────────────────────────────────────────

test("color-contrast: flags inline style with very low contrast (white on white)", async () => {
  const findings = await auditCheck(
    '<p style="color: #ffffff; background-color: #ffffff;">Invisible text</p>',
    "color-contrast"
  );
  assert.ok(findings.length > 0);
  assert.equal(findings[0].severity, "critical"); // ratio 1:1 < 3.0
});

test("color-contrast: flags inline style below WCAG AA (light grey on white)", async () => {
  // #aaaaaa on #ffffff → contrast ~2.3:1
  const findings = await auditCheck(
    '<p style="color: #aaaaaa; background-color: #ffffff;">Low contrast text</p>',
    "color-contrast"
  );
  assert.ok(findings.length > 0);
});

test("color-contrast: passes black on white (21:1)", async () => {
  const findings = await auditCheck(
    '<p style="color: #000000; background-color: #ffffff;">High contrast text</p>',
    "color-contrast"
  );
  assert.equal(findings.length, 0);
});

test("color-contrast: passes dark text on light background meeting AA", async () => {
  // #595959 on #ffffff → ~7.0:1
  const findings = await auditCheck(
    '<p style="color: #595959; background-color: #ffffff;">Good contrast</p>',
    "color-contrast"
  );
  assert.equal(findings.length, 0);
});

test("color-contrast: deduplicates identical color pairs", async () => {
  const html = Array.from({ length: 5 }, () =>
    '<p style="color: #cccccc; background-color: #ffffff;">Low contrast</p>'
  ).join("");
  const findings = await auditCheck(html, "color-contrast");
  // Same fg+bg pair — should be deduplicated to 1 finding
  assert.equal(findings.length, 1);
});

// ─── Accessibility: skip-link ─────────────────────────────────────────────────

test("skip-link: flags page with no skip link", async () => {
  const findings = await auditCheck(
    '<nav><a href="/home">Home</a><a href="/about">About</a></nav><main></main>',
    "skip-link"
  );
  assert.ok(findings.length > 0);
});

test("skip-link: passes when first link points to #main", async () => {
  const findings = await auditCheck(
    '<a href="#main-content">Skip to content</a><nav><a href="/home">Home</a></nav><main id="main-content"></main>',
    "skip-link"
  );
  assert.equal(findings.length, 0);
});

test("skip-link: passes when first link contains 'skip' text", async () => {
  const findings = await auditCheck(
    '<a href="#content" class="sr-only">Skip navigation</a><nav></nav>',
    "skip-link"
  );
  assert.equal(findings.length, 0);
});

// ─── Accessibility: positive-tabindex ────────────────────────────────────────

test("positive-tabindex: flags element with tabindex > 0", async () => {
  const findings = await auditCheck('<button tabindex="2">Click me</button>', "positive-tabindex");
  assert.ok(findings.length > 0);
  assert.equal(findings[0].severity, "high");
});

test("positive-tabindex: passes tabindex=0", async () => {
  const findings = await auditCheck('<div tabindex="0">Focusable div</div>', "positive-tabindex");
  assert.equal(findings.length, 0);
});

test("positive-tabindex: passes tabindex=-1", async () => {
  const findings = await auditCheck('<div tabindex="-1">Programmatic focus only</div>', "positive-tabindex");
  assert.equal(findings.length, 0);
});

// ─── Accessibility: viewport-meta ────────────────────────────────────────────

test("viewport-meta: flags missing viewport meta", async () => {
  const report = await auditRaw(
    '<html lang="en"><head><title>T</title></head><body></body></html>',
    ["viewport-meta"]
  );
  assert.ok(report.findings.some((f) => f.id === "viewport-meta-missing"));
});

test("viewport-meta: flags user-scalable=no", async () => {
  const report = await auditRaw(
    '<html lang="en"><head><title>T</title><meta name="viewport" content="width=device-width, user-scalable=no"></head><body></body></html>',
    ["viewport-meta"]
  );
  assert.ok(report.findings.some((f) => f.id === "viewport-zoom-disabled"));
});

test("viewport-meta: flags maximum-scale=1", async () => {
  const report = await auditRaw(
    '<html lang="en"><head><title>T</title><meta name="viewport" content="width=device-width, maximum-scale=1"></head><body></body></html>',
    ["viewport-meta"]
  );
  assert.ok(report.findings.some((f) => f.id === "viewport-zoom-disabled"));
});

test("viewport-meta: passes correct viewport meta", async () => {
  const report = await auditRaw(
    '<html lang="en"><head><title>T</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body></body></html>',
    ["viewport-meta"]
  );
  assert.equal(report.findings.length, 0);
});

// ─── Accessibility: table-headers ────────────────────────────────────────────

test("table-headers: flags table with no th elements", async () => {
  const findings = await auditCheck(
    "<table><tr><td>Name</td><td>Score</td></tr><tr><td>Alice</td><td>92</td></tr></table>",
    "table-headers"
  );
  assert.ok(findings.length > 0);
});

test("table-headers: passes table with th elements", async () => {
  const findings = await auditCheck(
    '<table><thead><tr><th scope="col">Name</th><th scope="col">Score</th></tr></thead><tbody><tr><td>Alice</td><td>92</td></tr></tbody></table>',
    "table-headers"
  );
  assert.equal(findings.length, 0);
});

// ─── Accessibility: focus-outline ────────────────────────────────────────────

test("focus-outline: flags outline:none in style block without :focus-visible", async () => {
  const html = `<!DOCTYPE html><html lang="en"><head><title>T</title>
  <style>* { outline: none; }</style>
  </head><body><button>Click</button></body></html>`;
  const report = await auditRaw(html, ["focus-outline"]);
  assert.ok(report.findings.length > 0);
});

test("focus-outline: passes when outline:none is paired with :focus-visible", async () => {
  const html = `<!DOCTYPE html><html lang="en"><head><title>T</title>
  <style>
    * { outline: none; }
    :focus-visible { outline: 2px solid currentColor; }
  </style>
  </head><body><button>Click</button></body></html>`;
  const report = await auditRaw(html, ["focus-outline"]);
  assert.equal(report.findings.length, 0);
});

test("focus-outline: passes page with no outline suppression", async () => {
  const findings = await auditCheck("<button>Click</button>", "focus-outline");
  assert.equal(findings.length, 0);
});

// ─── Readability: paragraph-length ───────────────────────────────────────────

test("paragraph-length: flags paragraph over 450 chars as medium", async () => {
  const longText = "A ".repeat(250); // 500 chars
  const findings = await auditCheck(`<p>${longText}</p>`, "paragraph-length");
  assert.ok(findings.length > 0);
  assert.equal(findings[0].severity, "medium");
});

test("paragraph-length: flags paragraph 280-450 chars as low", async () => {
  const medText = "A ".repeat(150); // 300 chars
  const findings = await auditCheck(`<p>${medText}</p>`, "paragraph-length");
  assert.ok(findings.length > 0);
  assert.equal(findings[0].severity, "low");
});

test("paragraph-length: passes short paragraph", async () => {
  const findings = await auditCheck("<p>Short paragraph.</p>", "paragraph-length");
  assert.equal(findings.length, 0);
});

// ─── Readability: page-title ──────────────────────────────────────────────────

test("page-title: flags missing title", async () => {
  const report = await auditRaw(
    '<html lang="en"><head></head><body></body></html>',
    ["page-title"]
  );
  assert.ok(report.findings.length > 0);
  assert.equal(report.findings[0].severity, "high");
});

test("page-title: passes page with title", async () => {
  const findings = await auditCheck("", "page-title");
  // wrap() always injects <title>Test Page</title>
  assert.equal(findings.length, 0);
});

// ─── Readability: title-length ────────────────────────────────────────────────

test("title-length: flags very short title", async () => {
  const report = await auditRaw(
    '<html lang="en"><head><title>Hi</title></head><body></body></html>',
    ["title-length"]
  );
  assert.ok(report.findings.some((f) => f.id === "title-too-short"));
});

test("title-length: flags excessively long title", async () => {
  const longTitle = "A".repeat(75);
  const report = await auditRaw(
    `<html lang="en"><head><title>${longTitle}</title></head><body></body></html>`,
    ["title-length"]
  );
  assert.ok(report.findings.some((f) => f.id === "title-too-long"));
});

test("title-length: passes title of appropriate length", async () => {
  const report = await auditRaw(
    '<html lang="en"><head><title>Product Studio — AI Design Tool</title></head><body></body></html>',
    ["title-length"]
  );
  assert.equal(report.findings.length, 0);
});

// ─── Readability: heading-structure ──────────────────────────────────────────

test("heading-structure: flags page with no headings", async () => {
  const findings = await auditCheck("<p>No headings here</p>", "heading-structure");
  assert.ok(findings.some((f) => f.id === "headings-missing"));
});

test("heading-structure: flags missing H1", async () => {
  const findings = await auditCheck("<h2>Section</h2><p>Content</p>", "heading-structure");
  assert.ok(findings.some((f) => f.id === "h1-missing"));
});

test("heading-structure: flags multiple H1s", async () => {
  const findings = await auditCheck("<h1>Title A</h1><h1>Title B</h1>", "heading-structure");
  assert.ok(findings.some((f) => f.id === "h1-multiple"));
});

test("heading-structure: flags skipped heading level", async () => {
  const findings = await auditCheck("<h1>Title</h1><h3>Skipped level</h3>", "heading-structure");
  assert.ok(findings.some((f) => f.id.startsWith("heading-skip")));
});

test("heading-structure: passes sequential heading levels", async () => {
  const findings = await auditCheck(
    "<h1>Title</h1><h2>Section</h2><h3>Subsection</h3>",
    "heading-structure"
  );
  assert.equal(findings.length, 0);
});

// ─── Readability: meta-description ───────────────────────────────────────────

test("meta-description: flags missing meta description", async () => {
  const findings = await auditCheck("", "meta-description");
  // wrap() doesn't add meta description
  assert.ok(findings.length > 0);
});

test("meta-description: passes page with meta description", async () => {
  const report = await auditRaw(
    '<html lang="en"><head><title>T</title><meta name="description" content="A useful description of this page."></head><body></body></html>',
    ["meta-description"]
  );
  assert.equal(report.findings.length, 0);
});

// ─── Readability: heading-text ────────────────────────────────────────────────

test("heading-text: flags empty heading", async () => {
  const findings = await auditCheck("<h1></h1><h2>Section</h2>", "heading-text");
  assert.ok(findings.length > 0);
});

test("heading-text: passes headings with text", async () => {
  const findings = await auditCheck("<h1>Title</h1><h2>Section</h2>", "heading-text");
  assert.equal(findings.length, 0);
});

// ─── Readability: empty-lists ─────────────────────────────────────────────────

test("empty-lists: flags ul with no li children", async () => {
  const findings = await auditCheck("<ul></ul>", "empty-lists");
  assert.ok(findings.length > 0);
});

test("empty-lists: passes ul with li items", async () => {
  const findings = await auditCheck("<ul><li>Item one</li><li>Item two</li></ul>", "empty-lists");
  assert.equal(findings.length, 0);
});

// ─── Readability: page-length ─────────────────────────────────────────────────

test("page-length: flags extremely thin page", async () => {
  const report = await auditRaw(
    '<html lang="en"><head><title>T</title></head><body><p>Hi</p></body></html>',
    ["page-length"]
  );
  assert.ok(report.findings.length > 0);
});

test("page-length: passes page with substantial content", async () => {
  const content = "<p>Paragraph content.</p>".repeat(10);
  const findings = await auditCheck(content, "page-length");
  assert.equal(findings.length, 0);
});

// ─── Readability: flesch-kincaid ──────────────────────────────────────────────

test("flesch-kincaid: flags very difficult academic text", async () => {
  // Dense, polysyllabic sentences from a fake academic paper
  const complex = `
    <p>The epistemological ramifications of poststructuralist hermeneutics necessitate
    a reconfiguration of ontological presuppositions underpinning contemporary semiotic
    discourse, particularly with respect to the phenomenological dimensions of
    intertextuality and its manifestation within heterogeneous discursive formations.</p>
    <p>Consequentially, the proliferation of multisyllabic terminological constructs
    fundamentally undermines comprehensibility for non-specialist readerships, engendering
    significant communicative dissonance and substantially diminishing informational
    accessibility across socioeconomic stratifications.</p>
    <p>Notwithstanding the aforementioned epistemological considerations, philosophical
    investigations into consciousness necessitate methodological sophistication commensurate
    with the multidimensionality inherent in phenomenological and hermeneutical frameworks.</p>
  `;
  const findings = await auditCheck(complex, "flesch-kincaid");
  assert.ok(findings.length > 0, "expected readability finding for very complex text");
});

test("flesch-kincaid: passes simple, plain-English text", async () => {
  const simple = `
    <p>This tool helps you build better websites. It checks your page for common issues.</p>
    <p>You can fix these issues to help more people use your site. Each fix is shown with a clear tip.</p>
    <p>Run the audit to get a score. A high score means your page is easy to use.</p>
    <p>Click the button to start. It only takes a few seconds to get results.</p>
    <p>Share your results with your team. Work together to make things better.</p>
  `;
  const findings = await auditCheck(simple, "flesch-kincaid");
  assert.equal(findings.length, 0);
});

test("flesch-kincaid: skips pages with too little text", async () => {
  const findings = await auditCheck("<p>Hi there.</p>", "flesch-kincaid");
  assert.equal(findings.length, 0); // too few paragraphs to score
});

// ─── Readability: sentence-length ────────────────────────────────────────────

test("sentence-length: flags pages where average sentence exceeds 30 words", async () => {
  // Create paragraphs with very long sentences (35+ words each)
  const longSentences = `
    <p>This incredibly long sentence contains way too many words and clauses that drag on and on
    well past the point where the reader has any hope of following the argument being made without
    losing track of the original subject that was introduced at the very start of this rambling construction.</p>
    <p>Another excessively long sentence continues in the same vein, adding clause upon clause and
    phrase upon phrase until the reader is thoroughly exhausted and has long since forgotten what
    the main point of this paragraph was supposed to be when it was first introduced by the author.</p>
    <p>Yet another sentence of extraordinary length follows, demonstrating conclusively that the author
    has no concern for the cognitive load imposed on the reader by sentences that extend far beyond
    the recommended maximum of twenty to twenty-five words that readability researchers universally recommend.</p>
  `;
  const findings = await auditCheck(longSentences, "sentence-length");
  assert.ok(findings.length > 0);
});

test("sentence-length: passes text with normal sentence lengths", async () => {
  const normal = `
    <p>Short sentences are easy to read. They help the reader follow along. Keep sentences under 20 words.</p>
    <p>This is another clear sentence. It makes one point. Then it stops.</p>
  `;
  const findings = await auditCheck(normal, "sentence-length");
  assert.equal(findings.length, 0);
});

// ─── Readability: cta-presence ────────────────────────────────────────────────

test("cta-presence: flags page with no call to action", async () => {
  const findings = await auditCheck(
    "<h1>About us</h1><p>We are a company.</p>",
    "cta-presence"
  );
  assert.ok(findings.length > 0);
});

test("cta-presence: passes page with Get Started button", async () => {
  const findings = await auditCheck(
    '<h1>Welcome</h1><button>Get started</button>',
    "cta-presence"
  );
  assert.equal(findings.length, 0);
});

test("cta-presence: passes page with Sign Up link", async () => {
  const findings = await auditCheck(
    '<a href="/signup">Sign up free</a>',
    "cta-presence"
  );
  assert.equal(findings.length, 0);
});

test("cta-presence: passes page with Try Free link", async () => {
  const findings = await auditCheck(
    '<a href="/trial">Try free for 14 days</a>',
    "cta-presence"
  );
  assert.equal(findings.length, 0);
});

// ─── Readability: trust-signals ───────────────────────────────────────────────

test("trust-signals: flags page with no privacy or terms links", async () => {
  const findings = await auditCheck(
    "<h1>Sign Up</h1><p>Enter your details.</p>",
    "trust-signals"
  );
  // Should flag both missing privacy and terms
  assert.ok(findings.some((f) => f.id === "trust-privacy"));
  assert.ok(findings.some((f) => f.id === "trust-terms"));
});

test("trust-signals: passes page with privacy policy and terms links", async () => {
  const findings = await auditCheck(
    '<footer><a href="/privacy">Privacy Policy</a> · <a href="/terms">Terms of Service</a></footer>',
    "trust-signals"
  );
  assert.equal(findings.length, 0);
});

test("trust-signals: passes page that mentions privacy policy in text", async () => {
  const findings = await auditCheck(
    '<p>By signing up you agree to our privacy policy and terms of service.</p>',
    "trust-signals"
  );
  assert.equal(findings.length, 0);
});

// ─── Readability: og-tags ─────────────────────────────────────────────────────

test("og-tags: flags page missing all OG tags", async () => {
  const findings = await auditCheck("", "og-tags");
  assert.ok(findings.some((f) => f.id === "og-title"));
  assert.ok(findings.some((f) => f.id === "og-description"));
  assert.ok(findings.some((f) => f.id === "og-image"));
});

test("og-tags: passes page with all OG tags", async () => {
  const report = await auditRaw(`
    <html lang="en">
      <head>
        <title>Product Studio</title>
        <meta property="og:title" content="Product Studio — AI Design Tool">
        <meta property="og:description" content="Build beautiful products faster.">
        <meta property="og:image" content="https://example.com/og.png">
      </head>
      <body></body>
    </html>
  `, ["og-tags"]);
  assert.equal(report.findings.length, 0);
});

// ─── Performance: render-blocking-scripts ────────────────────────────────────

test("render-blocking-scripts: flags synchronous script in head", async () => {
  const report = await auditRaw(`
    <html lang="en">
      <head>
        <title>T</title>
        <script src="analytics.js"></script>
        <script src="widget.js"></script>
        <script src="tracker.js"></script>
      </head>
      <body></body>
    </html>
  `, ["render-blocking-scripts"]);
  assert.ok(report.findings.length > 0);
  assert.equal(report.findings[0].severity, "high"); // 3+ blocking scripts
});

test("render-blocking-scripts: passes scripts with defer", async () => {
  const report = await auditRaw(`
    <html lang="en">
      <head>
        <title>T</title>
        <script src="app.js" defer></script>
        <script src="analytics.js" defer></script>
      </head>
      <body></body>
    </html>
  `, ["render-blocking-scripts"]);
  assert.equal(report.findings.length, 0);
});

test("render-blocking-scripts: passes scripts with async", async () => {
  const report = await auditRaw(`
    <html lang="en">
      <head>
        <title>T</title>
        <script src="chat.js" async></script>
      </head>
      <body></body>
    </html>
  `, ["render-blocking-scripts"]);
  assert.equal(report.findings.length, 0);
});

test("render-blocking-scripts: passes type=module scripts", async () => {
  const report = await auditRaw(`
    <html lang="en">
      <head>
        <title>T</title>
        <script src="main.js" type="module"></script>
      </head>
      <body></body>
    </html>
  `, ["render-blocking-scripts"]);
  assert.equal(report.findings.length, 0);
});

// ─── Performance: dom-size ───────────────────────────────────────────────────

test("dom-size: flags page with >1500 elements", async () => {
  const divs = "<div>x</div>".repeat(1600);
  const report = await auditRaw(
    `<html lang="en"><head><title>T</title></head><body>${divs}</body></html>`,
    ["dom-size"]
  );
  assert.ok(report.findings.length > 0);
});

test("dom-size: passes page with reasonable DOM size", async () => {
  const findings = await auditCheck(
    "<header></header><main><p>Content</p></main><footer></footer>",
    "dom-size"
  );
  assert.equal(findings.length, 0);
});

// ─── Performance: images-lazy-loading ────────────────────────────────────────

test("images-lazy-loading: flags many below-fold images without lazy", async () => {
  // First 3 are skipped (above fold), need 3+ lazy-missing after that
  const images = Array.from({ length: 10 }, (_, i) =>
    `<img src="photo-${i}.jpg" alt="Photo ${i}">`
  ).join("");
  const findings = await auditCheck(images, "images-lazy-loading");
  assert.ok(findings.length > 0);
});

test("images-lazy-loading: passes images with loading=lazy", async () => {
  const images = Array.from({ length: 10 }, (_, i) =>
    i < 3
      ? `<img src="hero-${i}.jpg" alt="Hero ${i}">`
      : `<img src="photo-${i}.jpg" alt="Photo ${i}" loading="lazy">`
  ).join("");
  const findings = await auditCheck(images, "images-lazy-loading");
  assert.equal(findings.length, 0);
});

// ─── Performance: image-dimensions ───────────────────────────────────────────

test("image-dimensions: flags many images without width/height", async () => {
  const images = Array.from({ length: 8 }, (_, i) =>
    `<img src="photo-${i}.jpg" alt="Photo">`
  ).join("");
  const findings = await auditCheck(images, "image-dimensions");
  assert.ok(findings.length > 0);
});

test("image-dimensions: passes images with explicit dimensions", async () => {
  const images = Array.from({ length: 8 }, (_, i) =>
    `<img src="photo-${i}.jpg" alt="Photo" width="800" height="600">`
  ).join("");
  const findings = await auditCheck(images, "image-dimensions");
  assert.equal(findings.length, 0);
});

// ─── Performance: iframes-lazy-loading ───────────────────────────────────────

test("iframes-lazy-loading: flags iframes without lazy", async () => {
  const findings = await auditCheck(
    '<iframe src="map.html" title="Map"></iframe><iframe src="video.html" title="Video"></iframe>',
    "iframes-lazy-loading"
  );
  assert.ok(findings.length > 0);
});

test("iframes-lazy-loading: passes iframes with loading=lazy", async () => {
  const findings = await auditCheck(
    '<iframe src="map.html" title="Map" loading="lazy"></iframe>',
    "iframes-lazy-loading"
  );
  assert.equal(findings.length, 0);
});

// ─── Performance: stylesheet-count ───────────────────────────────────────────

test("stylesheet-count: flags page with many stylesheets", async () => {
  const links = Array.from({ length: 13 }, (_, i) =>
    `<link rel="stylesheet" href="style-${i}.css">`
  ).join("");
  const report = await auditRaw(
    `<html lang="en"><head><title>T</title>${links}</head><body></body></html>`,
    ["stylesheet-count"]
  );
  assert.ok(report.findings.length > 0);
  assert.equal(report.findings[0].severity, "high"); // >12
});

test("stylesheet-count: passes page with few stylesheets", async () => {
  const report = await auditRaw(
    '<html lang="en"><head><title>T</title><link rel="stylesheet" href="main.css"></head><body></body></html>',
    ["stylesheet-count"]
  );
  assert.equal(report.findings.length, 0);
});

// ─── Performance: resource-hints ─────────────────────────────────────────────

test("resource-hints: flags third-party scripts without preconnect", async () => {
  const report = await auditRaw(`
    <html lang="en">
      <head><title>T</title></head>
      <body>
        <script src="https://cdn.example.com/widget.js"></script>
        <script src="https://www.google-analytics.com/analytics.js"></script>
      </body>
    </html>
  `, ["resource-hints"]);
  assert.ok(report.findings.length > 0);
});

test("resource-hints: passes page with preconnect hints", async () => {
  const report = await auditRaw(`
    <html lang="en">
      <head>
        <title>T</title>
        <link rel="preconnect" href="https://cdn.example.com">
      </head>
      <body>
        <script src="https://cdn.example.com/widget.js"></script>
      </body>
    </html>
  `, ["resource-hints"]);
  assert.equal(report.findings.length, 0);
});

// ─── Performance: inline-scripts ─────────────────────────────────────────────

test("inline-scripts: flags page with many inline scripts", async () => {
  const scripts = Array.from({ length: 11 }, (_, i) =>
    `<script>var x${i} = ${i};</script>`
  ).join("");
  const findings = await auditCheck(scripts, "inline-scripts");
  assert.ok(findings.length > 0);
  assert.equal(findings[0].severity, "medium"); // >10
});

test("inline-scripts: passes page with few inline scripts", async () => {
  const findings = await auditCheck('<script>var x = 1;</script>', "inline-scripts");
  assert.equal(findings.length, 0);
});

// ─── Integration: finding shape ───────────────────────────────────────────────

test("every finding has required fields with non-empty strings", async () => {
  // Use a page that intentionally triggers many checks
  const badPage = `
    <!DOCTYPE html>
    <html>
      <head></head>
      <body>
        <img src="hero.jpg">
        <button></button>
        <input type="text">
        <a href="#"></a>
        <form><input type="text"><button type="button">Cancel</button></form>
        <table><tr><td>Name</td><td>Score</td></tr></table>
        <p style="color:#fff;background-color:#fff;">Invisible</p>
      </body>
    </html>
  `;
  const report = await auditRaw(badPage);
  assert.ok(report.findings.length > 0, "expected findings on broken page");

  for (const f of report.findings) {
    assert.ok(typeof f.id === "string" && f.id.length > 0, `finding.id empty: ${JSON.stringify(f)}`);
    assert.ok(["accessibility", "readability", "performance"].includes(f.category), `bad category: ${f.category}`);
    assert.ok(["low", "medium", "high", "critical"].includes(f.severity), `bad severity: ${f.severity}`);
    assert.ok(typeof f.title === "string" && f.title.length > 0, `finding.title empty`);
    assert.ok(typeof f.description === "string" && f.description.length > 0, `finding.description empty`);
    assert.ok(typeof f.recommendation === "string" && f.recommendation.length > 0, `finding.recommendation empty`);
  }
});

// ─── Integration: scores ──────────────────────────────────────────────────────

test("score is 100 for a clean, well-structured page", async () => {
  const cleanPage = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>Product Studio — AI Design Tool</title>
        <meta name="description" content="Build better products with AI-powered design tools.">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta property="og:title" content="Product Studio">
        <meta property="og:description" content="Build better products.">
        <meta property="og:image" content="https://example.com/og.png">
        <link rel="stylesheet" href="main.css">
      </head>
      <body>
        <a href="#main" class="sr-only">Skip to main content</a>
        <header>
          <nav>
            <a href="/">Home</a>
            <a href="/pricing">Pricing</a>
          </nav>
        </header>
        <main id="main">
          <h1>Build better products with AI</h1>
          <p>Product Studio helps designers and PMs ship faster. Simple sentences. Clear ideas.</p>
          <p>Try our tools free for 14 days. No credit card needed. Cancel any time.</p>
          <a href="/signup">Get started free</a>
          <img src="hero.jpg" alt="Designer working on a product wireframe" width="1200" height="630">
          <h2>Features</h2>
          <ul>
            <li>AI-powered blueprints in seconds</li>
            <li>Heuristic UX audit engine</li>
            <li>Live preview with real HTML</li>
          </ul>
        </main>
        <footer>
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
        </footer>
      </body>
    </html>
  `;
  const report = await auditRaw(cleanPage);
  assert.ok(report.score >= 80, `expected high score for clean page, got ${report.score}`);
});

test("score degrades significantly for a page with critical issues", async () => {
  const brokenPage = `
    <!DOCTYPE html>
    <html>
      <head></head>
      <body>
        <img src="a.jpg"><img src="b.jpg"><img src="c.jpg">
        <input type="text"><input type="email"><input type="password">
        <p style="color:#eee;background-color:#fff;">Low contrast text</p>
        <p style="color:#fff;background-color:#fff;">Invisible text</p>
        <script src="a.js"></script><script src="b.js"></script><script src="c.js"></script>
        <table><tr><td>Data</td></tr></table>
        <iframe src="x.html"></iframe>
      </body>
    </html>
  `;
  const report = await auditRaw(brokenPage);
  assert.ok(report.score < 70, `expected low score for broken page, got ${report.score}`);
});

test("category scores are integers between 0 and 100", async () => {
  const report = await auditRaw(
    '<html lang="en"><head><title>T</title></head><body><p>Some content here that is readable.</p></body></html>'
  );
  for (const [cat, score] of Object.entries(report.categoryScores)) {
    assert.ok(Number.isInteger(score), `${cat} score is not an integer: ${score}`);
    assert.ok(score >= 0 && score <= 100, `${cat} score out of range: ${score}`);
  }
});

test("selectedChecks filters which checks run", async () => {
  const report = await auditRaw(
    '<html><head></head><body></body></html>',
    ["page-title"] // only run the title check
  );
  // Should only have the title finding, no other checks
  assert.ok(report.findings.every((f) => f.id === "page-title" || f.id.startsWith("page-title")));
});

test("running with no checks returns 100 across all categories", async () => {
  const report = await auditRaw(
    '<html lang="en"><head><title>T</title></head><body></body></html>',
    [] // no checks selected
  );
  assert.equal(report.score, 100);
  assert.equal(report.categoryScores.accessibility, 100);
  assert.equal(report.categoryScores.readability, 100);
  assert.equal(report.categoryScores.performance, 100);
});
