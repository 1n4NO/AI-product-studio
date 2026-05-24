# Rendering and Snapshot Service (PS-303)

## Goal
Create stable audit inputs by snapshotting normalized HTML with reproducible IDs and metadata.

## Snapshot Model
- `id`: deterministic prefix + timestamp + content hash segment
- `source`: URL or source label
- `createdAt`: ISO timestamp
- `contentHash`: SHA-256 of normalized HTML
- `html`: normalized content used for audit
- `byteLength`: snapshot size

## API
- `createSnapshotService(options)`
- `snapshotService.createFromUrl(url)`
- `snapshotService.createFromHtml(source, html)`

## Stability Strategy
- Normalize line endings and whitespace
- Collapse inter-tag spacing
- Persist immutable snapshot JSON under `.snapshots/`
- Audit should target snapshot HTML, not live mutable page content

## Operational Notes
- Snapshot fetch timeout defaults to 15s.
- Snapshot files are local artifacts and should not be committed.
- For production scale, replace local persistence with object storage.

## SSRF Safeguards (PS-502A)
- Only `http` and `https` protocols are allowed.
- URLs with embedded credentials are rejected.
- Optional host allowlist supported via `allowedHosts`.
- Local/private/internal targets are blocked:
  - hostnames: `localhost`, `*.local`, `*.internal`
  - IP ranges: loopback/link-local/private IPv4 and local/private IPv6
- Redirect mode is `error` to prevent redirect-based bypass.
