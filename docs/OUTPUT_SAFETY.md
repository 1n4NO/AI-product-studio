# Output Sanitization and Malicious Content Checks (PS-502B)

## Purpose
Reduce risk from unsafe generated output before persistence, rendering, or export.

## Module
- `packages/agent-runtime/src/output-safety.ts`

## Capabilities
- `sanitizeTextOutput(text)`
  - strips control characters
  - normalizes whitespace
- `sanitizeHtmlOutput(html)`
  - removes script-like active content (`script`, `iframe`, `object`, `embed`, `link`, `meta`)
  - removes inline event handlers (`onclick=...` etc)
  - removes `javascript:` URLs from `href`/`src`
- `analyzeOutputSafety({ text, html })`
  - scans for high/medium-risk patterns
  - returns decision: `allow` | `review` | `block`
  - returns findings + sanitized output

## Decision Policy
- `block`: any high-severity match
- `review`: medium-severity match and no high match
- `allow`: no findings

## Integration Guidance
1. Run `analyzeOutputSafety` on generated content before storing artifacts.
2. Block export/publish when decision is `block`.
3. Require human approval when decision is `review`.
4. Persist findings in run audit trail.

## Notes
- Pattern-based checks are a baseline, not complete protection.
- Combine with schema validation, authz, and audit gating for layered defense.
