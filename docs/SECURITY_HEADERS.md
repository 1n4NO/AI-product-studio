# Security Headers Baseline (PS-501B)

Applied baseline HTTP security headers in middleware responses.

## Implemented

- File: `apps/studio-web/middleware.ts`
- Headers:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Cross-Origin-Opener-Policy: same-origin`
  - `Cross-Origin-Resource-Policy: same-origin`

## Notes

- Headers are applied to both protected API responses and non-protected pass-through responses.
- CSP is intentionally deferred to a follow-up ticket so nonce/hash strategy can be aligned with Next.js rendering paths.
