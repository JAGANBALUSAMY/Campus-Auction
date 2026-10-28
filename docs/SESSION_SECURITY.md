# Authentication session security

Phase 1 uses a short-lived JWT access session in an `HttpOnly` cookie.
`JWT_SECRET_KEY` signs the token and must be a randomly generated secret with
at least 32 characters. It is read only by the backend and must never be
prefixed with `VITE_`.

The access token expires after 15 minutes by default. The `campus_access_token`
cookie is `HttpOnly`, `SameSite=Lax`, and scoped to the application path. For
production, set `AUTH_COOKIE_SECURE=true` and serve the frontend and API over
HTTPS. Local HTTP development leaves `Secure` disabled so the browser sends the
cookie to localhost. `SameSite=None` is rejected unless secure cookies are
enabled.

Login also sets a separate, readable `campus_csrf_token` cookie. The token's
random value is bound into the signed JWT. Logout must send the same value in
the `X-CSRF-Token` header; the API compares the header and cookie to the signed
claim. Cookie-authenticated browser writes must follow this double-submit
pattern. The API also rejects a supplied browser `Origin` that is not in
`CORS_ALLOWED_ORIGINS`; CORS alone is not considered CSRF protection. Requests
without an `Origin` are permitted for non-browser clients, but they must still
provide valid authentication for protected endpoints.

There is intentionally no refresh token or long-lived browser token. When the
access cookie expires, `/api/v1/auth/me` reports an unauthenticated session and
the student must sign in again. Logout clears both cookies; it does not persist
server-side token state, so an already copied token remains valid until its
short expiration. Protect the signing secret and use HTTPS in any deployed
environment.

Registration creates the account but does not automatically sign the student
in. On success, the frontend navigates to the login page.
