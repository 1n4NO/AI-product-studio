# AuthN/AuthZ Baseline (PS-401)

## Roles
- `admin`
- `editor`
- `viewer`

Role hierarchy:
- `admin` > `editor` > `viewer`

## Session Model
- Cookie name: `ps_session`
- Session payload fields:
  - user id
  - email
  - role
  - issuedAt
  - expiresAt
- Cookie is signed (HMAC SHA-256) with `AUTH_COOKIE_SECRET`.

## API Endpoints
- `POST /api/auth/login`
  - Body: `{ id, email, role }`
  - Creates signed session cookie
- `POST /api/auth/logout`
  - Clears session cookie
- `GET /api/auth/me`
  - Returns current user session (requires auth)
- `GET /api/protected/whoami`
  - Protected route example (requires `viewer` or higher)

## Middleware Guard
- `middleware.ts` protects `/api/protected/:path*`
- Invalid/missing session returns `401`

## Server-side Helpers
- `requireSession()`
- `requireRole(minRole)`

## Security Notes
- Auth cookie is `httpOnly`, `sameSite=lax`, `secure=true`.
- Session signature verification uses timing-safe compare.
- Configure `AUTH_COOKIE_SECRET` per environment and rotate regularly.
