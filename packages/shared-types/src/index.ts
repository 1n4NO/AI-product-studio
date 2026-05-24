export type Tone = "professional" | "friendly" | "bold" | "playful" | "minimal";

export interface Brief {
  productName: string;
  audience: string;
  valueProposition: string;
  tone: Tone;
  constraints: string[];
  ctaGoal: string;
}

export interface PageSection {
  id: string;
  type: "hero" | "problem" | "solution" | "features" | "social-proof" | "faq" | "cta";
  intent: string;
  requiredComponents: string[];
}

export interface PageBlueprint {
  title: string;
  summary: string;
  sections: PageSection[];
}

export interface ThemeTokenScale {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface ThemeTokens {
  name: string;
  colors: Record<string, string>;
  typography: ThemeTokenScale;
  spacing: ThemeTokenScale;
  radii: ThemeTokenScale;
  shadows: Record<string, string>;
  motion: {
    fast: string;
    normal: string;
    slow: string;
  };
}

export type FindingSeverity = "low" | "medium" | "high" | "critical";

export interface AuditFinding {
  id: string;
  category: "accessibility" | "readability" | "performance";
  severity: FindingSeverity;
  title: string;
  description: string;
  recommendation: string;
}

export interface AuditReport {
  urlOrSnapshotId: string;
  score: number;
  categoryScores: {
    accessibility: number;
    readability: number;
    performance: number;
  };
  findings: AuditFinding[];
  generatedAt: string;
}

export function isBrief(value: unknown): value is Brief {
  if (!isObject(value)) return false;
  return (
    isString(value.productName) &&
    isString(value.audience) &&
    isString(value.valueProposition) &&
    isTone(value.tone) &&
    isStringArray(value.constraints) &&
    isString(value.ctaGoal)
  );
}

export function isPageBlueprint(value: unknown): value is PageBlueprint {
  if (!isObject(value)) return false;
  return (
    isString(value.title) &&
    isString(value.summary) &&
    Array.isArray(value.sections) &&
    value.sections.every(isPageSection)
  );
}

export function isThemeTokens(value: unknown): value is ThemeTokens {
  if (!isObject(value)) return false;
  return (
    isString(value.name) &&
    isRecordOfStrings(value.colors) &&
    isThemeTokenScale(value.typography) &&
    isThemeTokenScale(value.spacing) &&
    isThemeTokenScale(value.radii) &&
    isRecordOfStrings(value.shadows) &&
    isObject(value.motion) &&
    isString(value.motion.fast) &&
    isString(value.motion.normal) &&
    isString(value.motion.slow)
  );
}

export function isAuditReport(value: unknown): value is AuditReport {
  if (!isObject(value)) return false;
  return (
    isString(value.urlOrSnapshotId) &&
    isNumber(value.score) &&
    isObject(value.categoryScores) &&
    isNumber(value.categoryScores.accessibility) &&
    isNumber(value.categoryScores.readability) &&
    isNumber(value.categoryScores.performance) &&
    Array.isArray(value.findings) &&
    value.findings.every(isAuditFinding) &&
    isString(value.generatedAt)
  );
}

function isPageSection(value: unknown): value is PageSection {
  if (!isObject(value)) return false;
  return (
    isString(value.id) &&
    isSectionType(value.type) &&
    isString(value.intent) &&
    isStringArray(value.requiredComponents)
  );
}

function isAuditFinding(value: unknown): value is AuditFinding {
  if (!isObject(value)) return false;
  return (
    isString(value.id) &&
    isCategory(value.category) &&
    isFindingSeverity(value.severity) &&
    isString(value.title) &&
    isString(value.description) &&
    isString(value.recommendation)
  );
}

function isThemeTokenScale(value: unknown): value is ThemeTokenScale {
  if (!isObject(value)) return false;
  return (
    isString(value.xs) &&
    isString(value.sm) &&
    isString(value.md) &&
    isString(value.lg) &&
    isString(value.xl)
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isRecordOfStrings(value: unknown): value is Record<string, string> {
  return isObject(value) && Object.values(value).every(isString);
}

function isTone(value: unknown): value is Tone {
  return value === "professional" || value === "friendly" || value === "bold" || value === "playful" || value === "minimal";
}

function isSectionType(value: unknown): value is PageSection["type"] {
  return (
    value === "hero" ||
    value === "problem" ||
    value === "solution" ||
    value === "features" ||
    value === "social-proof" ||
    value === "faq" ||
    value === "cta"
  );
}

function isCategory(value: unknown): value is AuditFinding["category"] {
  return value === "accessibility" || value === "readability" || value === "performance";
}

function isFindingSeverity(value: unknown): value is FindingSeverity {
  return value === "low" || value === "medium" || value === "high" || value === "critical";
}
