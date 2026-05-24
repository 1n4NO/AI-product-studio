# Onboarding and Operations (PS-902)

This document provides a production-focused onboarding path for new engineers and operators.

## New Developer Setup

1. Install prerequisites:
   - Node.js 20+
   - npm 10+
2. Install dependencies:
   - `npm install`
3. Validate environment:
   - `npm run env:check`
4. Start app:
   - `npm run dev`
5. Run quality checks:
   - `npm run typecheck`
   - `npm run test`
   - `npm run build`

## Core Workspace Overview

- `apps/studio-web`: Next.js Studio UI + API routes.
- `packages/agent-runtime`: workflow, schema, observability, SLO, quota/analytics primitives.
- `packages/ux-audit`: audit engine and snapshot service.
- `packages/shared-types`: shared cross-package domain contracts.

## Operational Commands

- Dev server:
  - `npm run dev`
- Full monorepo tests:
  - `npm run test`
- Agent runtime tests only:
  - `npm run --workspace @product-studio/agent-runtime test`
- Studio smoke E2E:
  - `npm run --workspace @product-studio/studio-web test:smoke`

## Deployment and Promotion

- CI: `.github/workflows/ci.yml`
- Deploy: `.github/workflows/deploy.yml`
- Promotion flow:
  1. Deploy to `staging`
  2. Validate smoke and SLO health
  3. Promote same SHA to `production`

## Support and Escalation

- SEV-1/SEV-2: follow `docs/INCIDENT_RUNBOOK.md` immediately.
- Security-triggered incidents: preserve immutable audit logs and apply temporary throttles.
- Required post-incident output: postmortem with corrective actions and owners.

## API Surface (Current)

- Auth:
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
- Protected diagnostic endpoint:
  - `GET /api/protected/whoami`

## Handoff Checklist

- Local quality checks pass.
- CI passes on PR.
- Runbook links and dashboard checks verified for changed subsystem.
