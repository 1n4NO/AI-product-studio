# Alert Routing Baseline (PS-602C)

Added shared alert payload and routing primitives for SLO breach handling.

## Added

- `packages/agent-runtime/src/alerts.ts`
  - `createSloAlert(...)` to format structured SLO breach alerts
  - `routeAlert(...)` for baseline channel selection
- `packages/agent-runtime/test/alerts.test.ts`
  - payload formatting and routing behavior coverage

## Routing policy

- `critical` -> `pager`, `slack`, `email`
- `warning` -> `slack`

## Next step

- Wire to real provider integrations (PagerDuty/Slack webhook/email transport).
