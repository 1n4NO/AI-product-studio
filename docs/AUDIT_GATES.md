# Audit Baselines and Regression Gates (PS-302)

## Purpose
Enforce minimum quality bars and prevent score regressions between baseline and current audit runs.

## Gate Inputs
- `current`: latest `AuditReport`
- `baseline`: previous `AuditReport` (optional)
- `config`: thresholds + regression policy

## Default Thresholds
- Overall >= 80
- Accessibility >= 85
- Readability >= 75
- Performance >= 70

## Regression Policy (max allowed drop)
- Overall: 2
- Accessibility: 2
- Readability: 3
- Performance: 3

## Critical Fail Conditions
- Fail if a critical accessibility finding exists (`failOnCriticalAccessibility=true`)
- Optional fail on high accessibility findings (`failOnHighAccessibility=true`)

## API
- `evaluateAuditGate(current, baseline, config?)`
- `DEFAULT_AUDIT_GATE_CONFIG`

## Result Model
- `passed: boolean`
- `violations: GateViolation[]`
- `summary: string`

## Intended Export Blocking
Call `evaluateAuditGate(...)` before export. If `passed=false`, block export and surface violations to users.
