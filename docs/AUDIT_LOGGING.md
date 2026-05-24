# Structured Audit Logging (PS-601A)

## Purpose
Provide centralized, append-only, tamper-evident audit logs for security-critical events.

## Module
- `packages/agent-runtime/src/audit-log.ts`

## Log Format
Each event contains:
- `id`
- `timestamp`
- `correlationId`
- `actor`
- `action`
- `resourceType`
- `resourceId`
- `metadata`
- `previousHash`
- `hash`

## Storage
- Directory: `.audit-log/`
- Events file: `.audit-log/events.ndjson`
- Index file: `.audit-log/index.json`

## Integrity Model
- Hash-chain per record (`previousHash` -> `hash`)
- `verifyIntegrity()` recomputes hashes and chain continuity
- Any mutation breaks chain validation

## API
- `createAuditLogStore(options)`
- `append(event)`
- `list(limit?)`
- `listByCorrelationId(correlationId)`
- `verifyIntegrity()`
- `exportEntries()`
- `enforceRetention(retainDays)`

## Integration Guidance
1. Emit audit events for all approval, rejection, role-sensitive actions, and export gates.
2. Include `correlationId` from workflow runs.
3. Run periodic integrity checks and alert on failures.
4. Replicate/ship logs to immutable external storage for production.

## Protected API Endpoints
- `GET /api/protected/audit/export`
  - Full export including integrity summary.
- `GET /api/protected/audit/export?correlationId=<id>`
  - Filtered export for a specific correlation ID.
- `POST /api/protected/audit/retention`
  - Body: `{ "retainDays": number }`
  - Applies retention cleanup and returns removed/remaining counts.
