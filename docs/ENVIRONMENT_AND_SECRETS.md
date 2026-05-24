# Environment and Secrets Management (PS-102)

## Objective
Standardize environment configuration and secret handling across development, staging, and production.

## Environment Files
- `.env.example`: committed template with required keys and placeholders.
- `.env.local`: local-only values (ignored by git).
- Staging/Production: managed in deployment secret store, never committed.

## Required Variables
- `NEXT_PUBLIC_APP_ENV` (`development|staging|production`)
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_BASE_URL`

## Optional Variables
- `INTERNAL_API_KEY` (server-only secret)
- `OTEL_EXPORTER_OTLP_ENDPOINT` (server-only)

## Validation
Run `npm run env:check` before local development and in CI for deploy jobs.

Validation rules:
- `NEXT_PUBLIC_APP_ENV` must be `development|staging|production`.
- For `staging` and `production`, `AUTH_COOKIE_SECRET` and `INTERNAL_API_KEY` are required.
- Placeholder secret values (e.g. `replace_me`) are rejected for non-development environments.

## Environment Parity Matrix
- Development
  - Source: `.env.local`
  - URL: `http://localhost:3000`
  - Secrets: local machine only
- Staging
  - Source: managed secret store
  - URL: staging domain
  - Secrets: short-lived + rotated
- Production
  - Source: managed secret store
  - URL: production domain
  - Secrets: short-lived + rotated with approval

## Secret Rotation Runbook
1. Generate new secret value in approved secret manager.
2. Add new secret version for staging and production.
3. Deploy staging with new secret and run smoke checks.
4. Promote to production after validation.
5. Revoke old secret version.
6. Record rotation date, owner, and affected systems.

## Guardrails
- Never commit `.env`, `.env.local`, `.env.*` with real values.
- Keep only placeholders in `.env.example`.
- Treat `NEXT_PUBLIC_*` as non-secret values.
- Store server-side secrets only in backend/deploy secret stores.
