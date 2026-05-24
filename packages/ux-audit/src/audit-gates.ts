import type { AuditFinding, AuditReport } from "@product-studio/shared-types";

export interface AuditGateThresholds {
  overallMinScore: number;
  accessibilityMinScore: number;
  readabilityMinScore: number;
  performanceMinScore: number;
}

export interface RegressionPolicy {
  maxOverallDrop: number;
  maxAccessibilityDrop: number;
  maxReadabilityDrop: number;
  maxPerformanceDrop: number;
}

export interface AuditGateConfig {
  thresholds: AuditGateThresholds;
  regression: RegressionPolicy;
  failOnCriticalAccessibility: boolean;
  failOnHighAccessibility: boolean;
}

export interface GateViolation {
  code:
    | "overall_below_threshold"
    | "accessibility_below_threshold"
    | "readability_below_threshold"
    | "performance_below_threshold"
    | "critical_accessibility_finding"
    | "high_accessibility_finding"
    | "overall_regression"
    | "accessibility_regression"
    | "readability_regression"
    | "performance_regression";
  message: string;
  value?: number;
  threshold?: number;
}

export interface AuditGateResult {
  passed: boolean;
  violations: GateViolation[];
  summary: string;
}

export const DEFAULT_AUDIT_GATE_CONFIG: AuditGateConfig = {
  thresholds: {
    overallMinScore: 80,
    accessibilityMinScore: 85,
    readabilityMinScore: 75,
    performanceMinScore: 70
  },
  regression: {
    maxOverallDrop: 2,
    maxAccessibilityDrop: 2,
    maxReadabilityDrop: 3,
    maxPerformanceDrop: 3
  },
  failOnCriticalAccessibility: true,
  failOnHighAccessibility: false
};

export function evaluateAuditGate(
  current: AuditReport,
  baseline: AuditReport | null,
  config: AuditGateConfig = DEFAULT_AUDIT_GATE_CONFIG
): AuditGateResult {
  const violations: GateViolation[] = [];

  checkThreshold(current.score, config.thresholds.overallMinScore, "overall_below_threshold", "Overall score below threshold", violations);
  checkThreshold(
    current.categoryScores.accessibility,
    config.thresholds.accessibilityMinScore,
    "accessibility_below_threshold",
    "Accessibility score below threshold",
    violations
  );
  checkThreshold(
    current.categoryScores.readability,
    config.thresholds.readabilityMinScore,
    "readability_below_threshold",
    "Readability score below threshold",
    violations
  );
  checkThreshold(
    current.categoryScores.performance,
    config.thresholds.performanceMinScore,
    "performance_below_threshold",
    "Performance score below threshold",
    violations
  );

  if (config.failOnCriticalAccessibility && hasAccessibilityFinding(current.findings, "critical")) {
    violations.push({
      code: "critical_accessibility_finding",
      message: "Critical accessibility finding detected"
    });
  }

  if (config.failOnHighAccessibility && hasAccessibilityFinding(current.findings, "high")) {
    violations.push({
      code: "high_accessibility_finding",
      message: "High severity accessibility finding detected"
    });
  }

  if (baseline) {
    checkRegression(
      baseline.score,
      current.score,
      config.regression.maxOverallDrop,
      "overall_regression",
      "Overall score regressed beyond allowed delta",
      violations
    );
    checkRegression(
      baseline.categoryScores.accessibility,
      current.categoryScores.accessibility,
      config.regression.maxAccessibilityDrop,
      "accessibility_regression",
      "Accessibility score regressed beyond allowed delta",
      violations
    );
    checkRegression(
      baseline.categoryScores.readability,
      current.categoryScores.readability,
      config.regression.maxReadabilityDrop,
      "readability_regression",
      "Readability score regressed beyond allowed delta",
      violations
    );
    checkRegression(
      baseline.categoryScores.performance,
      current.categoryScores.performance,
      config.regression.maxPerformanceDrop,
      "performance_regression",
      "Performance score regressed beyond allowed delta",
      violations
    );
  }

  return {
    passed: violations.length === 0,
    violations,
    summary: violations.length === 0 ? "Audit gate passed" : `Audit gate failed with ${violations.length} violation(s)`
  };
}

function checkThreshold(
  value: number,
  min: number,
  code: GateViolation["code"],
  message: string,
  out: GateViolation[]
): void {
  if (value < min) {
    out.push({ code, message, value, threshold: min });
  }
}

function checkRegression(
  baselineValue: number,
  currentValue: number,
  maxDrop: number,
  code: GateViolation["code"],
  message: string,
  out: GateViolation[]
): void {
  const drop = baselineValue - currentValue;
  if (drop > maxDrop) {
    out.push({ code, message, value: drop, threshold: maxDrop });
  }
}

function hasAccessibilityFinding(findings: AuditFinding[], severity: "critical" | "high"): boolean {
  return findings.some((finding) => finding.category === "accessibility" && finding.severity === severity);
}
