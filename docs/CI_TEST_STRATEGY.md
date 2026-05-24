# CI Test Strategy Baseline

CI test execution is split into explicit stages:

- Runtime contract/unit tests:
  - `npm run --workspace @product-studio/agent-runtime test`
- Audit gate contract tests:
  - `npm run --workspace @product-studio/ux-audit test`
- Studio browser smoke test:
  - `npm run --workspace @product-studio/studio-web test:smoke`

This avoids hidden workspace test coupling and keeps failures attributable to a specific quality gate.
