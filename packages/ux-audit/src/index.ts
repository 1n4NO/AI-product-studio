import { load, type CheerioAPI } from "cheerio";
import type { AuditFinding, AuditReport } from "@product-studio/shared-types";

type AuditCategory = "accessibility" | "readability" | "performance";
type AuditSeverity = "low" | "medium" | "high" | "critical";

type AuditIssue = {
  id: string;
  type: AuditCategory;
  group: string;
  severity: AuditSeverity;
  message: string;
  detail: string;
  suggestion: string;
};

export type AuditCheckDefinition = {
  id: string;
  label: string;
  group: string;
};

export const AUDIT_CHECKS: AuditCheckDefinition[] = [
  // ── Accessibility ─────────────────────────────────────────────────────────
  { id: "images-alt",           label: "Images missing alt text",              group: "Images"   },
  { id: "buttons-label",        label: "Buttons without labels",               group: "Forms"    },
  { id: "inputs-label",         label: "Inputs missing labels",                group: "Forms"    },
  { id: "links-name",           label: "Links without accessible names",       group: "Links"    },
  { id: "document-language",    label: "Missing document language",            group: "Document" },
  { id: "links-action",         label: "Non-navigational links",               group: "Links"    },
  { id: "main-landmark",        label: "Missing main landmark",                group: "Document" },
  { id: "landmark-regions",     label: "Missing landmark regions",             group: "Document" },
  { id: "iframes-title",        label: "Iframes missing titles",               group: "Media"    },
  { id: "media-controls",       label: "Media without controls",               group: "Media"    },
  { id: "forms-submit",         label: "Forms without submit controls",        group: "Forms"    },
  { id: "color-contrast",       label: "Insufficient color contrast",          group: "Visual"   },
  { id: "skip-link",            label: "Missing skip navigation link",         group: "Document" },
  { id: "positive-tabindex",    label: "Positive tabindex values",             group: "Document" },
  { id: "viewport-meta",        label: "Missing or broken viewport meta",      group: "Document" },
  { id: "table-headers",        label: "Tables missing header cells",          group: "Tables"   },
  { id: "focus-outline",        label: "Focus outline suppressed",             group: "Visual"   },
  // ── Readability ───────────────────────────────────────────────────────────
  { id: "paragraph-length",     label: "Overly long paragraphs",              group: "Content"  },
  { id: "page-title",           label: "Missing page title",                   group: "Metadata" },
  { id: "title-length",         label: "Page title too short or too long",     group: "Metadata" },
  { id: "heading-structure",    label: "Heading structure issues",             group: "Headings" },
  { id: "meta-description",     label: "Missing meta description",             group: "Metadata" },
  { id: "heading-text",         label: "Empty headings",                       group: "Headings" },
  { id: "empty-lists",          label: "Empty lists",                          group: "Content"  },
  { id: "page-length",          label: "Very thin page content",               group: "Content"  },
  { id: "flesch-kincaid",       label: "Low reading ease score",               group: "Content"  },
  { id: "sentence-length",      label: "Overly long sentences",                group: "Content"  },
  { id: "cta-presence",         label: "No clear call to action",              group: "Content"  },
  { id: "trust-signals",        label: "Missing trust signals",                group: "Content"  },
  { id: "og-tags",              label: "Missing Open Graph tags",              group: "Metadata" },
  // ── Performance ───────────────────────────────────────────────────────────
  { id: "render-blocking-scripts", label: "Render-blocking scripts",           group: "Document" },
  { id: "dom-size",             label: "Large DOM size",                       group: "Document" },
  { id: "images-lazy-loading",  label: "Offscreen images without lazy loading", group: "Images" },
  { id: "image-dimensions",     label: "Images missing dimensions",            group: "Images"   },
  { id: "iframes-lazy-loading", label: "Iframes without lazy loading",         group: "Media"    },
  { id: "stylesheet-count",     label: "Too many stylesheet files",            group: "Document" },
  { id: "resource-hints",       label: "Missing resource hints",               group: "Document" },
  { id: "inline-scripts",       label: "Too many inline scripts",              group: "Document" },
];

export const AUDIT_CHECK_IDS = AUDIT_CHECKS.map((c) => c.id);

export interface AuditRequest {
  html: string;
  urlOrSnapshotId: string;
  selectedChecks?: string[];
}

export interface UxAuditAdapter {
  runAudit(input: AuditRequest): Promise<AuditReport>;
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

const SEVERITY_DEDUCTION: Record<AuditSeverity, number> = {
  low: 5,
  medium: 10,
  high: 20,
  critical: 30,
};

type AuditCheckRunner = {
  id: string;
  type: AuditCategory;
  maxDeduction: number;
  run: (root: CheerioAPI, html: string) => AuditIssue[];
};

type CheckResult = {
  type: AuditCategory;
  maxDeduction: number;
  issues: AuditIssue[];
};

// ─── Color contrast helpers (WCAG 2.1) ───────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] | null {
  const h = hex.replace("#", "");
  if (h.length === 3) {
    return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16),
    ];
  }
  if (h.length === 6) {
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  return null;
}

function rgbStrToRgb(s: string): [number, number, number] | null {
  const m = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  return m ? [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])] : null;
}

const NAMED_COLORS: Record<string, [number, number, number]> = {
  white: [255, 255, 255], black: [0, 0, 0], red: [255, 0, 0],
  green: [0, 128, 0], blue: [0, 0, 255], yellow: [255, 255, 0],
  orange: [255, 165, 0], purple: [128, 0, 128], pink: [255, 192, 203],
  gray: [128, 128, 128], grey: [128, 128, 128], silver: [192, 192, 192],
  navy: [0, 0, 128], teal: [0, 128, 128], lime: [0, 255, 0],
  transparent: [255, 255, 255], // treat as white background
};

function parseColor(s: string): [number, number, number] | null {
  const t = s.trim().toLowerCase();
  if (t.startsWith("#")) return hexToRgb(t);
  if (t.startsWith("rgb")) return rgbStrToRgb(t);
  return NAMED_COLORS[t] ?? null;
}

function relativeLuminance(r: number, g: number, b: number): number {
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastRatio(c1: [number, number, number], c2: [number, number, number]): number {
  const l1 = relativeLuminance(...c1);
  const l2 = relativeLuminance(...c2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function parseInlineStyle(style: string): Record<string, string> {
  const props: Record<string, string> = {};
  style.split(";").forEach((rule) => {
    const idx = rule.indexOf(":");
    if (idx === -1) return;
    const key = rule.slice(0, idx).trim().toLowerCase();
    const val = rule.slice(idx + 1).trim().toLowerCase();
    if (key) props[key] = val;
  });
  return props;
}

// ─── Readability helpers (Flesch-Kincaid) ────────────────────────────────────

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;
  const cleaned = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  const matches = cleaned.match(/[aeiouy]{1,2}/g);
  return matches ? Math.max(1, matches.length) : 1;
}

function fleschReadingEase(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 2);
  const words = text.split(/\s+/).filter((w) => /[a-zA-Z]/.test(w));
  if (sentences.length === 0 || words.length === 0) return 100;
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const asl = words.length / sentences.length; // avg sentence length
  const asw = syllables / words.length;        // avg syllables per word
  return 206.835 - 1.015 * asl - 84.6 * asw;
}

function avgWordsPerSentence(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 2);
  const words = text.split(/\s+/).filter((w) => /[a-zA-Z]/.test(w));
  if (sentences.length === 0) return 0;
  return words.length / sentences.length;
}

// ─── Issue factory ────────────────────────────────────────────────────────────

function issue(
  id: string,
  type: AuditCategory,
  group: string,
  severity: AuditSeverity,
  message: string,
  detail: string,
  suggestion: string
): AuditIssue {
  return { id, type, group, severity, message, detail, suggestion };
}

// ─── Accessibility checks ─────────────────────────────────────────────────────

function checkImagesAlt($: CheerioAPI): AuditIssue[] {
  const issues: AuditIssue[] = [];
  $("img").each((i, el) => {
    const alt = $(el).attr("alt");
    const role = $(el).attr("role")?.toLowerCase();
    if (role === "presentation" || role === "none") return; // decorative
    if (alt === undefined || alt.trim() === "") {
      issues.push(issue(
        `img-alt-${i}`, "accessibility", "Images", "high",
        "Image missing alt text",
        "Screen readers cannot convey image meaning without descriptive alt text. Users relying on assistive technology will miss this content.",
        "Add descriptive alt text (alt=\"…\") to every meaningful image. Use alt=\"\" only for purely decorative images."
      ));
    }
  });
  return issues;
}

function checkButtons($: CheerioAPI): AuditIssue[] {
  const issues: AuditIssue[] = [];
  $("button").each((i, el) => {
    const text = $(el).text().trim();
    const ariaLabel = $(el).attr("aria-label")?.trim();
    const title = $(el).attr("title")?.trim();
    const hasImgAlt = $(el).find("img").toArray().some((img) => Boolean($(img).attr("alt")?.trim()));
    if (!text && !ariaLabel && !title && !hasImgAlt) {
      issues.push(issue(
        `btn-${i}`, "accessibility", "Forms", "medium",
        "Button has no accessible label",
        "Icon-only or empty buttons are invisible to screen readers and voice control software.",
        "Add visible label text, an aria-label attribute, or a visually-hidden span inside the button."
      ));
    }
  });
  return issues;
}

function checkInputs($: CheerioAPI): AuditIssue[] {
  const issues: AuditIssue[] = [];
  $("input").each((i, el) => {
    const type = ($(el).attr("type") ?? "text").toLowerCase();
    if (["hidden", "submit", "button", "reset", "image"].includes(type)) return;
    const id = $(el).attr("id");
    const ariaLabel = $(el).attr("aria-label")?.trim();
    const ariaLabelledBy = $(el).attr("aria-labelledby")?.trim();
    const wrappedByLabel = $(el).closest("label").length > 0;
    const hasLabelFor = Boolean(id) && $(`label[for="${id}"]`).toArray()
      .some((l) => $(l).text().trim().length > 0);

    if (!ariaLabel && !ariaLabelledBy && !wrappedByLabel && !hasLabelFor) {
      issues.push(issue(
        `input-${i}`, "accessibility", "Forms", "critical",
        "Form input has no accessible label",
        "Unlabelled inputs fail WCAG 1.3.1 (Info and Relationships) and 4.1.2 (Name, Role, Value), preventing assistive technology users from completing the form.",
        "Associate every input with a <label for=\"…\">, wrap it in a <label>, or use aria-label / aria-labelledby."
      ));
    }
  });
  return issues;
}

function checkLinks($: CheerioAPI): AuditIssue[] {
  const issues: AuditIssue[] = [];
  $("a").each((i, el) => {
    const text = $(el).text().trim();
    const ariaLabel = $(el).attr("aria-label")?.trim();
    const title = $(el).attr("title")?.trim();
    const hasImgAlt = $(el).find("img").toArray().some((img) => Boolean($(img).attr("alt")?.trim()));
    if (!text && !ariaLabel && !title && !hasImgAlt) {
      issues.push(issue(
        `link-${i}`, "accessibility", "Links", "medium",
        "Link has no accessible name",
        "Empty links are announced as just \"link\" by screen readers with no context about the destination.",
        "Add descriptive anchor text or an aria-label that explains the link destination."
      ));
    }
  });
  return issues;
}

function checkDocumentLanguage($: CheerioAPI): AuditIssue[] {
  const lang = $("html").attr("lang")?.trim();
  if (!lang) {
    return [issue(
      "html-lang", "accessibility", "Document", "medium",
      "Document language is not declared",
      "Without a lang attribute, screen readers cannot select the correct pronunciation engine, degrading the audio experience for all users.",
      "Add lang=\"en\" (or the appropriate BCP 47 language tag) to the <html> element."
    )];
  }
  return [];
}

function checkBrokenActionLinks($: CheerioAPI): AuditIssue[] {
  const issues: AuditIssue[] = [];
  $("a").each((i, el) => {
    const href = $(el).attr("href")?.trim().toLowerCase();
    if (!href || href === "#" || href.startsWith("javascript:")) {
      issues.push(issue(
        `link-action-${i}`, "accessibility", "Links", "medium",
        "Link uses a non-navigational href",
        "Links with href=\"#\" or javascript: void(0) behave like buttons but have incorrect semantics, confusing screen readers and keyboard users.",
        "Use <button> for actions and <a href=\"…\"> only for real navigation destinations."
      ));
    }
  });
  return issues;
}

function checkMainLandmark($: CheerioAPI): AuditIssue[] {
  if ($("main, [role='main']").length === 0) {
    return [issue(
      "main-landmark", "accessibility", "Document", "medium",
      "Page is missing a <main> landmark",
      "Without a main landmark, keyboard users cannot skip to primary content, and screen reader users lose orientation cues.",
      "Wrap the primary page content in a <main> element."
    )];
  }
  return [];
}

function checkLandmarkRegions($: CheerioAPI): AuditIssue[] {
  const issues: AuditIssue[] = [];
  if ($("header, [role='banner']").length === 0) {
    issues.push(issue(
      "landmark-header", "accessibility", "Document", "low",
      "Page is missing a <header> landmark",
      "A header landmark helps screen reader users quickly jump to site navigation and branding.",
      "Wrap your site header in a <header> element or add role=\"banner\"."
    ));
  }
  if ($("nav, [role='navigation']").length === 0) {
    issues.push(issue(
      "landmark-nav", "accessibility", "Document", "medium",
      "Page is missing a <nav> landmark",
      "Navigation landmarks allow keyboard and screen reader users to quickly move between sections.",
      "Wrap your primary navigation in a <nav> element."
    ));
  }
  if ($("footer, [role='contentinfo']").length === 0) {
    issues.push(issue(
      "landmark-footer", "accessibility", "Document", "low",
      "Page is missing a <footer> landmark",
      "Footer landmarks help users quickly locate contact info, legal links, and secondary navigation.",
      "Wrap your page footer in a <footer> element."
    ));
  }
  return issues;
}

function checkIframesTitle($: CheerioAPI): AuditIssue[] {
  const issues: AuditIssue[] = [];
  $("iframe").each((i, el) => {
    if (!$(el).attr("title")?.trim()) {
      issues.push(issue(
        `iframe-title-${i}`, "accessibility", "Media", "high",
        "Iframe is missing a title attribute",
        "Screen readers announce iframe content using the title. Without it users cannot determine what the embedded frame contains.",
        "Add a descriptive title attribute to every <iframe> (e.g., title=\"Customer reviews\")."
      ));
    }
  });
  return issues;
}

function checkMediaControls($: CheerioAPI): AuditIssue[] {
  const issues: AuditIssue[] = [];
  $("audio, video").each((i, el) => {
    if ($(el).attr("controls") === undefined) {
      issues.push(issue(
        `media-controls-${i}`, "accessibility", "Media", "medium",
        "Embedded media has no controls",
        "Without native controls, keyboard-only and assistive technology users cannot play, pause, or adjust volume.",
        "Add the controls attribute to all <audio> and <video> elements."
      ));
    }
  });
  return issues;
}

function checkFormSubmitButtons($: CheerioAPI): AuditIssue[] {
  const issues: AuditIssue[] = [];
  $("form").each((i, el) => {
    const hasSubmit = $(el).find("button[type='submit'], input[type='submit'], button:not([type])").length > 0;
    if (!hasSubmit) {
      issues.push(issue(
        `form-submit-${i}`, "accessibility", "Forms", "medium",
        "Form has no submit control",
        "Forms without an explicit submit control rely on implicit behaviour that varies across browsers and assistive technologies.",
        "Add a <button type=\"submit\"> or <input type=\"submit\"> to every form."
      ));
    }
  });
  return issues;
}

function checkColorContrast($: CheerioAPI): AuditIssue[] {
  const issues: AuditIssue[] = [];

  // Parse CSS blocks for color pairs (selector → {color, bg})
  const cssColorMap: Array<{ fg: string; bg: string; context: string }> = [];

  // Check inline styles on text elements
  const textSelectors = "p, h1, h2, h3, h4, h5, h6, li, td, th, span, a, label, button, dt, dd";
  $(textSelectors).each((_, el) => {
    const inlineStyle = $(el).attr("style") ?? "";
    const parentStyle = $(el).parent().attr("style") ?? "";
    const props = parseInlineStyle(inlineStyle);
    const parentProps = parseInlineStyle(parentStyle);

    const fg = props["color"] ?? null;
    const bg = props["background-color"] ?? props["background"] ?? parentProps["background-color"] ?? parentProps["background"] ?? null;

    if (fg && bg) {
      const fgRgb = parseColor(fg);
      const bgRgb = parseColor(bg);
      if (fgRgb && bgRgb) {
        const ratio = contrastRatio(fgRgb, bgRgb);
        if (ratio < 3.0) {
          cssColorMap.push({ fg, bg, context: `${ratio.toFixed(2)}:1` });
        }
      }
    }
  });

  // Deduplicate by fg+bg pair
  const seen = new Set<string>();
  for (const { fg, bg, context } of cssColorMap) {
    const key = `${fg}|${bg}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const fgRgb = parseColor(fg)!;
    const bgRgb = parseColor(bg)!;
    const ratio = contrastRatio(fgRgb, bgRgb);
    const severity: AuditSeverity = ratio < 3.0 ? "critical" : "high";
    issues.push(issue(
      `color-contrast-${issues.length}`, "accessibility", "Visual", severity,
      `Color contrast ratio ${context} fails WCAG AA`,
      `The text color "${fg}" on background "${bg}" has a contrast ratio of ${ratio.toFixed(2)}:1, below the WCAG 2.1 AA minimum of 4.5:1 for normal text.`,
      "Increase contrast to at least 4.5:1 for normal text or 3:1 for large text (18pt+ or 14pt bold). Use a tool like WebAIM Contrast Checker."
    ));
  }

  return issues;
}

function checkSkipLink($: CheerioAPI): AuditIssue[] {
  // A skip link is typically the first focusable element with href="#main" or similar
  const firstLink = $("a").first();
  const href = firstLink.attr("href")?.toLowerCase() ?? "";
  const isSkipLink =
    href.includes("#main") ||
    href.includes("#content") ||
    href.includes("#skip") ||
    (firstLink.text().toLowerCase().includes("skip") && href.startsWith("#"));

  if (!isSkipLink) {
    return [issue(
      "skip-link", "accessibility", "Document", "medium",
      "Page is missing a skip navigation link",
      "Without a skip link, keyboard users must Tab through every navigation item on every page load before reaching the main content — a common WCAG 2.4.1 failure.",
      "Add <a href=\"#main-content\" class=\"sr-only focus:not-sr-only\">Skip to main content</a> as the very first element in <body>."
    )];
  }
  return [];
}

function checkPositiveTabindex($: CheerioAPI): AuditIssue[] {
  const issues: AuditIssue[] = [];
  $("[tabindex]").each((i, el) => {
    const val = parseInt($(el).attr("tabindex") ?? "0", 10);
    if (val > 0) {
      issues.push(issue(
        `tabindex-${i}`, "accessibility", "Document", "high",
        `Element has tabindex="${val}" which overrides natural tab order`,
        "Positive tabindex values create a custom tab sequence that is typically out of sync with visual layout, confusing keyboard navigation.",
        "Remove positive tabindex values. Use tabindex=\"0\" to make an element focusable in natural order, or reorganise the DOM instead."
      ));
    }
  });
  return issues;
}

function checkViewportMeta($: CheerioAPI): AuditIssue[] {
  const viewport = $("meta[name='viewport']").attr("content") ?? "";
  if (!viewport) {
    return [issue(
      "viewport-meta-missing", "accessibility", "Document", "high",
      "Page is missing a viewport meta tag",
      "Without a viewport declaration mobile browsers render the page at desktop width and shrink it, making text tiny and unreadable without zooming.",
      "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> to the <head>."
    )];
  }
  if (/user-scalable\s*=\s*no/i.test(viewport) || /maximum-scale\s*=\s*1[^.]/i.test(viewport)) {
    return [issue(
      "viewport-zoom-disabled", "accessibility", "Document", "high",
      "Viewport meta disables user zoom (WCAG 1.4.4)",
      "Preventing zoom fails WCAG 2.1 Success Criterion 1.4.4 (Resize Text) and harms low-vision users who rely on browser zoom.",
      "Remove user-scalable=no and maximum-scale=1 from the viewport meta tag."
    )];
  }
  return [];
}

function checkTableHeaders($: CheerioAPI): AuditIssue[] {
  const issues: AuditIssue[] = [];
  $("table").each((i, el) => {
    const hasHeaders = $(el).find("th").length > 0;
    if (!hasHeaders) {
      issues.push(issue(
        `table-headers-${i}`, "accessibility", "Tables", "high",
        "Data table is missing header cells",
        "Tables without <th> elements cannot communicate the relationship between header and data cells to screen readers, violating WCAG 1.3.1.",
        "Add <th scope=\"col\"> or <th scope=\"row\"> cells to identify column and row headers."
      ));
    }
  });
  return issues;
}

function checkFocusOutline(_$: CheerioAPI, html: string): AuditIssue[] {
  // Scan <style> blocks for outline:none or outline:0 without a :focus-visible replacement
  const styleBlocks = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]);
  const combinedCss = styleBlocks.join("\n");

  const suppressesOutline =
    /outline\s*:\s*(none|0)/i.test(combinedCss) ||
    /outline-style\s*:\s*none/i.test(combinedCss);

  const hasFocusVisible = /:focus-visible/i.test(combinedCss);

  if (suppressesOutline && !hasFocusVisible) {
    return [issue(
      "focus-outline", "accessibility", "Visual", "high",
      "CSS suppresses focus outlines without a :focus-visible replacement",
      "outline:none removes the browser's default keyboard focus indicator. Without a custom :focus-visible style, keyboard users cannot tell which element is active, failing WCAG 2.4.7.",
      "Replace outline:none with a custom :focus-visible rule that provides a clearly visible focus indicator (e.g. outline: 2px solid currentColor; outline-offset: 2px)."
    )];
  }
  return [];
}

// ─── Readability checks ───────────────────────────────────────────────────────

function checkParagraphLength($: CheerioAPI): AuditIssue[] {
  const issues: AuditIssue[] = [];
  $("p").each((i, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text.length > 450) {
      issues.push(issue(
        `p-length-${i}`, "readability", "Content", "medium",
        "Paragraph is too long for comfortable reading",
        `This paragraph is ${text.length} characters — above the recommended 250–300 character limit for web reading. Long blocks of text increase cognitive load and reduce completion rates.`,
        "Break this paragraph into 2–3 shorter paragraphs or use a bullet list to improve scannability."
      ));
    } else if (text.length > 280) {
      issues.push(issue(
        `p-length-${i}`, "readability", "Content", "low",
        "Paragraph is getting long",
        `This paragraph is ${text.length} characters — approaching the 300-character threshold for comfortable web reading.`,
        "Consider splitting this paragraph for easier scanning."
      ));
    }
  });
  return issues;
}

function checkPageTitle($: CheerioAPI): AuditIssue[] {
  const title = $("title").first().text().trim();
  if (!title) {
    return [issue(
      "page-title", "readability", "Metadata", "high",
      "Page is missing a <title> element",
      "The page title is the first thing screen readers announce and the text shown in browser tabs and search results. Missing it hurts both accessibility and SEO.",
      "Add a concise, descriptive <title> in the <head> that identifies the page and site."
    )];
  }
  return [];
}

function checkTitleLength($: CheerioAPI): AuditIssue[] {
  const title = $("title").first().text().trim();
  if (!title) return []; // handled by checkPageTitle
  if (title.length < 10) {
    return [issue(
      "title-too-short", "readability", "Metadata", "medium",
      `Page title "${title}" is too short (${title.length} chars)`,
      "Very short titles fail to communicate the page purpose to users and search engines.",
      "Write a title between 30–60 characters that includes the primary keyword and brand name."
    )];
  }
  if (title.length > 70) {
    return [issue(
      "title-too-long", "readability", "Metadata", "low",
      `Page title is ${title.length} characters — may be truncated in search results`,
      "Titles over 60–70 characters are typically truncated by Google and other search engines, hiding important context.",
      "Keep the title under 60 characters while conveying the key page purpose."
    )];
  }
  return [];
}

function checkHeadingStructure($: CheerioAPI): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const headings = $("h1, h2, h3, h4, h5, h6").toArray();
  const h1Count = $("h1").length;

  if (headings.length === 0) {
    return [issue(
      "headings-missing", "readability", "Headings", "medium",
      "Page has no heading elements",
      "Headings create a navigable document outline. Their absence makes it impossible for screen reader users to jump between sections.",
      "Use <h1> for the page title, then <h2>–<h6> for section headings in a logical hierarchy."
    )];
  }
  if (h1Count === 0) {
    issues.push(issue(
      "h1-missing", "readability", "Headings", "medium",
      "Page is missing an H1 heading",
      "The H1 communicates the primary topic to both screen readers and search engines. Its absence weakens page structure and SEO.",
      "Add a single, keyword-rich H1 that describes the main page purpose."
    ));
  }
  if (h1Count > 1) {
    issues.push(issue(
      "h1-multiple", "readability", "Headings", "low",
      `Page has ${h1Count} H1 headings — only one is recommended`,
      "Multiple H1s dilute page focus and can confuse search engines about the primary topic.",
      "Keep a single H1 as the main page title. Promote subordinate headings to H2."
    ));
  }

  let prevLevel = 0;
  headings.forEach((heading, i) => {
    const level = Number((heading as any).tagName.replace("h", ""));
    if (prevLevel > 0 && level > prevLevel + 1) {
      issues.push(issue(
        `heading-skip-${i}`, "readability", "Headings", "medium",
        `Heading jumps from H${prevLevel} to H${level} (skips a level)`,
        "Skipping heading levels breaks the document outline and confuses screen reader users navigating by heading.",
        `Replace H${level} with H${prevLevel + 1} to maintain a sequential hierarchy.`
      ));
    }
    prevLevel = level;
  });

  return issues;
}

function checkMetaDescription($: CheerioAPI): AuditIssue[] {
  const desc = $('meta[name="description"]').attr("content")?.trim();
  if (!desc) {
    return [issue(
      "meta-description", "readability", "Metadata", "low",
      "Page is missing a meta description",
      "Without a meta description, search engines generate their own snippet, which is often less compelling than a handcrafted summary.",
      "Write a 120–160 character description that summarises the page value proposition for search result previews."
    )];
  }
  return [];
}

function checkHeadingText($: CheerioAPI): AuditIssue[] {
  const issues: AuditIssue[] = [];
  $("h1, h2, h3, h4, h5, h6").each((i, el) => {
    if (!$(el).text().trim()) {
      issues.push(issue(
        `heading-empty-${i}`, "readability", "Headings", "medium",
        "Heading element is empty",
        "Empty headings appear in the document outline as blank entries, disorienting screen reader users.",
        "Add descriptive text to every heading or remove the empty element."
      ));
    }
  });
  return issues;
}

function checkEmptyLists($: CheerioAPI): AuditIssue[] {
  const issues: AuditIssue[] = [];
  $("ul, ol").each((i, el) => {
    if ($(el).children("li").length === 0) {
      issues.push(issue(
        `list-empty-${i}`, "readability", "Content", "low",
        "List element contains no items",
        "An empty <ul> or <ol> renders no visible content but exists in the DOM, cluttering the document structure.",
        "Add <li> items to the list or remove the empty container entirely."
      ));
    }
  });
  return issues;
}

function checkPageLength($: CheerioAPI): AuditIssue[] {
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const contentBlocks = $("p, li, article, section, main").length;
  if (bodyText.length > 0 && bodyText.length < 90 && contentBlocks <= 2) {
    return [issue(
      "page-length-thin", "readability", "Content", "low",
      "Page has very little readable content",
      "Thin content pages rank poorly in search and provide little value to users arriving from organic channels.",
      "Add substantial descriptive content — headlines, paragraphs, and supporting copy that explains the page purpose."
    )];
  }
  return [];
}

function checkFleschKincaid($: CheerioAPI): AuditIssue[] {
  // Extract meaningful text from content elements
  const textNodes: string[] = [];
  $("p, li, td, th").each((_, el) => {
    const t = $(el).text().replace(/\s+/g, " ").trim();
    if (t.length > 20) textNodes.push(t);
  });

  if (textNodes.length < 3) return []; // too little text to score reliably

  const combinedText = textNodes.join(". ");
  const score = fleschReadingEase(combinedText);

  if (score < 30) {
    return [issue(
      "flesch-kincaid-very-hard", "readability", "Content", "high",
      `Reading ease score is ${Math.round(score)} (Very Difficult)`,
      "Flesch Reading Ease below 30 corresponds to graduate-level text. Most web visitors read at a 6th–8th grade level and will struggle or abandon dense copy.",
      "Aim for a Flesch score of 60–70 (plain English). Use shorter sentences, simpler words, and active voice."
    )];
  }
  if (score < 50) {
    return [issue(
      "flesch-kincaid-hard", "readability", "Content", "medium",
      `Reading ease score is ${Math.round(score)} (Difficult)`,
      "Flesch Reading Ease of 30–50 is considered difficult, suitable for college students but not the general web audience.",
      "Simplify vocabulary and reduce average sentence length to improve comprehension. Target a score of 60+."
    )];
  }
  if (score < 60) {
    return [issue(
      "flesch-kincaid-fairly-hard", "readability", "Content", "low",
      `Reading ease score is ${Math.round(score)} (Fairly Difficult)`,
      "The copy is slightly harder than ideal for web audiences. Small improvements in sentence structure can significantly boost comprehension.",
      "Review and simplify the longest sentences. Consider using subheadings to break up dense sections."
    )];
  }
  return [];
}

function checkSentenceLength($: CheerioAPI): AuditIssue[] {
  const textNodes: string[] = [];
  $("p").each((_, el) => {
    const t = $(el).text().replace(/\s+/g, " ").trim();
    if (t.length > 20) textNodes.push(t);
  });

  if (textNodes.length < 2) return [];

  const combinedText = textNodes.join(" ");
  const avg = avgWordsPerSentence(combinedText);

  if (avg > 30) {
    return [issue(
      "sentence-length-very-long", "readability", "Content", "medium",
      `Average sentence length is ${Math.round(avg)} words (recommended: ≤20)`,
      "Very long sentences require readers to hold more information in working memory, reducing comprehension and increasing bounce rates.",
      "Break sentences over 25 words into two shorter sentences. Target an average of 15–20 words per sentence."
    )];
  }
  if (avg > 22) {
    return [issue(
      "sentence-length-long", "readability", "Content", "low",
      `Average sentence length is ${Math.round(avg)} words`,
      "Sentences averaging over 22 words are harder to parse, especially on mobile devices.",
      "Aim for an average of 15–20 words per sentence to improve reading flow."
    )];
  }
  return [];
}

function checkCtaPresence($: CheerioAPI): AuditIssue[] {
  const CTA_KEYWORDS = [
    "get started", "sign up", "try free", "start free", "start trial",
    "buy now", "shop now", "get access", "join now", "subscribe",
    "request demo", "book demo", "schedule demo", "contact us",
    "learn more", "see pricing", "view plans", "download",
  ];

  const allText = $("a, button").map((_, el) => $(el).text().toLowerCase()).get().join(" ");

  const hasCtaKeyword = CTA_KEYWORDS.some((kw) => allText.includes(kw));

  if (!hasCtaKeyword) {
    return [issue(
      "cta-presence", "readability", "Content", "medium",
      "No clear call-to-action detected on the page",
      "Pages without a primary CTA leave users without direction. Every landing page should guide visitors toward a specific goal: sign up, purchase, contact, or learn more.",
      "Add at least one prominent CTA button or link above the fold using action-oriented text (e.g., \"Get Started\", \"Try Free\", \"Book a Demo\")."
    )];
  }
  return [];
}

function checkTrustSignals($: CheerioAPI): AuditIssue[] {
  const allHrefs = $("a").map((_, el) => ($(el).attr("href") ?? "").toLowerCase()).get().join(" ");
  const allText = $("body").text().toLowerCase();

  const hasPrivacy = allHrefs.includes("privacy") || allText.includes("privacy policy");
  const hasTerms = allHrefs.includes("terms") || allText.includes("terms of service") || allText.includes("terms and conditions");

  const issues: AuditIssue[] = [];
  if (!hasPrivacy) {
    issues.push(issue(
      "trust-privacy", "readability", "Content", "medium",
      "No privacy policy link found",
      "Visitors—especially in regulated markets (EU, California)—expect a privacy policy before sharing personal data. Its absence erodes trust and may violate GDPR / CCPA.",
      "Add a clearly visible link to your privacy policy, at minimum in the footer."
    ));
  }
  if (!hasTerms) {
    issues.push(issue(
      "trust-terms", "readability", "Content", "low",
      "No terms of service link found",
      "The absence of terms can reduce conversion by making the product feel less legitimate, especially for SaaS and e-commerce pages.",
      "Link to your terms of service in the footer alongside the privacy policy."
    ));
  }
  return issues;
}

function checkOgTags($: CheerioAPI): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim();
  const ogDesc = $('meta[property="og:description"]').attr("content")?.trim();
  const ogImage = $('meta[property="og:image"]').attr("content")?.trim();

  if (!ogTitle) {
    issues.push(issue(
      "og-title", "readability", "Metadata", "low",
      "Missing og:title Open Graph tag",
      "Without og:title, social platforms generate their own headline when the page is shared, often choosing poorly.",
      "Add <meta property=\"og:title\" content=\"…\"> to the <head>."
    ));
  }
  if (!ogDesc) {
    issues.push(issue(
      "og-description", "readability", "Metadata", "low",
      "Missing og:description Open Graph tag",
      "Social previews will pull random page text as the description, reducing click-through rates from shared links.",
      "Add <meta property=\"og:description\" content=\"…\"> with a compelling 1–2 sentence summary."
    ));
  }
  if (!ogImage) {
    issues.push(issue(
      "og-image", "readability", "Metadata", "low",
      "Missing og:image Open Graph tag",
      "Pages shared without an OG image render with no visual preview on social platforms, significantly reducing engagement.",
      "Add <meta property=\"og:image\" content=\"…\"> pointing to a 1200×630px image."
    ));
  }
  return issues;
}

// ─── Performance checks ───────────────────────────────────────────────────────

function checkRenderBlockingScripts($: CheerioAPI): AuditIssue[] {
  let blocking = 0;
  $("head script[src]").each((_, el) => {
    const isAsync = $(el).attr("async") !== undefined;
    const isDeferred = $(el).attr("defer") !== undefined;
    const type = $(el).attr("type")?.trim().toLowerCase();
    if (!isAsync && !isDeferred && type !== "module") blocking++;
  });
  if (blocking === 0) return [];
  return [issue(
    "render-blocking-scripts", "performance", "Document",
    blocking >= 3 ? "high" : "medium",
    `${blocking} head script${blocking > 1 ? "s" : ""} may block page rendering`,
    `Synchronous scripts in <head> pause HTML parsing until the script loads and executes, directly increasing Time to First Contentful Paint (FCP).`,
    "Add defer or async to external scripts, or move them before </body>. Use type=\"module\" for ES module scripts."
  )];
}

function checkLargeDomSize($: CheerioAPI): AuditIssue[] {
  const count = $("*").length;
  if (count > 4000) {
    return [issue(
      "dom-size-large", "performance", "Document", "high",
      `DOM has ${count.toLocaleString()} elements — extremely large`,
      "Lighthouse flags DOMs over 1,500 nodes. Very large DOMs increase memory usage, style recalculation time, and layout reflow costs.",
      "Remove unnecessary wrapper divs, use virtual scrolling for long lists, and lazy-render off-screen sections."
    )];
  }
  if (count > 2500) {
    return [issue(
      "dom-size-large", "performance", "Document", "medium",
      `DOM has ${count.toLocaleString()} elements — large`,
      "Large DOMs slow style calculations and increase reflow times, particularly on lower-end devices.",
      "Audit deeply nested components and remove redundant wrapper elements."
    )];
  }
  if (count > 1500) {
    return [issue(
      "dom-size-large", "performance", "Document", "low",
      `DOM has ${count.toLocaleString()} elements — growing`,
      "DOM size is approaching Lighthouse's warning threshold of 1,500 nodes.",
      "Keep an eye on DOM growth as features are added. Flatten component trees where possible."
    )];
  }
  return [];
}

function checkLazyLoadedImages($: CheerioAPI): AuditIssue[] {
  let nonLazy = 0;
  $("img").each((i, el) => {
    if (i < 3) return; // first 3 images are likely above the fold
    const src = ($(el).attr("src") ?? "").toLowerCase();
    const loading = $(el).attr("loading")?.toLowerCase();
    const fetchpriority = $(el).attr("fetchpriority")?.toLowerCase();
    const w = Number($(el).attr("width"));
    const h = Number($(el).attr("height"));
    if (fetchpriority === "high" || src.includes(".svg") || src.startsWith("data:image/svg") ||
        (isFinite(w) && isFinite(h) && w <= 64 && h <= 64)) return;
    if (loading !== "lazy") nonLazy++;
  });
  if (nonLazy < 3) return [];
  return [issue(
    "images-lazy-loading", "performance", "Images",
    nonLazy >= 10 ? "high" : nonLazy >= 6 ? "medium" : "low",
    `${nonLazy} below-fold image${nonLazy > 1 ? "s are" : " is"} missing loading="lazy"`,
    "Eagerly loading offscreen images wastes bandwidth on initial page load, increasing LCP and data usage for mobile visitors.",
    `Add loading="lazy" to non-hero images. Keep the first 2–3 images eager-loaded to avoid LCP delays.`
  )];
}

function checkImageDimensions($: CheerioAPI): AuditIssue[] {
  let missing = 0;
  $("img").each((_, el) => {
    const src = ($(el).attr("src") ?? "").toLowerCase();
    if (src.includes(".svg") || src.startsWith("data:image/svg")) return;
    if (!$(el).attr("width") || !$(el).attr("height")) missing++;
  });
  if (missing < 3) return [];
  return [issue(
    "image-dimensions", "performance", "Images",
    missing >= 10 ? "high" : missing >= 6 ? "medium" : "low",
    `${missing} image${missing > 1 ? "s are" : " is"} missing explicit width/height attributes`,
    "Without dimensions, browsers cannot reserve space before the image loads, causing Cumulative Layout Shift (CLS).",
    "Add width and height attributes to every <img> matching the intrinsic image dimensions. CSS can then scale them responsively."
  )];
}

function checkLazyLoadedIframes($: CheerioAPI): AuditIssue[] {
  let nonLazy = 0;
  $("iframe").each((_, el) => {
    if (($(el).attr("loading") ?? "").toLowerCase() !== "lazy") nonLazy++;
  });
  if (nonLazy === 0) return [];
  return [issue(
    "iframes-lazy-loading", "performance", "Media",
    nonLazy >= 4 ? "high" : nonLazy >= 2 ? "medium" : "low",
    `${nonLazy} iframe${nonLazy > 1 ? "s" : ""} missing loading="lazy"`,
    "Embedded iframes (maps, videos, widgets) can trigger dozens of network requests on load. Deferring them significantly reduces initial page weight.",
    `Add loading="lazy" to all offscreen iframes.`
  )];
}

function checkStylesheetCount($: CheerioAPI): AuditIssue[] {
  const count = $('link[rel="stylesheet"]').length;
  if (count > 12) {
    return [issue(
      "stylesheet-count", "performance", "Document", "high",
      `Page loads ${count} external stylesheets`,
      "Each stylesheet is a separate blocking request. Large numbers of stylesheet requests significantly increase Time to First Byte and FCP.",
      "Bundle CSS into 1–2 files. Use critical-path CSS inlining and load non-critical styles asynchronously."
    )];
  }
  if (count > 8) {
    return [issue(
      "stylesheet-count", "performance", "Document", "medium",
      `Page loads ${count} external stylesheets`,
      "More than 8 stylesheet files is considered excessive and will increase render-blocking time.",
      "Consolidate stylesheets and consider inlining critical CSS."
    )];
  }
  if (count > 5) {
    return [issue(
      "stylesheet-count", "performance", "Document", "low",
      `Page loads ${count} external stylesheets`,
      "Review whether all stylesheet requests are necessary.",
      "Merge stylesheets where possible to reduce HTTP requests."
    )];
  }
  return [];
}

function checkResourceHints($: CheerioAPI): AuditIssue[] {
  const hasPreconnect = $('link[rel="preconnect"]').length > 0;
  const hasDnsPrefetch = $('link[rel="dns-prefetch"]').length > 0;
  const hasThirdParty = $('script[src*="google"], script[src*="cdn"], script[src*="stripe"], link[href*="google"], link[href*="cdnjs"]').length > 0;

  if (!hasPreconnect && !hasDnsPrefetch && hasThirdParty) {
    return [issue(
      "resource-hints", "performance", "Document", "low",
      "No resource hints (preconnect / dns-prefetch) for third-party origins",
      "Third-party scripts require DNS lookup, TCP connection, and TLS negotiation. Resource hints parallelise this with other requests, reducing latency.",
      "Add <link rel=\"preconnect\" href=\"https://third-party.example.com\"> for origins your page connects to. Use dns-prefetch as a fallback for older browsers."
    )];
  }
  return [];
}

function checkInlineScripts($: CheerioAPI): AuditIssue[] {
  const inlineScripts = $("script:not([src])").filter((_, el) => {
    const type = $(el).attr("type")?.toLowerCase() ?? "";
    return !type || type === "text/javascript" || type === "module";
  }).length;

  if (inlineScripts > 10) {
    return [issue(
      "inline-scripts", "performance", "Document", "medium",
      `Page contains ${inlineScripts} inline <script> blocks`,
      "Excessive inline scripts block the HTML parser and cannot be cached by the browser, increasing parse time on repeat visits.",
      "Extract recurring inline scripts into external .js files. Reserve inline scripts for critical path initialisation only."
    )];
  }
  if (inlineScripts > 5) {
    return [issue(
      "inline-scripts", "performance", "Document", "low",
      `Page contains ${inlineScripts} inline <script> blocks`,
      "Multiple inline scripts are harder to maintain and cannot benefit from browser caching.",
      "Consolidate inline scripts and extract them to external files where possible."
    )];
  }
  return [];
}

// ─── Check runner registry ────────────────────────────────────────────────────

const CHECK_RUNNERS: AuditCheckRunner[] = [
  // Accessibility
  { id: "images-alt",           type: "accessibility", maxDeduction: 30, run: ($ ) => checkImagesAlt($)             },
  { id: "buttons-label",        type: "accessibility", maxDeduction: 20, run: ($) => checkButtons($)                },
  { id: "inputs-label",         type: "accessibility", maxDeduction: 35, run: ($) => checkInputs($)                 },
  { id: "links-name",           type: "accessibility", maxDeduction: 20, run: ($) => checkLinks($)                  },
  { id: "document-language",    type: "accessibility", maxDeduction: 15, run: ($) => checkDocumentLanguage($)       },
  { id: "links-action",         type: "accessibility", maxDeduction: 20, run: ($) => checkBrokenActionLinks($)      },
  { id: "main-landmark",        type: "accessibility", maxDeduction: 15, run: ($) => checkMainLandmark($)           },
  { id: "landmark-regions",     type: "accessibility", maxDeduction: 15, run: ($) => checkLandmarkRegions($)        },
  { id: "iframes-title",        type: "accessibility", maxDeduction: 30, run: ($) => checkIframesTitle($)           },
  { id: "media-controls",       type: "accessibility", maxDeduction: 20, run: ($) => checkMediaControls($)          },
  { id: "forms-submit",         type: "accessibility", maxDeduction: 20, run: ($) => checkFormSubmitButtons($)      },
  { id: "color-contrast",       type: "accessibility", maxDeduction: 30, run: ($) => checkColorContrast($)          },
  { id: "skip-link",            type: "accessibility", maxDeduction: 15, run: ($) => checkSkipLink($)               },
  { id: "positive-tabindex",    type: "accessibility", maxDeduction: 20, run: ($) => checkPositiveTabindex($)       },
  { id: "viewport-meta",        type: "accessibility", maxDeduction: 25, run: ($) => checkViewportMeta($)           },
  { id: "table-headers",        type: "accessibility", maxDeduction: 20, run: ($) => checkTableHeaders($)           },
  { id: "focus-outline",        type: "accessibility", maxDeduction: 20, run: ($ , html) => checkFocusOutline($, html) },
  // Readability
  { id: "paragraph-length",     type: "readability",   maxDeduction: 15, run: ($) => checkParagraphLength($)        },
  { id: "page-title",           type: "readability",   maxDeduction: 30, run: ($) => checkPageTitle($)              },
  { id: "title-length",         type: "readability",   maxDeduction: 10, run: ($) => checkTitleLength($)            },
  { id: "heading-structure",    type: "readability",   maxDeduction: 25, run: ($) => checkHeadingStructure($)       },
  { id: "meta-description",     type: "readability",   maxDeduction: 10, run: ($) => checkMetaDescription($)        },
  { id: "heading-text",         type: "readability",   maxDeduction: 20, run: ($) => checkHeadingText($)            },
  { id: "empty-lists",          type: "readability",   maxDeduction: 10, run: ($) => checkEmptyLists($)             },
  { id: "page-length",          type: "readability",   maxDeduction: 5,  run: ($) => checkPageLength($)             },
  { id: "flesch-kincaid",       type: "readability",   maxDeduction: 20, run: ($) => checkFleschKincaid($)          },
  { id: "sentence-length",      type: "readability",   maxDeduction: 10, run: ($) => checkSentenceLength($)         },
  { id: "cta-presence",         type: "readability",   maxDeduction: 15, run: ($) => checkCtaPresence($)            },
  { id: "trust-signals",        type: "readability",   maxDeduction: 15, run: ($) => checkTrustSignals($)           },
  { id: "og-tags",              type: "readability",   maxDeduction: 10, run: ($) => checkOgTags($)                 },
  // Performance
  { id: "render-blocking-scripts", type: "performance", maxDeduction: 30, run: ($) => checkRenderBlockingScripts($) },
  { id: "dom-size",             type: "performance",   maxDeduction: 25, run: ($) => checkLargeDomSize($)           },
  { id: "images-lazy-loading",  type: "performance",   maxDeduction: 20, run: ($) => checkLazyLoadedImages($)       },
  { id: "image-dimensions",     type: "performance",   maxDeduction: 10, run: ($) => checkImageDimensions($)        },
  { id: "iframes-lazy-loading", type: "performance",   maxDeduction: 20, run: ($) => checkLazyLoadedIframes($)      },
  { id: "stylesheet-count",     type: "performance",   maxDeduction: 10, run: ($) => checkStylesheetCount($)        },
  { id: "resource-hints",       type: "performance",   maxDeduction: 10, run: ($) => checkResourceHints($)          },
  { id: "inline-scripts",       type: "performance",   maxDeduction: 15, run: ($) => checkInlineScripts($)          },
];

// ─── Audit adapter ────────────────────────────────────────────────────────────

export class FullUxAuditAdapter implements UxAuditAdapter {
  async runAudit(input: AuditRequest): Promise<AuditReport> {
    const $ = load(input.html);
    const enabledChecks = new Set(
      (input.selectedChecks ?? AUDIT_CHECK_IDS).filter((id) => AUDIT_CHECK_IDS.includes(id))
    );

    const results = CHECK_RUNNERS.flatMap<CheckResult>((check) => {
      if (!enabledChecks.has(check.id)) return [];
      return [{ type: check.type, maxDeduction: check.maxDeduction, issues: check.run($, input.html) }];
    });

    const allIssues = results.flatMap((r) => r.issues);
    const accessibility = calculateCategoryScore(results, "accessibility") ?? 100;
    const readability   = calculateCategoryScore(results, "readability")   ?? 100;
    const performance   = calculateCategoryScore(results, "performance")   ?? 100;
    const score = Math.round((accessibility + readability + performance) / 3);

    return {
      urlOrSnapshotId: input.urlOrSnapshotId,
      score,
      categoryScores: { accessibility, readability, performance },
      findings: allIssues.map(toAuditFinding),
      generatedAt: new Date().toISOString(),
    };
  }
}

export function createUxAuditAdapter(): UxAuditAdapter {
  return new FullUxAuditAdapter();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toAuditFinding(issue: AuditIssue): AuditFinding {
  return {
    id: issue.id,
    category: issue.type,
    severity: issue.severity,
    title: issue.message,
    description: issue.detail,
    recommendation: issue.suggestion,
  };
}

function calculateCheckDeduction(issues: AuditIssue[], maxDeduction: number): number {
  const total = issues.reduce((sum, i) => sum + SEVERITY_DEDUCTION[i.severity], 0);
  return Math.min(total, maxDeduction);
}

function calculateCategoryScore(results: CheckResult[], type: AuditCategory): number | null {
  const cat = results.filter((r) => r.type === type);
  if (cat.length === 0) return null;
  const maxDeduction = cat.reduce((s, r) => s + r.maxDeduction, 0);
  const actual = cat.reduce((s, r) => s + calculateCheckDeduction(r.issues, r.maxDeduction), 0);
  return Math.max(0, Math.round(100 - (actual / maxDeduction) * 100));
}

export * from "./audit-gates";
