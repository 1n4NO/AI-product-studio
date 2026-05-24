# Integration Tests

Add end-to-end pipeline tests here for brief -> blueprint -> draft -> audit -> export.

Current baseline:
- Fixture input: `tests/integration/fixtures/brief.json`
- Golden snapshot: `tests/integration/golden/audit-expectation.json`
- Executed by: `packages/agent-runtime/test/pipeline-integration.test.ts`
