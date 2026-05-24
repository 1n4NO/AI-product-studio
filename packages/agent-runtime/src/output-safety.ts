export type SafetySeverity = "low" | "medium" | "high";

export interface SafetyFinding {
  id: string;
  severity: SafetySeverity;
  message: string;
  matchedText: string;
}

export interface OutputSafetyResult {
  decision: "allow" | "review" | "block";
  findings: SafetyFinding[];
  sanitizedText?: string;
  sanitizedHtml?: string;
}

const MALICIOUS_PATTERNS: Array<{ id: string; severity: SafetySeverity; pattern: RegExp; message: string }> = [
  {
    id: "prompt-injection-ignore-instructions",
    severity: "high",
    pattern: /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
    message: "Potential prompt-injection instruction override"
  },
  {
    id: "credential-exfiltration-request",
    severity: "high",
    pattern: /(api[_-]?key|token|password|secret)\s*(=|:|is)?\s*["']?[a-z0-9_\-]{12,}/i,
    message: "Potential credential-like secret exposure"
  },
  {
    id: "javascript-uri",
    severity: "medium",
    pattern: /javascript:/i,
    message: "Potential script protocol injection"
  },
  {
    id: "inline-event-handler",
    severity: "medium",
    pattern: /on[a-z]+\s*=\s*["']/i,
    message: "Potential inline script event handler"
  },
  {
    id: "data-exfiltration-instruction",
    severity: "high",
    pattern: /(send|post|upload|exfiltrate).{0,40}(secrets|credentials|tokens|keys)/i,
    message: "Potential data exfiltration instruction"
  }
];

export function sanitizeTextOutput(input: string): string {
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeHtmlOutput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<(iframe|object|embed|link|meta)\b[^>]*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/\s(href|src)\s*=\s*"javascript:[^"]*"/gi, "")
    .replace(/\s(href|src)\s*=\s*'javascript:[^']*'/gi, "");
}

export function analyzeOutputSafety(input: { text?: string; html?: string }): OutputSafetyResult {
  const findings: SafetyFinding[] = [];
  const source = `${input.text ?? ""}\n${input.html ?? ""}`;

  for (const rule of MALICIOUS_PATTERNS) {
    const match = source.match(rule.pattern);
    if (match && match[0]) {
      findings.push({
        id: rule.id,
        severity: rule.severity,
        message: rule.message,
        matchedText: match[0]
      });
    }
  }

  const hasHigh = findings.some((f) => f.severity === "high");
  const hasMedium = findings.some((f) => f.severity === "medium");

  const decision: OutputSafetyResult["decision"] = hasHigh ? "block" : hasMedium ? "review" : "allow";

  return {
    decision,
    findings,
    sanitizedText: input.text ? sanitizeTextOutput(input.text) : undefined,
    sanitizedHtml: input.html ? sanitizeHtmlOutput(input.html) : undefined
  };
}
