import { load, type CheerioAPI } from "cheerio";
import type { AuditFinding, AuditReport } from "@product-studio/shared-types";

type AuditCategory = "accessibility" | "readability" | "performance";
type AuditSeverity = "low" | "medium" | "high";

type AuditIssue = {
  id: string;
  type: AuditCategory;
  group: string;
  severity: AuditSeverity;
  message: string;
  suggestion: string;
};

export type AuditCheckDefinition = {
  id: string;
  label: string;
  group: string;
};

export const AUDIT_CHECKS: AuditCheckDefinition[] = [
  { id: "images-alt", label: "Images missing alt text", group: "Images" },
  { id: "buttons-label", label: "Buttons without labels", group: "Forms" },
  { id: "inputs-label", label: "Inputs missing labels", group: "Forms" },
  { id: "links-name", label: "Links without accessible names", group: "Links" },
  { id: "document-language", label: "Missing document language", group: "Document" },
  { id: "links-action", label: "Non-navigational links", group: "Links" },
  { id: "main-landmark", label: "Missing main landmark", group: "Document" },
  { id: "iframes-title", label: "Iframes missing titles", group: "Media" },
  { id: "media-controls", label: "Media without controls", group: "Media" },
  { id: "forms-submit", label: "Forms without submit controls", group: "Forms" },
  { id: "paragraph-length", label: "Overly long paragraphs", group: "Content" },
  { id: "page-title", label: "Missing page title", group: "Metadata" },
  { id: "heading-structure", label: "Heading structure issues", group: "Headings" },
  { id: "meta-description", label: "Missing meta description", group: "Metadata" },
  { id: "heading-text", label: "Empty headings", group: "Headings" },
  { id: "empty-lists", label: "Empty lists", group: "Content" },
  { id: "page-length", label: "Very thin page content", group: "Content" },
  { id: "render-blocking-scripts", label: "Render-blocking scripts", group: "Document" },
  { id: "dom-size", label: "Large DOM size", group: "Document" },
  { id: "images-lazy-loading", label: "Offscreen images without lazy loading", group: "Images" },
  { id: "image-dimensions", label: "Images missing dimensions", group: "Images" },
  { id: "iframes-lazy-loading", label: "Iframes without lazy loading", group: "Media" },
  { id: "stylesheet-count", label: "Too many stylesheet files", group: "Metadata" }
];

export const AUDIT_CHECK_IDS = AUDIT_CHECKS.map((check) => check.id);

export interface AuditRequest {
  html: string;
  urlOrSnapshotId: string;
  selectedChecks?: string[];
}

export interface UxAuditAdapter {
  runAudit(input: AuditRequest): Promise<AuditReport>;
}

const SEVERITY_DEDUCTION: Record<AuditSeverity, number> = {
  low: 5,
  medium: 10,
  high: 20
};

type AuditCheckRunner = {
  id: string;
  type: AuditCategory;
  maxDeduction: number;
  run: (root: CheerioAPI) => AuditIssue[];
};

type CheckResult = {
  type: AuditCategory;
  maxDeduction: number;
  issues: AuditIssue[];
};

const CHECK_RUNNERS: AuditCheckRunner[] = [
  { id: "images-alt", type: "accessibility", maxDeduction: 30, run: checkImagesAlt },
  { id: "buttons-label", type: "accessibility", maxDeduction: 20, run: checkButtons },
  { id: "inputs-label", type: "accessibility", maxDeduction: 30, run: checkInputs },
  { id: "links-name", type: "accessibility", maxDeduction: 20, run: checkLinks },
  { id: "document-language", type: "accessibility", maxDeduction: 15, run: checkDocumentLanguage },
  { id: "links-action", type: "accessibility", maxDeduction: 20, run: checkBrokenActionLinks },
  { id: "main-landmark", type: "accessibility", maxDeduction: 15, run: checkMainLandmark },
  { id: "iframes-title", type: "accessibility", maxDeduction: 30, run: checkIframesTitle },
  { id: "media-controls", type: "accessibility", maxDeduction: 20, run: checkMediaControls },
  { id: "forms-submit", type: "accessibility", maxDeduction: 20, run: checkFormSubmitButtons },
  { id: "paragraph-length", type: "readability", maxDeduction: 15, run: checkParagraphLength },
  { id: "page-title", type: "readability", maxDeduction: 30, run: checkPageTitle },
  { id: "heading-structure", type: "readability", maxDeduction: 25, run: checkHeadingStructure },
  { id: "meta-description", type: "readability", maxDeduction: 10, run: checkMetaDescription },
  { id: "heading-text", type: "readability", maxDeduction: 20, run: checkHeadingText },
  { id: "empty-lists", type: "readability", maxDeduction: 10, run: checkEmptyLists },
  { id: "page-length", type: "readability", maxDeduction: 5, run: checkPageLength },
  { id: "render-blocking-scripts", type: "performance", maxDeduction: 30, run: checkRenderBlockingScripts },
  { id: "dom-size", type: "performance", maxDeduction: 25, run: checkLargeDomSize },
  { id: "images-lazy-loading", type: "performance", maxDeduction: 20, run: checkLazyLoadedImages },
  { id: "image-dimensions", type: "performance", maxDeduction: 10, run: checkImageDimensions },
  { id: "iframes-lazy-loading", type: "performance", maxDeduction: 20, run: checkLazyLoadedIframes },
  { id: "stylesheet-count", type: "performance", maxDeduction: 10, run: checkStylesheetCount }
];

export class FullUxAuditAdapter implements UxAuditAdapter {
  async runAudit(input: AuditRequest): Promise<AuditReport> {
    const $ = load(input.html);
    const enabledChecks = new Set(
      (input.selectedChecks ?? AUDIT_CHECK_IDS).filter((checkId) => AUDIT_CHECK_IDS.includes(checkId))
    );

    const results = CHECK_RUNNERS.flatMap<CheckResult>((check) => {
      if (!enabledChecks.has(check.id)) {
        return [];
      }

      return [{ type: check.type, maxDeduction: check.maxDeduction, issues: check.run($) }];
    });

    const issues = results.flatMap((result) => result.issues);
    const accessibility = calculateCategoryScore(results, "accessibility") ?? 100;
    const readability = calculateCategoryScore(results, "readability") ?? 100;
    const performance = calculateCategoryScore(results, "performance") ?? 100;
    const selectedCategoryScores = [accessibility, readability, performance];
    const score = Math.round(selectedCategoryScores.reduce((sum, value) => sum + value, 0) / selectedCategoryScores.length);

    return {
      urlOrSnapshotId: input.urlOrSnapshotId,
      score,
      categoryScores: {
        accessibility,
        readability,
        performance
      },
      findings: issues.map(toAuditFinding),
      generatedAt: new Date().toISOString()
    };
  }
}

export function createUxAuditAdapter(): UxAuditAdapter {
  return new FullUxAuditAdapter();
}

function toAuditFinding(issue: AuditIssue): AuditFinding {
  return {
    id: issue.id,
    category: issue.type,
    severity: issue.severity,
    title: issue.message,
    description: `${issue.group}: ${issue.message}`,
    recommendation: issue.suggestion
  };
}

function calculateCheckDeduction(issues: AuditIssue[], maxDeduction: number): number {
  const total = issues.reduce((sum, issue) => sum + SEVERITY_DEDUCTION[issue.severity], 0);
  return Math.min(total, maxDeduction);
}

function calculateCategoryScore(results: CheckResult[], type: AuditCategory): number | null {
  const categoryResults = results.filter((result) => result.type === type);
  if (categoryResults.length === 0) {
    return null;
  }

  const maxDeduction = categoryResults.reduce((sum, result) => sum + result.maxDeduction, 0);
  const actualDeduction = categoryResults.reduce((sum, result) => {
    return sum + calculateCheckDeduction(result.issues, result.maxDeduction);
  }, 0);

  return Math.max(0, Math.round(100 - (actualDeduction / maxDeduction) * 100));
}

function checkImagesAlt($: CheerioAPI): AuditIssue[] {
  const issues: AuditIssue[] = [];
  $("img").each((i: number, el: any) => {
    const alt = $(el).attr("alt");
    if (!alt || alt.trim() === "") {
      issues.push(issue(`img-alt-${i}`, "accessibility", "Images", "high", "Image missing alt text", "Add descriptive alt text for accessibility"));
    }
  });
  return issues;
}

function checkButtons($: CheerioAPI): AuditIssue[] {
  const issues: AuditIssue[] = [];
  $("button").each((i: number, el: any) => {
    const text = $(el).text().trim();
    const ariaLabel = $(el).attr("aria-label")?.trim();
    const title = $(el).attr("title")?.trim();
    const hasImageWithAlt = $(el)
      .find("img")
      .toArray()
      .some((img: any) => Boolean($(img).attr("alt")?.trim()));

    if (!text && !ariaLabel && !title && !hasImageWithAlt) {
      issues.push(issue(`btn-${i}`, "accessibility", "Forms", "medium", "Button has no label", "Add descriptive text inside button"));
    }
  });
  return issues;
}

function checkInputs($: CheerioAPI): AuditIssue[] {
  const issues: AuditIssue[] = [];
  $("input").each((i: number, el: any) => {
    const type = ($(el).attr("type") || "text").toLowerCase();
    if (["hidden", "submit", "button", "reset", "image"].includes(type)) return;

    const inputId = $(el).attr("id");
    const ariaLabel = $(el).attr("aria-label")?.trim();
    const ariaLabelledBy = $(el).attr("aria-labelledby")?.trim();
    const wrappedByLabel = $(el).closest("label").length > 0;
    const hasLabelFor = Boolean(inputId) &&
      $(`label[for="${inputId}"]`)
        .toArray()
        .some((label: any) => $(label).text().trim().length > 0);

    if (!ariaLabel && !ariaLabelledBy && !wrappedByLabel && !hasLabelFor) {
      issues.push(issue(`input-${i}`, "accessibility", "Forms", "high", "Input field missing label", "Use a visible label, aria-label, or aria-labelledby for accessibility"));
    }
  });
  return issues;
}

function checkLinks($: CheerioAPI): AuditIssue[] {
  const issues: AuditIssue[] = [];
  $("a").each((i: number, el: any) => {
    const text = $(el).text().trim();
    const ariaLabel = $(el).attr("aria-label")?.trim();
    const title = $(el).attr("title")?.trim();
    const hasImageWithAlt = $(el)
      .find("img")
      .toArray()
      .some((img: any) => Boolean($(img).attr("alt")?.trim()));

    if (!text && !ariaLabel && !title && !hasImageWithAlt) {
      issues.push(issue(`link-${i}`, "accessibility", "Links", "medium", "Link has no accessible name", "Add visible link text or an accessible label"));
    }
  });
  return issues;
}

function checkDocumentLanguage($: CheerioAPI): AuditIssue[] {
  const lang = $("html").attr("lang")?.trim();
  if (!lang) {
    return [issue("html-lang", "accessibility", "Document", "medium", "Document language is missing", "Add a lang attribute to the html element")];
  }
  return [];
}

function checkBrokenActionLinks($: CheerioAPI): AuditIssue[] {
  const issues: AuditIssue[] = [];
  $("a").each((i: number, el: any) => {
    const href = $(el).attr("href")?.trim().toLowerCase();
    if (!href || href === "#" || href.startsWith("javascript:")) {
      issues.push(issue(`link-action-${i}`, "accessibility", "Links", "medium", "Link uses a non-navigational href", "Use a real destination URL or use a button for actions"));
    }
  });
  return issues;
}

function checkMainLandmark($: CheerioAPI): AuditIssue[] {
  if ($("main, [role='main']").length === 0) {
    return [issue("main-landmark", "accessibility", "Document", "medium", "Page is missing a main landmark", "Add a main element or role='main' around primary content")];
  }
  return [];
}

function checkIframesTitle($: CheerioAPI): AuditIssue[] {
  const issues: AuditIssue[] = [];
  $("iframe").each((i: number, el: any) => {
    const title = $(el).attr("title")?.trim();
    if (!title) {
      issues.push(issue(`iframe-title-${i}`, "accessibility", "Media", "high", "Iframe is missing a title", "Add a descriptive title so assistive technology can identify the frame"));
    }
  });
  return issues;
}

function checkMediaControls($: CheerioAPI): AuditIssue[] {
  const issues: AuditIssue[] = [];
  $("audio, video").each((i: number, el: any) => {
    const hasControls = $(el).attr("controls") !== undefined;
    if (!hasControls) {
      issues.push(issue(`media-controls-${i}`, "accessibility", "Media", "medium", "Embedded media is missing controls", "Add controls so users can play, pause, and navigate media"));
    }
  });
  return issues;
}

function checkFormSubmitButtons($: CheerioAPI): AuditIssue[] {
  const issues: AuditIssue[] = [];
  $("form").each((i: number, el: any) => {
    const submitControl = $(el).find("button[type='submit'], input[type='submit'], button:not([type])");
    if (submitControl.length === 0) {
      issues.push(issue(`form-submit-${i}`, "accessibility", "Forms", "medium", "Form has no submit control", "Add a submit button so users can complete the form"));
    }
  });
  return issues;
}

function checkParagraphLength($: CheerioAPI): AuditIssue[] {
  const issues: AuditIssue[] = [];
  $("p").each((i: number, el: any) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text.length > 450) {
      issues.push(issue(`p-length-${i}`, "readability", "Content", "medium", "Paragraph too long", "Break text into smaller paragraphs"));
    } else if (text.length > 280) {
      issues.push(issue(`p-length-${i}`, "readability", "Content", "low", "Paragraph is getting long", "Consider splitting long paragraphs for easier scanning"));
    }
  });
  return issues;
}

function checkPageTitle($: CheerioAPI): AuditIssue[] {
  const title = $("title").first().text().trim();
  if (!title) {
    return [issue("page-title", "readability", "Metadata", "high", "Page is missing a title", "Add a descriptive title element in the document head")];
  }
  return [];
}

function checkHeadingStructure($: CheerioAPI): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const headings = $("h1, h2, h3, h4, h5, h6").toArray();
  const h1Count = $("h1").length;

  if (headings.length === 0) {
    return [issue("headings-missing", "readability", "Headings", "medium", "Page has no headings", "Use headings to organize page content")];
  }

  if (h1Count === 0) {
    issues.push(issue("h1-missing", "readability", "Headings", "medium", "Page is missing an H1 heading", "Add a clear H1 to describe the main page topic"));
  }
  if (h1Count > 1) {
    issues.push(issue("h1-multiple", "readability", "Headings", "low", "Page has multiple H1 headings", "Use a single primary H1 and reserve lower levels for sections"));
  }

  let previousLevel = 0;
  headings.forEach((heading: any, i: number) => {
    const level = Number(heading.tagName.toLowerCase().replace("h", ""));
    if (previousLevel > 0 && level > previousLevel + 1) {
      issues.push(issue(`heading-skip-${i}`, "readability", "Headings", "medium", `Heading structure skips from H${previousLevel} to H${level}`, "Keep heading levels in a logical sequence"));
    }
    previousLevel = level;
  });

  return issues;
}

function checkMetaDescription($: CheerioAPI): AuditIssue[] {
  const description = $('meta[name="description"]').attr("content")?.trim();
  if (!description) {
    return [issue("meta-description", "readability", "Metadata", "low", "Page is missing a meta description", "Add a concise meta description that summarizes the page")];
  }
  return [];
}

function checkHeadingText($: CheerioAPI): AuditIssue[] {
  const issues: AuditIssue[] = [];
  $("h1, h2, h3, h4, h5, h6").each((i: number, el: any) => {
    if (!$(el).text().trim()) {
      issues.push(issue(`heading-empty-${i}`, "readability", "Headings", "medium", "Heading is empty", "Add descriptive text to every heading"));
    }
  });
  return issues;
}

function checkEmptyLists($: CheerioAPI): AuditIssue[] {
  const issues: AuditIssue[] = [];
  $("ul, ol").each((i: number, el: any) => {
    if ($(el).children("li").length === 0) {
      issues.push(issue(`list-empty-${i}`, "readability", "Content", "low", "List has no list items", "Add list items or remove the empty list container"));
    }
  });
  return issues;
}

function checkPageLength($: CheerioAPI): AuditIssue[] {
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const contentBlocks = $("p, li, article, section, main").length;
  if (bodyText.length > 0 && bodyText.length < 90 && contentBlocks <= 2) {
    return [issue("page-length-thin", "readability", "Content", "low", "Page has very little readable content", "Add enough descriptive content to explain the page purpose")];
  }
  return [];
}

function checkRenderBlockingScripts($: CheerioAPI): AuditIssue[] {
  let blocking = 0;
  $("head script[src]").each((_: number, el: any) => {
    const isAsync = $(el).attr("async") !== undefined;
    const isDeferred = $(el).attr("defer") !== undefined;
    const type = $(el).attr("type")?.trim().toLowerCase();
    if (!isAsync && !isDeferred && type !== "module") {
      blocking += 1;
    }
  });

  if (blocking === 0) return [];
  return [
    issue(
      "render-blocking-scripts",
      "performance",
      "Document",
      blocking >= 3 ? "high" : "medium",
      `${blocking} head script${blocking === 1 ? "" : "s"} may block rendering`,
      "Use defer, async, or module scripts when possible"
    )
  ];
}

function checkLargeDomSize($: CheerioAPI): AuditIssue[] {
  const count = $("*").length;
  if (count > 4000) {
    return [issue("dom-size-large", "performance", "Document", "high", `Page has a very large DOM size (${count} elements)`, "Reduce unnecessary markup and deeply nested elements")];
  }
  if (count > 2500) {
    return [issue("dom-size-large", "performance", "Document", "medium", `Page has a large DOM size (${count} elements)`, "Reduce unnecessary markup and deeply nested elements")];
  }
  if (count > 1500) {
    return [issue("dom-size-large", "performance", "Document", "low", `Page DOM is getting large (${count} elements)`, "Keep DOM size under control to reduce layout and rendering work")];
  }
  return [];
}

function checkLazyLoadedImages($: CheerioAPI): AuditIssue[] {
  let nonLazy = 0;
  $("img").each((i: number, el: any) => {
    if (i < 3) return;
    const src = $(el).attr("src")?.trim().toLowerCase() || "";
    const loading = $(el).attr("loading")?.trim().toLowerCase();
    const fetchPriority = $(el).attr("fetchpriority")?.trim().toLowerCase();
    const width = Number($(el).attr("width"));
    const height = Number($(el).attr("height"));

    if (
      fetchPriority === "high" ||
      src.startsWith("data:image/svg") ||
      src.endsWith(".svg") ||
      (Number.isFinite(width) && Number.isFinite(height) && width <= 64 && height <= 64)
    ) {
      return;
    }

    if (loading !== "lazy") nonLazy += 1;
  });

  if (nonLazy < 3) return [];
  return [
    issue(
      "images-lazy-loading",
      "performance",
      "Images",
      nonLazy >= 10 ? "high" : nonLazy >= 6 ? "medium" : "low",
      `${nonLazy} non-critical image${nonLazy === 1 ? "" : "s"} may be missing lazy loading`,
      "Add loading='lazy' to non-critical images"
    )
  ];
}

function checkImageDimensions($: CheerioAPI): AuditIssue[] {
  let missing = 0;
  $("img").each((_: number, el: any) => {
    const src = $(el).attr("src")?.trim().toLowerCase() || "";
    const width = $(el).attr("width")?.trim();
    const height = $(el).attr("height")?.trim();
    if (src.startsWith("data:image/svg") || src.endsWith(".svg")) return;
    if (!width || !height) missing += 1;
  });

  if (missing < 3) return [];
  return [
    issue(
      "image-dimensions",
      "performance",
      "Images",
      missing >= 10 ? "high" : missing >= 6 ? "medium" : "low",
      `${missing} image${missing === 1 ? "" : "s"} are missing explicit dimensions`,
      "Set width and height to reduce layout shifts"
    )
  ];
}

function checkLazyLoadedIframes($: CheerioAPI): AuditIssue[] {
  let nonLazy = 0;
  $("iframe").each((_: number, el: any) => {
    const loading = $(el).attr("loading")?.trim().toLowerCase();
    if (loading !== "lazy") nonLazy += 1;
  });

  if (nonLazy === 0) return [];
  return [
    issue(
      "iframes-lazy-loading",
      "performance",
      "Media",
      nonLazy >= 4 ? "high" : nonLazy >= 2 ? "medium" : "low",
      `${nonLazy} iframe${nonLazy === 1 ? "" : "s"} may be loading too early`,
      "Add loading='lazy' to defer offscreen iframe work"
    )
  ];
}

function checkStylesheetCount($: CheerioAPI): AuditIssue[] {
  const count = $('link[rel="stylesheet"]').length;
  if (count > 12) {
    return [issue("stylesheet-count", "performance", "Metadata", "high", `Page loads ${count} stylesheet files`, "Reduce stylesheet requests or combine non-critical CSS")];
  }
  if (count > 8) {
    return [issue("stylesheet-count", "performance", "Metadata", "medium", `Page loads ${count} stylesheet files`, "Reduce stylesheet requests or combine non-critical CSS")];
  }
  if (count > 5) {
    return [issue("stylesheet-count", "performance", "Metadata", "low", `Page loads ${count} stylesheet files`, "Review whether all stylesheet requests are necessary")];
  }
  return [];
}

function issue(
  id: string,
  type: AuditCategory,
  group: string,
  severity: AuditSeverity,
  message: string,
  suggestion: string
): AuditIssue {
  return { id, type, group, severity, message, suggestion };
}
