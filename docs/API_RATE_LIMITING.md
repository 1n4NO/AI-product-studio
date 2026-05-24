# API Rate Limiting Baseline (PS-802C)

Protected API endpoints now include fixed-window request throttling.

## Scope

- Applied in `apps/studio-web/middleware.ts`
- Active for: `/api/protected/*`
- Keyed by: `client_ip + pathname`

## Defaults

- `PROTECTED_API_RATE_LIMIT_MAX=60`
- `PROTECTED_API_RATE_LIMIT_WINDOW_SECONDS=60`

## Response behavior

- On breach, returns HTTP `429` with:
  - JSON body: `error`, `retryAfterSeconds`
  - `Retry-After` response header

## Notes

- Current store is in-memory and process-local.
- For production multi-instance deployments, replace with shared backend (Redis/DB) to ensure consistent enforcement.
