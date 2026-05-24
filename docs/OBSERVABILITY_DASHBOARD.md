# Stage/Prod Dashboard Baseline (PS-602B)

This ticket wires SLO evaluation into the Studio UI so teams can inspect reliability state per run stream.

## Implemented

- Added `SLO Dashboard` section to `apps/studio-web/app/page.tsx`.
- Dashboard surfaces:
  - P95 latency
  - Success rate
  - Availability
  - Overall status (`healthy`/`breached`)
  - Active breach list with severity and message
  - Alert preview with routed channels (pager/slack/email policy)
- Uses shared runtime evaluator `evaluateSloWindow(...)` from `@product-studio/agent-runtime`.

## Notes

- Current data source is local run history metrics to validate UX and breach rendering.
- Next step for production:
  - feed values from real telemetry pipeline (traces + request outcomes),
  - back dashboard with stage/prod metric stores,
  - wire `critical` breaches to pager integration.
