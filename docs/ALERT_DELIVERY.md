# Alert Delivery Baseline (PS-602E)

Added pluggable alert delivery primitives and a protected dry-run dispatch endpoint.

## Added

- `packages/agent-runtime/src/alerts.ts`
  - `AlertTransport` interface
  - `dispatchAlert(...)`
  - `dryRunTransport` baseline adapter
- `apps/studio-web/app/api/protected/alerts/dispatch/route.ts`
  - `POST /api/protected/alerts/dispatch`
  - Creates SLO alert, computes route, executes dry-run dispatch

## Purpose

- Validate channel routing and payload shape end-to-end before integrating real providers.
