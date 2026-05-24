# Artifact Storage Strategy (PS-103)

## Current Implementation
- Storage backend: local filesystem under `.artifacts/`
- Metadata index: `.artifacts/index.json`
- Hierarchy: `.artifacts/<project-id>/<run-id>/<kind>-<artifact-id>.<ext>`

## API (agent-runtime)
- `createArtifactStore(options)`
- `saveArtifact(input)`
- `listArtifacts(projectId, runId?)`
- `getArtifactContent(id)`
- `listProjectRuns(projectId)`
- `cleanupArtifacts(retentionDays)`
- `stats()`

## Retention Policy
- Cleanup method removes files + index rows older than retention threshold.
- Recommended defaults:
  - `development`: 7 days
  - `staging`: 14 days
  - `production`: 30 days (or compliance requirement)

## Migration Path to Durable Storage
1. Keep the public `ArtifactStore` API stable.
2. Add object-store implementation (S3/GCS compatible).
3. Move metadata index to DB table (`artifacts`) with project/run composite indexes.
4. Keep file backend for local development.

## Operational Notes
- `.artifacts/` is ignored from git and should not be committed.
- Export bundle retrieval should use artifact IDs, not file paths.
- Logs should include `projectId`, `runId`, and `artifactId` for traceability.
