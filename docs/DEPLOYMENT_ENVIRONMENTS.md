# Stage and Production Environments (PS-801)

This baseline adds explicit staging/production deployment workflow separation.

## What was added

- `deploy` GitHub Actions workflow:
  - file: `.github/workflows/deploy.yml`
  - manual trigger via `workflow_dispatch`
  - target selection: `staging` or `production`
  - environment-scoped job using GitHub Environments
  - pre-deploy gate: `typecheck` + `build`

## Promotion model

1. Deploy to `staging`.
2. Validate smoke checks and key user journeys.
3. Deploy same commit SHA to `production`.

## Required GitHub setup

- Create GitHub Environments:
  - `staging`
  - `production`
- Add environment secrets per target.
- Configure required reviewers on `production` environment for manual approval.

## Next step to complete productionization

- Replace the `Deploy placeholder` step with actual platform deploy command.
- Add post-deploy health check + automatic rollback hook.
