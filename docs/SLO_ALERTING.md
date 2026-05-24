# SLOs, Alerts, and Dashboards Baseline (PS-602A)

This ticket introduces a code-level SLO evaluator to standardize breach detection for pipeline reliability.

## Implemented

- `packages/agent-runtime/src/slo.ts`
  - SLO target model:
    - `p95LatencyMs`
    - `successRate`
    - `availability`
  - Sliding window metrics input model:
    - total, successful, and available request counts
    - p95 latency for the window
  - Deterministic breach evaluator:
    - returns `ok` or list of breaches
    - severity levels: `warning`, `critical`
    - explicit breach messages for pager/alert payloads
- Exported via `packages/agent-runtime/src/index.ts`.

## Default targets

- `p95LatencyMs`: `3000`
- `successRate`: `0.99`
- `availability`: `0.995`

These are initial defaults for stage/prod and should be adjusted by observed baseline traffic.

## Alerting guidance

- Trigger `warning` when any single indicator breaches target.
- Trigger `critical` pager alert when:
  - latency is >= 25% above target, or
  - success/availability miss target by >= 2 percentage points.

## Dashboard minimum panels

- P95 latency over time
- Success rate over time
- Availability over time
- Breach count by severity (warning/critical)
