# Workflow Orchestration (PS-202)

## State Machine
- `brief_received`
- `blueprint_generated`
- `awaiting_approval` (optional checkpoint)
- `draft_generated`
- `audit_completed`
- `fixes_applied`
- `export_ready`
- `failed`

## Deterministic Transitions
Only predefined transitions are allowed; invalid transitions throw explicit errors.

## Resumability
- Every run is persisted as `.runs/<run-id>.json`.
- Run IDs are indexed in `.runs/index.json`.
- Restart-safe: run state/event log can be reloaded and resumed.

## Approval Checkpoint
- If `requiresApproval=true`, run must pass through `awaiting_approval`.
- `grantApproval(runId, approverId)` records approval event and resumes execution.

## Structured Event Logging
Each event includes:
- `correlationId`
- `timestamp`
- `fromState` -> `toState`
- optional metadata (`step`, `reason`, `approverId`)

## Failure Handling
`markStepFailed(runId, step, reason)` transitions run to `failed` with durable failure event.
