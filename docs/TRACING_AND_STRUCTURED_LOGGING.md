# Tracing and Structured Logging (PS-601B)

This ticket adds baseline trace context and structured logs for runtime pipeline stages.

## What was added

- `packages/agent-runtime/src/observability.ts`
  - Trace primitives: `traceId`, `spanId`, parent span linkage.
  - `withSpan(...)` helper for start/completion/failure span logs.
  - JSON logger contract (`StructuredLogger`) for central log sinks.
- `packages/agent-runtime/src/workflow-runner.ts`
  - Structured logs for run creation, state transition, approval requests, approvals, and failures.
  - Every log includes `runId` and `correlationId` so errors are searchable per run.
- `packages/agent-runtime/src/schema-pipeline.ts`
  - Optional tracing/logger context for schema task retries.
  - Attempt-level logs and final failure log.

## Structured log shape

```json
{
  "timestamp": "2026-05-24T12:00:00.000Z",
  "level": "info",
  "message": "workflow_transition_completed",
  "traceId": "f95c0e7f3e7043b6a2dcf111f6dc2f51",
  "spanId": "2c55fa1908f51281",
  "runId": "run_123",
  "correlationId": "corr_123",
  "component": "workflow-runner",
  "metadata": {
    "fromState": "brief_received",
    "toState": "blueprint_generated"
  }
}
```

## Notes

- This is a lightweight runtime tracing baseline aligned to OpenTelemetry concepts.
- Next step for full OTel compatibility: bind `traceId`/`spanId` to a configured OpenTelemetry SDK exporter in stage/prod.
