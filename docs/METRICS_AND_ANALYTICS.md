# Metrics and Analytics Baseline (PS-901)

Implemented baseline funnel analytics primitives for Product Studio.

## Added

- `packages/agent-runtime/src/analytics.ts`
  - `computeFunnelMetrics(...)` for:
    - blueprint conversion rate
    - draft conversion rate
    - audit pass rate
    - export conversion rate
    - average time-to-draft (ms)
- `packages/agent-runtime/test/analytics.test.ts`
  - conversion math validation
  - zero-denominator safety checks

## Intended use

- Feed with aggregated run lifecycle counters from workflow/audit services.
- Publish resulting KPIs to stage/prod dashboards.
- Track trendline for conversion efficiency and speed-to-draft.
