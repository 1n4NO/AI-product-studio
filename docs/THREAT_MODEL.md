# Threat Model and Security Controls (PS-501)

## Scope
Product Studio web app and core services:
- `studio-web` (UI + API routes)
- `agent-runtime`
- `ux-audit`
- local artifact/snapshot/idempotency stores (`.artifacts`, `.runs`, `.snapshots`, `.idempotency`)

## Assets
- User session cookies (`ps_session`)
- Auth secret (`AUTH_COOKIE_SECRET`)
- Project briefs, generated artifacts, audit reports
- Review decisions and approval logs
- Internal API keys and environment secrets

## Trust Boundaries
- Browser <-> `studio-web` API
- `studio-web` <-> package services (`agent-runtime`, `ux-audit`)
- Service runtime <-> local filesystem stores
- Runtime <-> external URL fetches (snapshot service)

## STRIDE Analysis

### S: Spoofing
Threats:
- Session token forgery
- Reviewer identity spoofing in approvals
Controls:
- Signed auth cookies with HMAC SHA-256 (`AUTH_COOKIE_SECRET`)
- Server-side session validation (`requireSession`/`requireRole`)
- Role hierarchy authorization checks
Gaps:
- No MFA / external IdP integration
- Reviewer identity currently self-asserted in UI

### T: Tampering
Threats:
- Mutation of stored run/artifact/snapshot files
- Request payload manipulation on protected endpoints
Controls:
- Idempotency key conflict detection
- Schema validation + retry pipeline for generated outputs
- Audit gate thresholds/regression checks
Gaps:
- No integrity checksum verification for persisted files at read-time
- No immutable append-only store for review decisions

### R: Repudiation
Threats:
- Reviewer denies approve/reject actions
- Operator denies security-sensitive configuration changes
Controls:
- Run review event log (timestamp/action/reviewer/note)
- Workflow event logs with correlation IDs
Gaps:
- No cryptographic signing of audit trail events
- No centralized immutable audit log sink

### I: Information Disclosure
Threats:
- Secrets leaked via logs or misconfigured env files
- Sensitive project data exposed through unauthorized APIs
- SSRF-style data exfiltration via snapshot URL fetches
Controls:
- `.env*` ignore rules with committed `.env.example` template
- Protected route middleware and server guard checks
- Session cookies `httpOnly` + `sameSite`
Gaps:
- Snapshot URL allowlist/denylist not implemented
- No data classification/redaction policy for logs

### D: Denial of Service
Threats:
- High-frequency run generation/audit requests
- Expensive HTML snapshots against slow endpoints
- Unbounded local storage growth
Controls:
- Snapshot request timeout
- Artifact/snapshot retention patterns documented
Gaps:
- No rate limiting at API boundary
- No quotas per workspace/project
- No storage pressure monitors/alerts

### E: Elevation of Privilege
Threats:
- Viewer gaining editor/admin API access
- Bypass of route-level role enforcement
Controls:
- Role-weight checks in server guards
- Protected route middleware for `/api/protected/*`
Gaps:
- Missing policy tests for every protected route
- No centralized authorization policy engine

## Control Matrix
- `PS-401` covers baseline AuthN/AuthZ controls.
- `PS-201` covers schema-safe output enforcement.
- `PS-202` covers workflow event logging and resumability.
- `PS-203` covers duplicate request tampering/replay control.
- `PS-302` covers release quality/security-adjacent gates.

## High-Risk Findings (Immediate)
1. Snapshot fetch lacks SSRF safeguards (`High`)
2. No API rate limiting (`High`)
3. Reviewer identity trust is UI-supplied (`High`)
4. Audit/event logs are mutable local files (`High`)

## Mitigation Tickets
1. `PS-502A` Add snapshot URL validation (allowlist + private network block).
2. `PS-502B` Add output sanitization and malicious content detection.
3. `PS-601A` Add structured, centralized, immutable audit logging.
4. `PS-602A` Add API rate limiting and abuse throttles.
5. `PS-401A` Bind reviewer identity to authenticated session only.

## Residual Risk Statement
Current security baseline is suitable for controlled internal development but not for open public production without completing high-risk mitigations above.
