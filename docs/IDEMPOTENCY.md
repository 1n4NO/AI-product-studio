# Idempotency Strategy (PS-203)

## Objective
Prevent duplicate artifact/run side effects when clients retry the same API call.

## Storage
- Local durable store: `.idempotency/`
- One record per idempotency key
- Record states: `in_progress` | `completed`

## Request Contract
- `key`: client-provided idempotency key
- `operation`: logical operation name (for example `generate_blueprint`)
- `fingerprint`: stable hash/string of request payload

## Behavior
- New key: reserve as `in_progress`, execute handler, persist response as `completed`.
- Same key + same fingerprint:
  - if `completed`: return stored response (replay-safe)
  - if `in_progress`: return in-progress conflict
- Same key + different fingerprint: return conflict

## Conflict Semantics
- `conflict`: key reused for different request payload/operation
- `in_progress`: same request is currently executing

## API Surface
- `createIdempotencyStore(options)`
- `lookup(request)`
- `begin(request)`
- `complete(request, response)`
- `executeIdempotent({ store, request, execute })`

## Notes
- For production, replace local store with DB-backed implementation using unique indexes on key.
- Recommended response mapping:
  - replay hit: HTTP 200 + replay flag
  - in progress: HTTP 409
  - payload conflict: HTTP 409
