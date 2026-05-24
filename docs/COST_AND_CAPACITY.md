# Cost and Capacity Controls (PS-802)

Baseline quota and throttling primitives are now implemented in runtime.

## Added

- `packages/agent-runtime/src/cost-controls.ts`
  - workspace quota evaluation:
    - token budget per period
    - run count budget per period
  - request throttling evaluation:
    - fixed-window request limit
    - `retryAfterSeconds` output
- tests:
  - `packages/agent-runtime/test/cost-controls.test.ts`
- `packages/agent-runtime/src/budget-alerts.ts`
  - threshold evaluator for 70/85/100% budget usage alerts
- tests:
  - `packages/agent-runtime/test/budget-alerts.test.ts`

## Intended integration

- Evaluate quota before run creation.
- Evaluate rate limits at API ingress.
- Emit structured audit/observability events for denied requests.

## Next hardening

- Replace in-memory counters with persistent per-workspace usage store.
- Add admin controls for per-workspace overrides.
