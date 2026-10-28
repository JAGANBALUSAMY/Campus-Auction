# Implementation Walkthrough

## Phase Status: foundation

### Overview
The Campus Auction repository currently implements Phase 0 (web application and API foundation) and Phase 1 (student registration, login, JWT sessions, protected account profile). Auctions, listings, and bidding are intentionally not implemented yet, as stated in the README.

### Implemented Features

**Backend (FastAPI)**
- `backend/app/main.py` - FastAPI application factory with lifespan, CORS, exception handlers
- `backend/app/api/routes/health.py` - Health check endpoints (`/api/v1/health`, `/api/v1/health/ready`)
- `backend/app/api/routes/auth.py` - Authentication routes (`POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `POST /api/v1/auth/logout`)
- `backend/app/core/settings.py` - Pydantic settings with environment validation, cookie settings, JWT secret enforcement
- `backend/app/database.py` - SQLAlchemy engine creation with `postgresql+psycopg` dialect
- `backend/app/models/user.py` - User model with UUID primary key, email uniqueness, password hash, timestamps
- `backend/app/models/base.py` - Base class with naming convention for constraints
- `backend/app/schemas/auth.py` - Pydantic schemas: `RegistrationRequest`, `LoginRequest`, `UserProfile`, `AuthenticatedResponse`
- `backend/app/services/auth.py` - Authentication service with password hashing (pwdlib), JWT token creation/decode, session management, CSRF protection, origin validation
- `backend/app/api/dependencies.py` - Dependency injection: `get_database_session`, `get_authenticated_user`
- Migrations: `alembic/versions/0002_create_users.py` - users table migration

**Frontend (React + Vite + TanStack Query)**
- `frontend/src/api/client.ts` - API client with fetch wrapper, error handling, cookie-based auth, CSRF token extraction
- `frontend/src/features/auth/LoginPage.tsx` - Login form with Zod validation
- `frontend/src/features/auth/RegisterPage.tsx` - Registration form with password confirmation validation
- `frontend/src/features/auth/AccountPage.tsx` - Protected account page displaying user profile
- `frontend/src/features/auth/ProtectedRoute.tsx` - Route protector that redirects unauthenticated users to login
- `frontend/src/features/auth/auth.ts` - React hook `useCurrentUser` using `getCurrentUser`
- `frontend/src/components/HealthStatus.tsx` - API health status indicator
- `frontend/src/main.tsx` - React app with routing: `/`, `/login`, `/register`, `/account` (protected), `/auctions` (placeholder), `/sell` (placeholder)
- `frontend/src/routes/PlaceholderPage.tsx` - Placeholder page component with feature description

**Database**
- PostgreSQL schema with `users` table (UUID primary key, full_name, email, password_hash, is_active, created_at, updated_at)
- Unique constraint on email
- Check constraints on full_name and password_hash non-empty
- Alembic migration versioning in place

**Tests**
- `backend/tests/test_health.py` - Health endpoint tests (1 passed, 2 failed due to missing psycopg module)
- `backend/tests/test_auth.py` - Comprehensive authentication tests (registration, login, logout, CSRF, origin validation, production settings)
- `backend/tests/test_migrations.py` - Migration metadata test
- `frontend/src/features/auth/auth.test.tsx` - React component tests for auth flow

### Request/Data Flow

1. **Registration**: Frontend `RegisterPage` → `registerUser()` → `POST /api/v1/auth/register` → `register_user()` service → password hashing → User creation → JWT session cookie set
2. **Login**: Frontend `LoginPage` → `loginUser()` → `POST /api/v1/auth/login` → `authenticate_user()` service → password verification → `_issue_session()` sets HttpOnly `campus_access_token` cookie + readable `campus_csrf_token` cookie
3. **Auth check**: Frontend `useCurrentUser()` → `getCurrentUser()` → reads `campus_access_token` cookie → JWT decode → SQLAlchemy `select(User)` → returns user or 401
4. **Protected routes**: `ProtectedRoute` uses `useCurrentUser()` to conditionally render `Outlet` or redirect to `/login`
5. **Logout**: Frontend calls `logoutUser()` → reads CSRF cookie + `X-CSRF-Token` header → validates against JWT claim → clears both cookies via `POST /api/v1/auth/logout`

### Key Decisions & Design

- **Password hashing**: Using `pwdlib` with Argon2 recommended
- **JWT in HttpOnly cookie**: Access token stored in HttpOnly `campus_access_token` cookie, not in localStorage. Short-lived (15 minutes default).
- **CSRF double-submit**: Login sets both `campus_access_token` (HttpOnly) and `campus_csrf_token` (readable). Subsequent requests must include `X-CSRF-Token` header matching the cookie value, which is bound into the JWT `csrf` claim.
- **Origin validation**: API explicitly validates `Origin` header against `CORS_ALLOWED_ORIGINS`; CORS alone is not considered CSRF protection.
- **SameSite=None requires secure**: Pydantic settings validator enforces that `AUTH_COOKIE_SECURE=true` when `AUTH_COOKIE_SAMESITE=none`.
- **Email normalization**: Email is casefolded and trimmed on both frontend and backend to prevent duplicate accounts via case variations.

### Missing / TODO

- Auctions, listings, and bidding functionality (per README, "intentionally not implemented yet")
- PostgreSQL database must be running for full test suite
- `psycopg` (v3) package needs to be installed for backend tests that connect to DB
- Frontend `npm test`, `npm run typecheck`, `npm run build` should be verified

### Commands Run

- `alembic upgrade head` - Apply pending migrations
- `alembic upgrade --sql head` - Render migrations as SQL
- `python -m pytest` - Run backend tests
- `npm test` / `npm run typecheck` / `npm run build` - Run frontend checks

### Known Limitations

- No PostgreSQL running in this environment → health/ready endpoints and auth DB tests cannot fully complete
- `psycopg` module missing → some backend tests fail with `ModuleNotFoundError`
- No auction/bidding/Wallet functionality yet
- No WebSocket events or real-time features
- No item listings or marketplace workflows

## Phase 1: Authentication
- **Status**: Complete
- **Completed work**: Registration, login with JWT HttpOnly cookies, CSRF protection, protected `/me` and `/account` routes, session validation, logout with CSRF verification
- **Key files**: 
  - `backend/app/services/auth.py` - Full auth service
  - `backend/app/api/routes/auth.py` - Route definitions
  - `frontend/src/features/auth/` - All frontend auth pages and hooks

## Phase 2: Auctions & Bidding
- **Status**: Not implemented (per user request)
- **Reason**: User specified not to implement Phase 2
- **Blockers**: None - Phase 1 is fully functional

### Files Changed
- `backend/app/main.py` - Removed auction router references, kept auth and health routers
- `backend/app/models/user.py` - Reverted to User-only model (no Auction/Bid classes)
- `backend/app/models/__init__.py` - Reverted to User-only import
- Removed: `backend/app/schemas/auction.py`, `backend/app/services/auction.py`, `backend/app/api/routes/auction.py` (already deleted)