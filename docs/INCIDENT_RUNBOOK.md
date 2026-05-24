# Incident Response Runbook (PS-603)

This runbook defines first-response actions for Product Studio pipeline incidents.

## Severity Levels

- `SEV-1`: Full production outage or security incident with active exploit risk.
- `SEV-2`: Major degradation (high failure rate, export blocked, critical SLO breach).
- `SEV-3`: Partial degradation with workaround available.

## Ownership

- Incident Commander (IC): coordinates response and decisions.
- Operations Lead: executes mitigation and rollback.
- Communications Lead: posts status updates and timeline.
- Domain Engineer: investigates root cause in affected subsystem.

## Failure Classes and Triage

### 1) Pipeline Validation Failures

Signals:
- Spike in `schema_task_failed` logs.
- SLO success-rate breach.

Immediate actions:
1. Verify latest deploy/version and compare failure onset timestamp.
2. Pull affected run IDs and inspect schema failure payload previews.
3. Roll back to last known good build if regressions correlate to recent deploy.

Containment:
1. Temporarily disable failing stage retries above safe limit to reduce load amplification.
2. Route new runs into review/hold mode if downstream artifacts are unsafe.

### 2) Workflow State Corruption / Stuck Runs

Signals:
- Runs stuck in non-terminal states.
- Transition errors (`Invalid transition` or approval gating faults).

Immediate actions:
1. Query run records by `runId` and `correlationId`.
2. Validate event sequence ordering and identify last valid state.
3. Use controlled rollback/recovery procedure to requeue from last valid state.

Containment:
1. Pause new run creation for affected project/workspace if corruption is widespread.
2. Increase audit logging verbosity for workflow operations.

### 3) Rendering/Snapshot Failures

Signals:
- Elevated snapshot/render errors.
- Audit stage blocked due to missing snapshots.

Immediate actions:
1. Check target URL allowlist and SSRF guardrail rejects.
2. Verify renderer runtime health and sandbox constraints.
3. Retry with known-good fixture to isolate infra vs payload issue.

Containment:
1. Fallback to prior stable renderer configuration.
2. Queue failed render jobs for delayed retry after mitigation.

### 4) Security Guardrail Triggers

Signals:
- Increased `block` decisions from output safety.
- Repeated suspicious input patterns across requests.

Immediate actions:
1. Confirm whether trigger spike is malicious traffic or false positives.
2. Rate-limit offending identities/IPs where available.
3. Preserve relevant immutable audit logs for investigation.

Containment:
1. Tighten temporary policy rules for high-risk patterns.
2. Force manual approval path for impacted content categories.

## Standard Incident Workflow

1. Detect and declare incident with severity and start time.
2. Assign IC and owners; open incident channel.
3. Establish blast radius (users, workflows, environments).
4. Apply containment/mitigation; confirm system stabilization.
5. Communicate updates every 15 minutes for SEV-1/SEV-2.
6. Close incident only after recovery criteria are met.
7. Complete postmortem within 48 hours.

## Recovery Criteria

- SLO indicators return within target bands for two consecutive windows.
- Error logs drop below normal thresholds.
- No new critical security findings related to incident.
- Backlogged runs are drained or safely rescheduled.

## Postmortem Template

- Summary
- Timeline (UTC with exact timestamps)
- Root cause
- Contributing factors
- Customer impact
- Detection gaps
- Corrective actions (owner + due date)

## Game Day Checklist

1. Run one validation-failure simulation.
2. Run one stuck-workflow simulation.
3. Run one renderer-failure simulation.
4. Validate alert routing and on-call acknowledgement times.
5. Record gaps and convert each into backlog tickets.
