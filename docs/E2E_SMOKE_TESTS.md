# E2E Smoke Tests (PS-703)

Playwright smoke coverage is now wired for the Studio app.

## Added

- Config: `apps/studio-web/playwright.config.ts`
- Smoke spec: `apps/studio-web/e2e/studio-smoke.spec.ts`
- Scripts in `apps/studio-web/package.json`:
  - `test`
  - `test:smoke`

## Covered Journey

- Load Studio home page.
- Generate a run.
- Verify core panels render:
  - Run History
  - SLO Dashboard
  - Audit Panel

## Local command

`npm run --workspace @product-studio/studio-web test:smoke`
